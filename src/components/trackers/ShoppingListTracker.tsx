import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

/* ---------- Typen ---------- */
interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  completed: boolean;
}

interface Comment {
  id: string;
  text: string;
  image: string | null;
  createdAt: number;
}

interface ShoppingListType {
  id: string;
  userId: string;
  title: string;
  image: string | null;
  items: ShoppingItem[];
  comments: Comment[];
  order: number;
}

/* ---------- Main Component ---------- */
const ShoppingListTracker: React.FC = () => {
  const [lists, setLists] = useState<ShoppingListType[]>([]);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  /* Listen laden */
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const q = query(
          collection(db, 'shoppingLists'),
          where('userId', '==', auth.currentUser?.uid || '')
        );
        const snap = await getDocs(q);
        const fetched: ShoppingListType[] = [];
        snap.forEach((d) => {
          const data = d.data();
          fetched.push({
            id: d.id,
            userId: data.userId,
            title: data.title,
            image: data.image,
            items: data.items || [],
            comments: data.comments || [],
            order: data.order
          });
        });
        setLists(fetched);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
      }
    };
    fetchLists();
  }, []);

  /* Neue Liste */
  const addNewList = async () => {
    const draft: Omit<ShoppingListType, 'id'> = {
      userId: auth.currentUser?.uid || '',
      title: 'Neue Einkaufsliste',
      image: null,
      items: [],
      comments: [],
      order: lists.length + 1
    };
    try {
      const ref = await addDoc(collection(db, 'shoppingLists'), draft);
      setLists([...lists, { id: ref.id, ...draft }]);
    } catch (err) {
      console.error('Fehler beim Anlegen:', err);
    }
  };

  /* Listenbild hochladen */
  const handleImageUpload = (listId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLists((curr) =>
        curr.map((l) => (l.id === listId ? { ...l, image: base64 } : l))
      );
      try {
        await updateDoc(doc(db, 'shoppingLists', listId), { image: base64 });
      } catch (err) {
        console.error('Fehler beim Speichern des Listen-Bildes:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  /* Titel bearbeiten */
  const handleTitleChange = (listId: string, t: string) =>
    setLists((c) => c.map((l) => (l.id === listId ? { ...l, title: t } : l)));
  const handleTitleBlur = async (listId: string) => {
    const l = lists.find((x) => x.id === listId);
    if (!l) return;
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { title: l.title });
    } catch (err) {
      console.error('Fehler beim Speichern des Titels:', err);
    }
  };

  /* Artikel */
  const addNewItem = async (listId: string) => {
    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: 'Neuer Artikel',
      quantity: 0,
      price: 0,
      completed: false
    };
    setLists((c) =>
      c.map((l) => (l.id === listId ? { ...l, items: [...l.items, item] } : l))
    );
    try {
      const fresh = lists.find((l) => l.id === listId);
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: [...(fresh?.items || []), item]
      });
    } catch (err) {
      console.error('Fehler beim Speichern des Artikels:', err);
    }
  };

  const handleItemChange = (
    listId: string,
    itemId: string,
    field: keyof ShoppingItem,
    raw: string
  ) => {
    const num = raw.trim() === '' ? 0 : parseFloat(raw.replace(',', '.')) || 0;
    setLists((c) =>
      c.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((it) =>
                it.id === itemId ? { ...it, [field]: num } : it
              )
            }
          : l
      )
    );
  };

  const handleItemNameOrCheckbox = (
    listId: string,
    itemId: string,
    field: keyof ShoppingItem,
    val: string | boolean
  ) =>
    setLists((c) =>
      c.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((it) =>
                it.id === itemId ? { ...it, [field]: val } : it
              )
            }
          : l
      )
    );

  const handleItemBlur = async (listId: string) => {
    const l = lists.find((x) => x.id === listId);
    if (!l) return;
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { items: l.items });
    } catch (err) {
      console.error('Fehler beim Sync der Items:', err);
    }
  };

  const deleteItem = async (listId: string, itemId: string) => {
    const updated = lists.map((l) =>
      l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
    );
    setLists(updated);
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: updated.find((l) => l.id === listId)?.items || []
      });
    } catch (err) {
      console.error('Fehler beim Löschen des Items:', err);
    }
  };

  const deleteList = async (listId: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingLists', listId));
      setLists((c) => c.filter((l) => l.id !== listId));
    } catch (err) {
      console.error('Fehler beim Löschen der Liste:', err);
    }
  };

  /* Kommentare */
  const addComment = async (listId: string, text: string, image: string | null) => {
    const comment: Comment = {
      id: Date.now().toString(),
      text,
      image,
      createdAt: Date.now()
    };
    setLists((c) =>
      c.map((l) =>
        l.id === listId ? { ...l, comments: [...l.comments, comment] } : l
      )
    );
    try {
      const fresh = lists.find((l) => l.id === listId);
      await updateDoc(doc(db, 'shoppingLists', listId), {
        comments: [...(fresh?.comments || []), comment]
      });
    } catch (err) {
      console.error('Fehler beim Speichern des Kommentars:', err);
    }
  };

  const deleteComment = async (listId: string, commentId: string) => {
    const upd = lists.map((l) =>
      l.id === listId
        ? { ...l, comments: l.comments.filter((c) => c.id !== commentId) }
        : l
    );
    setLists(upd);
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), {
        comments: upd.find((l) => l.id === listId)?.comments || []
      });
    } catch (err) {
      console.error('Fehler beim Löschen des Kommentars:', err);
    }
  };

  /* Summe */
  const calcTotal = (items: ShoppingItem[]) =>
    items.reduce((a, i) => a + i.price * i.quantity, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Einkaufsliste</h2>
        <button
          onClick={addNewList}
          className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Liste</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {lists.map((list) => (
          <div
            key={list.id}
            className="bg-gray-800/80 rounded-lg shadow-lg flex flex-col p-4"
          >
            {/* Listenbild */}
            <div className="relative mb-4 flex justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(list.id, e)}
                className="hidden"
                id={`list-${list.id}`}
              />
              <label htmlFor={`list-${list.id}`} className="cursor-pointer">
                {list.image ? (
                  <img
                    src={list.image}
                    alt="Liste"
                    className="w-24 h-24 object-contain rounded-full mx-auto border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </label>
            </div>

            {/* Titel */}
            <input
              type="text"
              value={list.title}
              onChange={(e) => handleTitleChange(list.id, e.target.value)}
              onBlur={() => handleTitleBlur(list.id)}
              className="bg-transparent text-lg font-semibold text-center mb-4 border-b border-gray-600 focus:border-blue-500 outline-none pb-1"
            />

            {/* Artikel */}
            <div className="flex-1 mb-4 overflow-y-auto pr-1">
              <h3 className="text-sm font-semibold mb-2">Artikel</h3>
              <div className="space-y-3">
                {list.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) =>
                        handleItemNameOrCheckbox(
                          list.id,
                          item.id,
                          'completed',
                          e.target.checked
                        )
                      }
                      onBlur={() => handleItemBlur(list.id)}
                      className="form-checkbox h-4 w-4 accent-blue-600"
                    />
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemNameOrCheckbox(list.id, item.id, 'name', e.target.value)
                      }
                      onBlur={() => handleItemBlur(list.id)}
                      className="bg-gray-700 p-1 rounded-md text-sm w-24 border border-gray-600 focus:border-blue-500 outline-none"
                      placeholder="Produkt"
                    />
                    <input
                      type="text"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) =>
                        handleItemChange(list.id, item.id, 'quantity', e.target.value)
                      }
                      onBlur={() => handleItemBlur(list.id)}
                      className="bg-gray-700 p-1 rounded-md text-sm w-12 border border-gray-600 focus:border-blue-500 outline-none text-center"
                      placeholder="0"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                        €
                      </span>
                      <input
                        type="text"
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) =>
                          handleItemChange(list.id, item.id, 'price', e.target.value)
                        }
                        onBlur={() => handleItemBlur(list.id)}
                        className="bg-gray-700 p-1 rounded-md text-sm pl-6 w-16 border border-gray-600 focus:border-blue-500 outline-none text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={() => deleteItem(list.id, item.id)}
                      className="p-1 hover:bg-red-600 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-200" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addNewItem(list.id)}
                className="mt-3 px-2 py-1 bg-green-600 rounded-md hover:bg-green-700 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Artikel hinzufügen</span>
              </button>
            </div>

            {/* Kommentare */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center space-x-1">
                <ImageIcon className="w-4 h-4" />
                <span>Kommentare</span>
              </h3>

              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {list.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gray-700/60 p-2 rounded flex flex-col space-y-2"
                  >
                    {c.image && (
                      <img
                        src={c.image}
                        alt="Anhang"
                        className="w-full max-h-64 object-contain rounded"
                      />
                    )}
                    <div className="flex items-start justify-between">
                      <span className="flex-1 text-xs break-words">{c.text}</span>
                      <button
                        onClick={() => deleteComment(list.id, c.id)}
                        className="p-1 hover:bg-red-600 rounded"
                      >
                        <X className="w-4 h-4 text-red-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <CommentForm
                onSubmit={(text, img) => addComment(list.id, text, img)}
                listKey={list.id}
                fileInputs={fileInputs}
              />
            </div>

            {/* Summe & Liste löschen */}
            <div className="border-t border-gray-700 pt-3 mt-auto">
              <span className="block text-sm font-semibold mb-2">
                Gesamtsumme: {calcTotal(list.items).toFixed(2)} €
              </span>
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    window.confirm('Einkaufsliste wirklich löschen?') && deleteList(list.id)
                  }
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Kommentar-Form ---------- */
interface CommentFormProps {
  onSubmit: (text: string, img: string | null) => void;
  listKey: string;
  fileInputs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}
const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, listKey, fileInputs }) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setText('');
    setPreview(null);
    const f = fileInputs.current[listKey];
    if (f) f.value = '';
  };

  const submit = () => {
    if (!text.trim() && !preview) return;
    onSubmit(text.trim(), preview);
    reset();
  };

  return (
    <div className="mt-2 space-y-2">
      {preview && (
        <img
          src={preview}
          alt="Vorschau"
          className="w-full max-h-64 object-contain rounded border border-gray-600"
        />
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Kommentar..."
        className="w-full bg-gray-700 p-2 rounded text-xs border border-gray-600 focus:border-blue-500 outline-none resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            ref={(el) => (fileInputs.current[listKey] = el)}
            className="hidden"
            id={`comment-img-${listKey}`}
          />
          <label
            htmlFor={`comment-img-${listKey}`}
            className="cursor-pointer p-1 hover:bg-gray-600 rounded"
          >
            <ImageIcon className="w-4 h-4" />
          </label>
        </div>
        <button
          onClick={submit}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Posten
        </button>
      </div>
    </div>
  );
};

export default ShoppingListTracker;
