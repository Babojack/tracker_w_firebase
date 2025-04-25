// src/components/WishlistTracker.tsx

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from 'react';
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
  Check,
  RotateCcw,
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
  id: string;
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
  archived?: boolean;
}

interface Category {
  id: string;
  name: string;
  userId: string;
}

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
  // ——— STATE ———
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [categories] = useState<Category[]>(PREDEFINED_CATEGORIES);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showArchive, setShowArchive] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPriority, setItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemCategory, setItemCategory] = useState(categories[0]?.id || '');
  const [itemTargetDate, setItemTargetDate] = useState('');
  const [itemImage, setItemImage] = useState('');

  // ——— FETCH ———
  const fetchWishlistItems = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'wishlist'),
        where('userId', '==', uid),
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<WishlistItem, 'id'>),
      }));
      setItems(loaded);
    } catch (e) {
      console.error('Ошибка загрузки wishlist:', e);
    }
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      fetchWishlistItems(uid);
    }
  }, []);

  // ——— FORM HELPERS ———
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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setItemImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!itemPrice.trim()) {
      alert('Поле Price обязательно');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('Пользователь не залогинен');
      return;
    }

    const existingArchive =
      editingId && items.find((i) => i.id === editingId)?.archived
        ? true
        : false;

    const data = {
      name: itemName,
      description: itemDescription,
      priority: itemPriority,
      price: itemPrice.trim(),      // string, не число
      url: itemUrl,
      category: itemCategory,
      targetDate: itemTargetDate,
      createdAt: editingId
        ? items.find((i) => i.id === editingId)?.createdAt || Date.now()
        : Date.now(),
      image: itemImage,
      userId: uid,                  // обязательное поле для правил
      archived: editingId ? existingArchive : false,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'wishlist', editingId), data);
        setItems((prev) =>
          prev.map((it) =>
            it.id === editingId ? { id: editingId, ...data } : it,
          ),
        );
      } else {
        const ref = await addDoc(collection(db, 'wishlist'), data);
        setItems((prev) => [...prev, { id: ref.id, ...data }]);
      }
      resetForm();
    } catch (e) {
      console.error('Ошибка сохранения:', e);
    }
  };

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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wishlist', id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error('Ошибка удаления:', e);
    }
  };

  const toggleArchive = async (item: WishlistItem) => {
    try {
      await updateDoc(doc(db, 'wishlist', item.id), {
        archived: !item.archived,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, archived: !i.archived } : i,
        ),
      );
    } catch (e) {
      console.error('Ошибка архивации:', e);
    }
  };

  // ——— IMPORT/EXPORT ———
  const importData = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (!Array.isArray(json.items)) throw new Error('Неправильный формат');
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('Не залогинен');

        for (const raw of json.items) {
          await addDoc(collection(db, 'wishlist'), {
            ...raw,
            userId: uid,
            archived: raw.archived || false,
          });
        }
        await fetchWishlistItems(uid);
        alert('Импорт успешно завершён');
      } catch (err) {
        console.error(err);
        alert('Ошибка при импорте');
      }
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify({ items }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wishlist_backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Ошибка при экспорте');
    }
  };

  // ——— FILTER & SORT ———
  const filtered = items.filter(
    (it) =>
      (showArchive ? it.archived : !it.archived) &&
      (filter === 'all' || it.category === filter),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return b.createdAt - a.createdAt;
    if (sortBy === 'price')
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === 'priority') {
      const v = { high: 3, medium: 2, low: 1 };
      return v[b.priority] - v[a.priority];
    }
    return 0;
  });

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'bg-red-500';
    if (p === 'medium') return 'bg-yellow-500';
    if (p === 'low') return 'bg-green-500';
    return 'bg-gray-500';
  };

  // ——— RENDER ———
  return (
    <div className="p-4 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Wishlist</h2>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Download size={18} /> Export
          </button>
          <label className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer">
            <Upload size={18} /> Import
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            {showArchive ? 'Active Wishes' : 'Archive'}
          </button>
        </div>
      </div>

      {/* FILTER & SORT */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
        {!showArchive && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            New Wish
          </button>
        )}
      </div>

      {/* FORM */}
      {isAdding && (
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Edit Wish' : 'New Wish'}
            </h3>
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
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Price */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price (€)*
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={itemPriority}
                  onChange={(e) =>
                    setItemPriority(e.target.value as 'low' | 'medium' | 'high')
                  }
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
                <label className="block text-sm font-medium mb-1">
                  Target Date
                </label>
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
                  required={!editingId}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
              />
            </div>

            {/* Actions */}
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

      {/* ITEMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">
              {showArchive
                ? 'No archived wishes found.'
                : 'No wishes in this category.'}
            </p>
          </div>
        ) : (
          sorted.map((item) => (
            <div
              key={item.id}
              className={`bg-gray-700 rounded-lg p-4 flex flex-col h-full ${
                item.archived ? 'border-2 border-gray-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleArchive(item)}
                    className="p-1 hover:opacity-80"
                    title={
                      item.archived ? 'Restore Wish' : 'Mark as Completed'
                    }
                  >
                    {item.archived ? (
                      <RotateCcw size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => startEditing(item)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                    item.priority,
                  )}`}
                >
                  {item.priority.charAt(0).toUpperCase() +
                    item.priority.slice(1)}
                </span>
                <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                  {categories.find((c) => c.id === item.category)?.name}
                </span>
              </div>
              {item.image && (
                <div className="mb-2">
                  <img
                    src={item.image}
                    alt="Wish Item"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
              {item.description && (
                <p className="text-gray-300 text-sm mb-3 flex-grow">
                  {item.description}
                </p>
              )}
              <div className="mt-auto space-y-1 pt-2 border-t border-gray-600">
                {item.price && (
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign size={14} className="text-green-400" />
                    <span>Price: {item.price} €</span>
                  </div>
                )}
                {item.targetDate && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} className="text-blue-400" />
                    <span>
                      Target Date:{' '}
                      {new Date(item.targetDate).toLocaleDateString()}
                    </span>
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