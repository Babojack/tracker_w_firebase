import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import {
  Trash2,
  Edit,
  Save,
  X,
  ExternalLink,
  DollarSign,
  Calendar,
  Download,
  Upload,
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

interface WishlistItem {
  id?: string; // Beim Speichern neu: id wird von Firestore generiert
  name: string;
  description: string;
  priority: 'niedrig' | 'mittel' | 'hoch';
  price: string;
  url: string;
  category: string;
  targetDate: string;
  createdAt: number;
  image?: string;
}

interface Category {
  id: string;
  name: string;
}

const WishlistTracker: React.FC = () => {
  // STATES für Items, Kategorien und Formular
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPriority, setItemPriority] = useState<'niedrig' | 'mittel' | 'hoch'>('mittel');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemTargetDate, setItemTargetDate] = useState('');
  const [itemImage, setItemImage] = useState<string | undefined>(undefined);

  // Items und Kategorien aus Firestore laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsSnap = await getDocs(collection(db, 'wishlist'));
        const loadedItems = itemsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as WishlistItem[];
        console.log('Loaded wishlist items:', loadedItems);
        setItems(loadedItems);
      } catch (err) {
        console.error('Error loading wishlist items:', err);
      }
      try {
        const catsSnap = await getDocs(collection(db, 'wishlist_categories'));
        let loadedCategories = catsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Category[];

        // Falls keine Kategorien vorhanden sind, Standardkategorien erstellen
        if (loadedCategories.length === 0) {
          loadedCategories = [
            { id: 'tech', name: 'Technology' },
            { id: 'kleidung', name: 'Clothing' },
            { id: 'hobby', name: 'Hobby' },
            { id: 'haushalt', name: 'Household' },
            { id: 'sonstiges', name: 'Miscellaneous' },
          ];
          for (const cat of loadedCategories) {
            try {
              await addDoc(collection(db, 'wishlist_categories'), cat);
            } catch (err) {
              console.error('Error adding default category:', err);
            }
          }
        }
        console.log('Loaded wishlist categories:', loadedCategories);
        setCategories(loadedCategories);
      } catch (err) {
        console.error('Error loading wishlist categories:', err);
      }
    };

    fetchData();
  }, []);

  // Standardkategorie setzen, falls noch nichts ausgewählt ist
  useEffect(() => {
    if (!itemCategory && categories.length > 0) {
      setItemCategory(categories[0].id);
    }
  }, [categories, itemCategory]);

  // Neue Kategorie hinzufügen
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const categoryId = newCategory.toLowerCase().replace(/\s+/g, '-');
    if (!categories.find(cat => cat.id === categoryId)) {
      const newCat: Category = { id: categoryId, name: newCategory };
      try {
        await addDoc(collection(db, 'wishlist_categories'), newCat);
        setCategories(prev => [...prev, newCat]);
      } catch (err) {
        console.error('Error adding new category:', err);
      }
    }
    setNewCategory('');
  };

  // Formular zurücksetzen
  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPriority('mittel');
    setItemPrice('');
    setItemUrl('');
    setItemCategory(categories[0]?.id || '');
    setItemTargetDate('');
    setItemImage(undefined);
    setIsAdding(false);
    setEditingId(null);
  };

  // Bild als Base64 laden
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setItemImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Formular absenden: Neues Item anlegen oder vorhandenes aktualisieren
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Zum Hinzufügen soll _keine_ id gesendet werden – update schickt man über editingId
    const newItemData: Omit<WishlistItem, 'id'> = {
      name: itemName,
      description: itemDescription,
      priority: itemPriority,
      price: itemPrice,
      url: itemUrl,
      category: itemCategory,
      targetDate: itemTargetDate,
      createdAt: editingId
        ? items.find(i => i.id === editingId)?.createdAt || Date.now()
        : Date.now(),
      image: itemImage,
    };

    console.log('handleSubmit newItemData:', newItemData);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'wishlist', editingId), newItemData);
        setItems(prev =>
          prev.map(item =>
            item.id === editingId ? { id: editingId, ...newItemData } : item
          )
        );
      } else {
        const docRef = await addDoc(collection(db, 'wishlist'), newItemData);
        setItems(prev => [...prev, { id: docRef.id, ...newItemData }]);
      }
    } catch (err) {
      console.error('Error saving wishlist item:', err);
    }
    resetForm();
  };

  // Bearbeitung starten
  const startEditing = (item: WishlistItem) => {
    setEditingId(item.id!);
    setItemName(item.name);
    setItemDescription(item.description);
    setItemPriority(item.priority);
    setItemPrice(item.price);
    setItemUrl(item.url);
    setItemCategory(item.category);
    setItemTargetDate(item.targetDate);
    setItemImage(item.image);
    setIsAdding(true);
  };

  // Item löschen
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wishlist', id));
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting wishlist item:', err);
    }
  };

  // Import / Export
  const handleImportData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.items) || !Array.isArray(data.categories)) {
          throw new Error('Invalid JSON format');
        }
        // Kategorien importieren
        for (const cat of data.categories) {
          try {
            await addDoc(collection(db, 'wishlist_categories'), cat);
          } catch (err) {
            console.error('Error importing category:', err);
          }
        }
        // Items importieren
        for (const item of data.items) {
          try {
            await addDoc(collection(db, 'wishlist'), item);
          } catch (err) {
            console.error('Error importing wishlist item:', err);
          }
        }
        // Neu laden
        const itemsSnap = await getDocs(collection(db, 'wishlist'));
        const loadedItems = itemsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as WishlistItem[];
        setItems(loadedItems);

        const catsSnap = await getDocs(collection(db, 'wishlist_categories'));
        const loadedCategories = catsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Category[];
        setCategories(loadedCategories);

        alert('Import successful!');
      } catch (err) {
        alert('Error during import!');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleExportData = () => {
    try {
      const exportObj = { items, categories };
      const jsonStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wishlist_backup.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error during export');
      console.error(err);
    }
  };

  // Filter und Sortierung
  const filteredItems = items.filter(item => filter === 'all' || item.category === filter);
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date') {
      return b.createdAt - a.createdAt;
    } else if (sortBy === 'price') {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    } else if (sortBy === 'priority') {
      const vals = { hoch: 3, mittel: 2, niedrig: 1 };
      return vals[b.priority] - vals[a.priority];
    }
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hoch': return 'bg-red-500';
      case 'mittel': return 'bg-yellow-500';
      case 'niedrig': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header: Export / Import */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Wishlist</h2>
        <div className="flex gap-3">
          <button onClick={handleExportData} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Download size={18} /> Export
          </button>
          <label className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer">
            <Upload size={18} /> Import
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter und Sortierung */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded">
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-700 text-white px-3 py-2 rounded">
            <option value="date">By Date</option>
            <option value="price">By Price</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          New Wish
        </button>
      </div>

      {/* Formular für Hinzufügen/Bearbeiten */}
      {isAdding && (
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingId ? 'Edit Wish' : 'Add New Wish'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name*</label>
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-gray-800 text-white px-3 py-2 rounded">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (€)</label>
                <input type="text" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="0.00" className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select value={itemPriority} onChange={(e) => setItemPriority(e.target.value as 'niedrig' | 'mittel' | 'hoch')} className="w-full bg-gray-800 text-white px-3 py-2 rounded">
                  <option value="niedrig">Low</option>
                  <option value="mittel">Medium</option>
                  <option value="hoch">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input type="url" value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="https://" className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input type="date" value={itemTargetDate} onChange={(e) => setItemTargetDate(e.target.value)} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500 mt-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} rows={3} className="w-full bg-gray-800 text-white px-3 py-2 rounded" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1">
                <Save size={18} /> Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kategorienverwaltung */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Manage Categories</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <span key={cat.id} className="bg-gray-600 px-3 py-1 rounded">{cat.name}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 bg-gray-800 text-white px-3 py-2 rounded" placeholder="New Category..." />
          <button onClick={handleAddCategory} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
      </div>

      {/* Anzeige der Wishlist-Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedItems.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">No wishes found in this category.</p>
          </div>
        ) : (
          sortedItems.map(item => (
            <div key={item.id} className="bg-gray-700 rounded-lg p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => startEditing(item)} className="text-blue-400 hover:text-blue-300 p-1">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteItem(item.id!)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                {categories.find(c => c.id === item.category) && (
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                    {categories.find(c => c.id === item.category)?.name}
                  </span>
                )}
              </div>
              {item.image && (
                <div className="mb-2">
                  <img src={item.image} alt="Wish Item" className="max-w-full h-auto rounded" />
                </div>
              )}
              {item.description && (
                <p className="text-gray-300 text-sm mb-3 flex-grow">{item.description}</p>
              )}
              <div className="mt-auto space-y-1 pt-2 border-t border-gray-600">
                {item.price && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign size={14} className="text-green-400" />
                    <span>{item.price} €</span>
                  </div>
                )}
                {item.targetDate && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} className="text-blue-400" />
                    <span>{new Date(item.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                    <ExternalLink size={14} /> Link
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WishlistTracker;
