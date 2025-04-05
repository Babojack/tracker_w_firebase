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
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

interface WishlistItem {
  id: string;  // всегда хранить реальный ID (от Firestore)
  name: string;
  description: string;
  priority: 'niedrig' | 'mittel' | 'hoch';
  price: string;
  url: string;
  category: string;
  targetDate: string;
  createdAt: number;
  image: string;
  userId: string;
}

interface Category {
  id: string;  // Firestore ID
  name: string;
  userId: string;
}

const WishlistTracker: React.FC = () => {
  // =================== STATE ===================
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Состояние для управления новым вводом категории
  const [newCategory, setNewCategory] = useState('');

  // Фильтрация / сортировка
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Форма добавления/редактирования
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Поля формы
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPriority, setItemPriority] = useState<'niedrig' | 'mittel' | 'hoch'>('mittel');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemTargetDate, setItemTargetDate] = useState('');
  const [itemImage, setItemImage] = useState('');

  // =================== DATA LOADING ===================

  // Загрузка wishlist items
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

  // Загрузка категорий (если нет — создаём дефолтные)
  const fetchWishlistCategories = async (uid: string) => {
    try {
      const catsQuery = query(collection(db, 'wishlist_categories'), where('userId', '==', uid));
      const catsSnap = await getDocs(catsQuery);

      let loadedCategories: Category[] = catsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Category, 'id'>),
      }));

      // Если нет ни одной категории, создаём дефолтные
      if (loadedCategories.length === 0) {
        loadedCategories = [
          { id: 'tech',      name: 'Technology',   userId: uid },
          { id: 'kleidung',  name: 'Clothing',     userId: uid },
          { id: 'hobby',     name: 'Hobby',        userId: uid },
          { id: 'haushalt',  name: 'Household',    userId: uid },
          { id: 'sonstiges', name: 'Miscellaneous', userId: uid },
        ];
        for (const cat of loadedCategories) {
          // Воспользуемся setDoc, чтобы ID совпадал с cat.id
          await setDoc(doc(db, 'wishlist_categories', cat.id), cat);
        }
      }

      setCategories(loadedCategories);
      console.log('Loaded wishlist categories:', loadedCategories);
    } catch (err) {
      console.error('Error loading wishlist categories:', err);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Загружаем всё параллельно
    fetchWishlistItems(uid);
    fetchWishlistCategories(uid);
  }, []);

  // Если не выбрана категория, то устанавливаем первую из списка
  useEffect(() => {
    if (!itemCategory && categories.length > 0) {
      setItemCategory(categories[0].id);
    }
  }, [categories, itemCategory]);

  // =================== CATEGORY OPERATIONS ===================

  // Добавить новую категорию
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    // Используем id = userInput.toLowerCase()...
    const categoryId = newCategory.toLowerCase().replace(/\s+/g, '-');

    // Проверим, нет ли уже такой в локальном состоянии
    const existing = categories.find(cat => cat.id === categoryId);
    if (existing) {
      console.log('Category already exists:', existing);
      setNewCategory('');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Создаём объект категории
    const newCat: Category = {
      id: categoryId,
      name: newCategory,
      userId: uid,
    };

    // Пишем в Firestore конкретным id (используя setDoc)
    try {
      await setDoc(doc(db, 'wishlist_categories', categoryId), newCat);
      // Добавляем в локальное состояние
      setCategories(prev => [...prev, newCat]);
      setNewCategory('');
    } catch (err) {
      console.error('Error adding new category:', err);
    }
  };

  // Удалить категорию
  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteDoc(doc(db, 'wishlist_categories', catId));
      setCategories(prev => prev.filter(cat => cat.id !== catId));
      console.log('Category deleted:', catId);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // =================== WISHLIST FORM (CREATE/UPDATE) ===================

  // Сброс формы
  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPriority('mittel');
    setItemPrice('');
    setItemUrl('');
    setItemCategory(categories[0]?.id || '');
    setItemTargetDate('');
    setItemImage('');
    setIsAdding(false);
    setEditingId(null);
  };

  // Загрузка картинки (Base64)
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

  // Отправка формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Обязательные поля
    if (!itemPrice.trim() || !itemImage.trim()) {
      alert('Please fill required fields: Price and Image.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('User is not logged in!');
      return;
    }

    // Формируем данные (без id, так как Firestore его даст)
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
        // UPDATE
        await updateDoc(doc(db, 'wishlist', editingId), newItemData);
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? { id: editingId, ...newItemData } : item))
        );
      } else {
        // CREATE
        const docRef = await addDoc(collection(db, 'wishlist'), newItemData);
        setItems((prev) => [...prev, { id: docRef.id, ...newItemData }]);
      }
    } catch (err) {
      console.error('Error saving wishlist item:', err);
    }

    resetForm();
  };

  // Начать редактирование
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

  // Удалить item
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
        if (!Array.isArray(data.items) || !Array.isArray(data.categories)) {
          throw new Error('Invalid JSON format');
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
          alert('User not logged in!');
          return;
        }

        // Импорт категорий
        for (const rawCat of data.categories) {
          const catWithUid: Omit<Category, 'id'> = {
            ...rawCat,
            userId: uid,
          };
          // Если хотим, чтобы id совпадал, используем setDoc + rawCat.id
          const catDocRef = doc(db, 'wishlist_categories', rawCat.id || 'temp');
          await setDoc(catDocRef, catWithUid, { merge: true });
        }

        // Импорт wishlist items
        for (const rawItem of data.items) {
          const itemWithUid: Omit<WishlistItem, 'id'> = {
            ...rawItem,
            userId: uid,
          };
          // addDoc создаст новый ID
          await addDoc(collection(db, 'wishlist'), itemWithUid);
        }

        // Перезагрузка из Firestore
        await fetchWishlistItems(uid);
        await fetchWishlistCategories(uid);

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
      const vals = { hoch: 3, mittel: 2, niedrig: 1 };
      return vals[b.priority] - vals[a.priority];
    }
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hoch':
        return 'bg-red-500';
      case 'mittel':
        return 'bg-yellow-500';
      case 'niedrig':
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

      {/* Фильтр и сортировка */}
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

      {/* Форма для добавления/редактирования */}
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
                  onChange={(e) => setItemPriority(e.target.value as 'niedrig' | 'mittel' | 'hoch')}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                >
                  <option value="niedrig">Low</option>
                  <option value="mittel">Medium</option>
                  <option value="hoch">High</option>
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
                  Upload Image* {editingId ? '(оставьте пустым, если не менять)' : ''}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded
                             file:border-0 file:text-sm file:font-semibold
                             file:bg-gray-600 file:text-gray-200
                             hover:file:bg-gray-500 mt-1"
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

      {/* Управление категориями */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Manage Categories</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="bg-gray-600 px-3 py-1 rounded">{cat.name}</span>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded"
            placeholder="New Category..."
          />
          <button onClick={handleAddCategory} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
      </div>

      {/* Список wishlist-элементов */}
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
                  {item.priority}
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
