import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
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

// Типы für Einkaufsliste
interface ShoppingItem {
  id: string;
  name: string;      // Название товара
  quantity: number;  // Сколько штук/единиц
  price: number;     // Цена за единицу
  completed: boolean;
}

interface ShoppingListType {
  id: string;
  userId: string;
  title: string;
  image: string | null;
  items: ShoppingItem[];
  order: number;
}

const ShoppingListTracker: React.FC = () => {
  const [lists, setLists] = useState<ShoppingListType[]>([]);

  // При загрузке получаем все списки из Firestore
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const q = query(
          collection(db, 'shoppingLists'),
          where('userId', '==', auth.currentUser?.uid || '')
        );
        const querySnapshot = await getDocs(q);
        const fetchedLists: ShoppingListType[] = [];
        querySnapshot.forEach((docSnapshot) => {
          fetchedLists.push({ id: docSnapshot.id, ...docSnapshot.data() } as ShoppingListType);
        });
        setLists(fetchedLists);
      } catch (error) {
        console.error('Error fetching shopping lists:', error);
      }
    };

    fetchLists();
  }, []);

  // Создать новую Einkaufsliste
  const addNewList = async () => {
    const newList: Omit<ShoppingListType, 'id'> = {
      userId: auth.currentUser?.uid || '',
      title: 'Neue Einkaufsliste',
      image: null,
      items: [],
      order: lists.length + 1
    };

    try {
      const docRef = await addDoc(collection(db, 'shoppingLists'), newList);
      setLists([...lists, { id: docRef.id, ...newList }]);
    } catch (error) {
      console.error('Error adding new shopping list:', error);
    }
  };

  // Загрузка картинки
  const handleImageUpload = (listId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setLists((current) =>
          current.map((list) => (list.id === listId ? { ...list, image: base64Image } : list))
        );
        try {
          await updateDoc(doc(db, 'shoppingLists', listId), { image: base64Image });
        } catch (error) {
          console.error('Error updating image:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Изменение названия списка (локально)
  const handleTitleChange = (listId: string, newTitle: string) => {
    setLists((current) =>
      current.map((list) => (list.id === listId ? { ...list, title: newTitle } : list))
    );
  };

  // Сохранение названия списка в Firestore при потере фокуса
  const handleTitleBlur = async (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { title: list.title });
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  // Добавить новый товар
  const addNewItem = async (listId: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: 'Neuer Artikel',
      quantity: 0,
      price: 0,
      completed: false
    };
    // Сначала обновим локальный стейт
    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.id === listId) {
          return { ...list, items: [...list.items, newItem] };
        }
        return list;
      })
    );
    // Затем запишем в Firestore
    try {
      const updatedList = lists.find((l) => l.id === listId);
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: [...(updatedList?.items || []), newItem]
      });
    } catch (error) {
      console.error('Error adding new item:', error);
    }
  };

  // При вводе цифр (количества или цены) локально меняем стейт
  const handleItemChange = (
    listId: string,
    itemId: string,
    field: keyof ShoppingItem,
    rawValue: string
  ) => {
    let numericValue: number = 0;
    if (rawValue.trim() !== '') {
      const parsed = parseFloat(rawValue.replace(',', '.'));
      numericValue = isNaN(parsed) ? 0 : parsed;
    }

    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) return list;
        const updatedItems = list.items.map((item) =>
          item.id === itemId ? { ...item, [field]: numericValue } : item
        );
        return { ...list, items: updatedItems };
      })
    );
  };

  // Меняем название товара или галочку (completed)
  const handleItemNameOrCheckbox = (
    listId: string,
    itemId: string,
    field: keyof ShoppingItem,
    value: string | boolean
  ) => {
    setLists((current) =>
      current.map((list) => {
        if (list.id !== listId) return list;
        const updatedItems = list.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        );
        return { ...list, items: updatedItems };
      })
    );
  };

  // Сохраняем изменения товара в Firestore при потере фокуса
  const handleItemBlur = async (listId: string) => {
    const foundList = lists.find((l) => l.id === listId);
    if (!foundList) return;

    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { items: foundList.items });
    } catch (error) {
      console.error('Error updating item field:', error);
    }
  };

  // Удалить товар
  const deleteItem = async (listId: string, itemId: string) => {
    const updatedLists = lists.map((list) => {
      if (list.id === listId) {
        const filteredItems = list.items.filter((item) => item.id !== itemId);
        return { ...list, items: filteredItems };
      }
      return list;
    });
    setLists(updatedLists);

    try {
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: updatedLists.find((l) => l.id === listId)?.items || []
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Удалить весь список
  const deleteList = async (listId: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingLists', listId));
      setLists((current) => current.filter((list) => list.id !== listId));
    } catch (error) {
      console.error('Error deleting shopping list:', error);
    }
  };

  // Подсчет общей суммы (цена * количество)
  const calculateTotal = (items: ShoppingItem[]): number => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-white overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Einkaufsliste</h2>
        <button
          onClick={addNewList}
          className="p-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-1"
          aria-label="Neue Einkaufsliste hinzufügen"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Liste</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-hidden">
        {lists.map((list) => (
          <div
            key={list.id}
            className="bg-gray-800/80 rounded-lg shadow-lg flex flex-col p-4 overflow-hidden"
          >
            {/* Картинка (кнопка загрузки) */}
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
                    alt="Einkaufsliste"
                    className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </label>
            </div>

            {/* Заголовок списка */}
            <input
              type="text"
              value={list.title}
              onChange={(e) => handleTitleChange(list.id, e.target.value)}
              onBlur={() => handleTitleBlur(list.id)}
              className="bg-transparent font-semibold text-lg text-center mb-4 outline-none border-b border-gray-600 focus:border-blue-500 transition-colors pb-1"
            />

            {/* Товары (вертикальная прокрутка) */}
            <div className="flex-1 mb-4 overflow-y-auto overflow-x-hidden pr-1">
              <h3 className="text-sm font-semibold mb-2">Artikel</h3>
              <div className="space-y-3">
                {list.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    {/* Галочка "готово" */}
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) =>
                        handleItemNameOrCheckbox(list.id, item.id, 'completed', e.target.checked)
                      }
                      onBlur={() => handleItemBlur(list.id)}
                      className="form-checkbox h-4 w-4 accent-blue-600"
                    />
                    {/* Название товара (сделано меньше) */}
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
                    {/* Количество (без стрелочек) */}
                    <input
                      type="text"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleItemChange(list.id, item.id, 'quantity', e.target.value)}
                      onBlur={() => handleItemBlur(list.id)}
                      className="bg-gray-700 p-1 rounded-md text-sm w-12 border border-gray-600 focus:border-blue-500 outline-none text-center"
                      placeholder="0"
                    />
                    {/* Цена со знаком € */}
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                        €
                      </span>
                      <input
                        type="text"
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) =>
                          handleItemChange(list.id, item.id, 'price', e.target.value)
                        }
                        onBlur={() => handleItemBlur(list.id)}
                        className="bg-gray-700 p-1 rounded-md text-sm pl-6 border border-gray-600 focus:border-blue-500 outline-none text-right w-16"
                        placeholder="0.00"
                      />
                    </div>
                    {/* Кнопка удаления товара */}
                    <button
                      onClick={() => deleteItem(list.id, item.id)}
                      className="p-1 hover:bg-red-600 rounded transition-colors"
                      aria-label="Artikel löschen"
                    >
                      <X className="w-4 h-4 text-red-200" />
                    </button>
                  </div>
                ))}
              </div>
              {/* Добавить статью в список */}
              <button
                onClick={() => addNewItem(list.id)}
                className="mt-3 px-2 py-1 bg-green-600 rounded-md hover:bg-green-700 text-sm transition-colors flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Artikel hinzufügen</span>
              </button>
            </div>

            {/* Общая сумма и кнопка удаления списка */}
            <div className="border-t border-gray-700 pt-3 mt-auto">
              <span className="block text-sm font-semibold mb-2">
                Gesamtsumme: {calculateTotal(list.items).toFixed(2)} €
              </span>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (window.confirm('Einkaufsliste wirklich löschen?')) {
                      deleteList(list.id);
                    }
                  }}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  aria-label="Liste löschen"
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

export default ShoppingListTracker;
