// src/components/DailyFlow.tsx
import React, { useEffect, useState } from 'react';
import {
  Clock,
  PlusCircle,
  X,
  BookOpenCheck,
  CheckCircle2,
  Calculator,
  Target,
  BedDouble,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export interface FlowItem {
  id: string;
  time: string;
  title: string;
  desc?: string;
  iconKey: IconKey;
}

type IconKey = 'clock' | 'book' | 'check' | 'calc' | 'target' | 'bed';

const iconOptions: Record<IconKey, React.ReactNode> = {
  clock: <Clock size={18} />,
  book: <BookOpenCheck size={18} />,
  check: <CheckCircle2 size={18} />,
  calc: <Calculator size={18} />,
  target: <Target size={18} />,
  bed: <BedDouble size={18} />,
};

const DailyFlow: React.FC = () => {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [form, setForm] = useState({
    time: '',
    title: '',
    desc: '',
    iconKey: 'clock' as IconKey,
  });

  // Ключ по дате, чтобы отдельный список на каждый день
  const dateKey = new Date().toISOString().slice(0, 10);

  // Загрузка существующих шагов из Firestore
  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const q = query(
        collection(db, 'dailyFlows'),
        where('userId', '==', uid),
        where('date', '==', dateKey)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<FlowItem, 'id'>)
      }));
      // сортируем по времени
      data.sort((a, b) => a.time.localeCompare(b.time));
      setItems(data);
    };
    load();
  }, [dateKey]);

  // Добавление нового шага
  const addItem = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }
    if (!form.time || !form.title) return;
    const payload = {
      ...form,
      userId: uid,
      date: dateKey,
    };
    const ref = await addDoc(collection(db, 'dailyFlows'), payload);
    const newItem: FlowItem = { id: ref.id, ...form };
    setItems(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setForm({ time: '', title: '', desc: '', iconKey: 'clock' });
  };

  // Удаление шага
  const removeItem = async (id: string) => {
    await deleteDoc(firestoreDoc(db, 'dailyFlows', id));
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="w-full space-y-6 p-4 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Clock size={24} /> Мой план на {dateKey}
      </h2>

      <ul className="space-y-3">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-purple-400 w-12">{item.time}</span>
              <span className="text-purple-300">{iconOptions[item.iconKey]}</span>
              <div>
                <p className="font-semibold">{item.title}</p>
                {item.desc && <p className="text-gray-400 text-sm">{item.desc}</p>}
              </div>
            </div>
            <button onClick={() => removeItem(item.id)}>
              <X size={16} className="text-red-500" />
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-gray-400">Нет шагов — добавьте ниже.</p>}
      </ul>

      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="time"
            value={form.time}
            onChange={e => setForm({ ...form, time: e.target.value })}
            className="flex-1 p-2 rounded bg-gray-700 outline-none"
          />
          <input
            type="text"
            placeholder="Заголовок"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="flex-2 p-2 rounded bg-gray-700 outline-none"
          />
          <input
            type="text"
            placeholder="Описание (опционально)"
            value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            className="flex-2 p-2 rounded bg-gray-700 outline-none"
          />
          <select
            value={form.iconKey}
            onChange={e => setForm({ ...form, iconKey: e.target.value as IconKey })}
            className="p-2 rounded bg-gray-700"
          >
            {Object.keys(iconOptions).map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addItem}
          className="mt-3 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          <PlusCircle className="inline mb-1" /> Добавить шаг
        </button>
      </div>
    </div>
  );
};

export default DailyFlow;
