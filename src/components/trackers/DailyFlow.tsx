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
import { motion } from 'framer-motion';
import { db, auth } from '../../firebaseConfig';

export interface FlowItem {
  id: string;
  time: string;
  title: string;
  desc?: string;
  iconKey: IconKey;
  date: string;
  recurring?: string[]; // z.B. ["mon", "tue"]
}

type IconKey = 'clock' | 'book' | 'check' | 'calc' | 'target' | 'bed';

const iconOptions: Record<IconKey, React.ReactNode> = {
  clock: <Clock size={20} />,  
  book:  <BookOpenCheck size={20} />,
  check: <CheckCircle2 size={20} />,  
  calc:  <Calculator size={20} />,  
  target:<Target size={20} />,  
  bed:   <BedDouble size={20} />
};

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const weekdayLabels: Record<string, string> = {
  mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So'
};

const weekdayMap: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
};

const DailyFlow: React.FC = () => {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '',
    title: '',
    desc: '',
    iconKey: 'clock' as IconKey,
    recurring: [] as string[]
  });
  const [currentTime, setCurrent] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrent(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const selectedDate = new Date(form.date);
      const weekdayKey = weekdayMap[selectedDate.getDay()]; // z.B. 'tue'

      const q = query(
        collection(db, 'dailyFlows'),
        where('userId', '==', uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({
          id: d.id,
          ...(d.data() as Omit<FlowItem, 'id'>)
        }))
        .filter(item =>
          item.date === form.date ||
          (item.recurring && item.recurring.includes(weekdayKey))
        );

      data.sort((a, b) => a.time.localeCompare(b.time));
      setItems(data);
    };
    load();
  }, [form.date]);

  const addItem = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert('Please sign in first');
    if (!form.time || !form.title) return;

    const payload = { ...form, userId: uid };
    const ref = await addDoc(collection(db, 'dailyFlows'), payload);
    const newItem: FlowItem = { id: ref.id, ...payload };
    setItems(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));

    setForm({
      date: form.date,
      time: '',
      title: '',
      desc: '',
      iconKey: 'clock',
      recurring: []
    });
  };

  const removeItem = async (id: string) => {
    await deleteDoc(firestoreDoc(db, 'dailyFlows', id));
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleRecurringDay = (day: string) => {
    setForm(f => ({
      ...f,
      recurring: f.recurring.includes(day)
        ? f.recurring.filter(d => d !== day)
        : [...f.recurring, day]
    }));
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gray-900 text-white rounded-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock size={24}/> My Plan for {form.date}
        </h2>
        <input
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          className="p-2 bg-gray-800 rounded"
        />
      </div>

      <ul className="space-y-4">
        {items.map(item => {
          const [h, m] = item.time.split(':').map(Number);
          const itemDate = new Date(form.date + 'T' + item.time + ':00');
          const isPast = currentTime >= itemDate;

          return (
            <li key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono w-14">{item.time}</span>
                <motion.span
                  animate={{ color: isPast ? '#a855f7' : '#6b7280' }}
                  transition={{ duration: 1 }}
                >
                  {iconOptions[item.iconKey]}
                </motion.span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.desc && <p className="text-gray-400 text-sm">{item.desc}</p>}
                  {item.recurring && item.recurring.length > 0 && (
                    <p className="text-xs text-purple-400">⟳ {item.recurring.map(r => weekdayLabels[r]).join(', ')}</p>
                  )}
                </div>
              </div>
              <button onClick={() => removeItem(item.id)}>
                <X size={18} className="text-red-500"/>
              </button>
            </li>
          );
        })}
        {items.length === 0 && <p className="text-gray-400">No steps yet for this date.</p>}
      </ul>

      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="time"
            value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            className="p-2 rounded bg-gray-700 w-full"
          />
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="p-2 rounded bg-gray-700 w-full"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.desc}
            onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
            className="p-2 rounded bg-gray-700 w-full"
          />
          <div className="flex gap-2">
            {Object.entries(iconOptions).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(f => ({ ...f, iconKey: key as IconKey }))}
                className={`p-2 rounded-lg border ${form.iconKey === key ? 'border-purple-500 bg-purple-500/20' : 'border-gray-700'}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {weekdays.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleRecurringDay(day)}
              className={`px-2 py-1 rounded-full text-sm border ${form.recurring.includes(day) ? 'bg-purple-600 text-white border-purple-400' : 'border-gray-600 text-gray-300'}`}
            >
              {weekdayLabels[day]}
            </button>
          ))}
        </div>

        <button
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          <PlusCircle size={20}/> Add Step
        </button>
      </div>
    </div>
  );
};

export default DailyFlow;
