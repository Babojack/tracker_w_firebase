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
import { db, auth } from '../../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

interface WishlistItem {
  id: string; // Firestore document ID
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  price: string;
  url: string;
  category: string;
  targetDate: string;
  createdAt: number;
  image: string;
  userId: string;
}

interface Category {
  id: string; // Category ID
  name: string;
  userId: string;
}

// Predefined 15 categories in English (userId is left empty since categories are static)
const PREDEFINED_CATEGORIES: Category[] = [
  { id: 'tech', name: 'Technology', userId: '' },
  { id: 'clothing', name: 'Clothing', userId: '' },
  { id: 'books', name: 'Books', userId: '' },
  { id: 'electronics', name: 'Electronics', userId: '' },
  { id: 'furniture', name: 'Furniture', userId: '' },
  { id: 'beauty', name: 'Beauty', userId: '' },
  { id: 'sports', name: 'Sports', userId: '' },
  { id: 'toys', name: 'Toys', userId: '' },
  { id: 'games', name: 'Games', userId: '' },
  { id: 'grocery', name: 'Grocery', userId: '' },
  { id: 'automotive', name: 'Automotive', userId: '' },
  { id: 'health', name: 'Health', userId: '' },
  { id: 'outdoors', name: 'Outdoors', userId: '' },
  { id: 'office', name: 'Office', userId: '' },
  { id: 'other', name: 'Other', userId: '' },
];

const WishlistTracker: React.FC = () => {
  // =================== STATE ===================
  const [items, setItems] = useState<WishlistItem[]>([]);
  // Use the predefined categories – no adding or deleting allowed
  const [categories] = useState<Category[]>(PREDEFINED_CATEGORIES);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPriority, setItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemTargetDate, setItemTargetDate] = useState('');
  const [itemImage, setItemImage] = useState('');

  // =================== DATA LOADING ===================
  // Fetch wishlist items from Firestore (global collection filtered by userId)
  const fetchWishlistItems = async (uid: string) => {
    try {
      const itemsQuery = query(collection(db, 'wishlist'), where('userId', '==', uid));
      const itemsSnap = await getDocs(itemsQuery);
      const loadedItems: WishlistItem[] = itemsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<WishlistItem, 'id'>),
      }));
      setItems(loadedItems);
      console.log('Loaded wishlist items:', loadedItems);
    } catch (err) {
      console.error('Error loading wishlist items:', err);
    }
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    // Set default category to the first predefined category if not already set
    if (!itemCategory && categories.length > 0) {
      setItemCategory(categories[0].id);
    }
    fetchWishlistItems(uid);
  }, [itemCategory, categories]);

  // =================== WISHLIST FORM (CREATE/UPDATE) ===================

  // Reset form fields
  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPriority('medium');
    setItemPrice('');
    setItemUrl('');
    setItemCategory(categories[0]?.id || '');
    setItemTargetDate('');
    setItemImage('');
    setIsAdding(false);
    setEditingId(null);
  };

  // Handle image upload (Base64)
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

  // Submit form to create or update a wishlist item
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!itemPrice.trim() || !itemImage.trim()) {
      alert('Please fill required fields: Price and Image.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('User is not logged in!');
      return;
    }

    const newItemData = {
      name: itemName,
      description: itemDescription,
      priority: itemPriority,
      price: itemPrice,
      url: itemUrl,
      category: itemCategory,
      targetDate: itemTargetDate,
      createdAt: editingId
        ? items.find((i) => i.id === editingId)?.createdAt || Date.now()
        : Date.now(),
      image: itemImage,
      userId: uid,
    };

    console.log('Submitting item data:', newItemData);

    try {
      if (editingId) {
        await updateDoc(doc(db, 'wishlist', editingId), newItemData);
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? { id: editingId, ...newItemData } : item))
        );
      } else {
        const docRef = await addDoc(collection(db, 'wishlist'), newItemData);
        setItems((prev) => [...prev, { id: docRef.id, ...newItemData }]);
      }
    } catch (err) {
      console.error('Error saving wishlist item:', err);
    }

    resetForm();
  };

  // Start editing a wishlist item
  const startEditing = (item: WishlistItem) => {
    setEditingId(item.id);
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

  // Delete a wishlist item
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wishlist', id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      console.log('Wishlist item deleted:', id);
    } catch (err) {
      console.error('Error deleting wishlist item:', err);
    }
  };

  // =================== IMPORT / EXPORT ===================
  const importData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!Array.isArray(data.items)) {
          throw new Error('Invalid JSON format');
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
          alert('User not logged in!');
          return;
        }

        // Import wishlist items into the global collection
        for (const rawItem of data.items) {
          const itemWithUid: Omit<WishlistItem, 'id'> = {
            ...rawItem,
            userId: uid,
          };
          await addDoc(collection(db, 'wishlist'), itemWithUid);
        }

        await fetchWishlistItems(uid);
        alert('Import successful!');
      } catch (err) {
        alert('Error during import!');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    try {
      const exportObj = { items };
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

  // =================== FILTER & SORT ===================
  const filteredItems = items.filter(
    (item) => filter === 'all' || item.category === filter
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date') {
      return b.createdAt - a.createdAt;
    } else if (sortBy === 'price') {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    } else if (sortBy === 'priority') {
      const vals = { high: 3, medium: 2, low: 1 };
      return vals[b.priority] - vals[a.priority];
    }
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // =================== RENDER ===================
  return (
    <div className="space-y-6 p-4">
      {/* Header: Export / Import */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Wishlist</h2>
        <div className="flex gap-3">
          <button onClick={exportData} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
            <Download size={18} /> Export
          </button>
          <label className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer">
            <Upload size={18} /> Import
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="date">By Date</option>
            <option value="price">By Price</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          New Wish
        </button>
      </div>

      {/* Form: Create / Edit Wishlist Item */}
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name*</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">Price (€)*</label>
                <input
                  type="text"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={itemPriority}
                  onChange={(e) => setItemPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input
                  type="date"
                  value={itemTargetDate}
                  onChange={(e) => setItemTargetDate(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Image* {editingId ? '(leave empty to keep current)' : ''}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500"
                  required={!editingId || (!editingId && !itemImage)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1"
              >
                <Save size={18} /> Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedItems.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">No wishes found in this category.</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div key={item.id} className="bg-gray-700 rounded-lg p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(item)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                </span>
                {categories.find((c) => c.id === item.category) && (
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                    {categories.find((c) => c.id === item.category)?.name}
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
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
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
