import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  PlusCircle,
  Trash,
  BookOpenCheck,
  CheckCircle2,
  Calculator,
  Target,
  BedDouble,
} from 'lucide-react';

export interface FlowItem {
  id?: string;
  time: string;
  title: string;
  desc?: string;
  iconKey?: IconKey;
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

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const normalise = (arr: FlowItem[]) => arr.map((s) => ({ ...s, id: s.id ?? genId() }));

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Props {
  items?: FlowItem[];
  heading?: string;
  className?: string;
  onChange?: (items: FlowItem[]) => void;
}

const DailyFlow: React.FC<Props> = ({
  items: initial = [],
  heading = 'My Daily Plan',
  className = '',
  onChange,
}) => {
  const [items, setItems] = useState<FlowItem[]>(normalise(initial));
  const [form, setForm] = useState({
    time: '',
    title: '',
    desc: '',
    iconKey: 'clock' as IconKey,
  });

  useEffect(() => {
    setItems(normalise(initial));
  }, [JSON.stringify(initial)]);

  const update = (next: FlowItem[]) => {
    setItems(next);
    onChange?.(next);
  };

  const addItem = () => {
    if (!form.time || !form.title) return;
    const newStep: FlowItem = { id: genId(), ...form };
    const sorted = [...items, newStep].sort((a, b) => a.time.localeCompare(b.time));
    update(sorted);
    setForm({ time: '', title: '', desc: '', iconKey: 'clock' });
  };

  const removeItem = (id?: string) => id && update(items.filter((i) => i.id !== id));

  return (
    <div className={`space-y-6 ${className}`}>
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="bg-gray-900/60 rounded-lg p-6"
      >
        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Clock size={24} /> {heading}
        </h3>

        {items.length === 0 && <p className="text-gray-400">No steps yet — add one below.</p>}

        <motion.ol variants={listVariants} initial="hidden" animate="show" className="space-y-3">
          {items.map(({ id, time, title, desc, iconKey }) => (
            <motion.li key={id} variants={itemVariants} className="flex items-start gap-3 group">
              <span className="text-purple-400 w-14 font-mono">{time}</span>
              <span className="text-purple-300">{iconKey && iconOptions[iconKey]}</span>
              <div className="flex-1">
                <p className="font-semibold">{title}</p>
                {desc && <p className="text-gray-400 text-sm">{desc}</p>}
              </div>
              {id && (
                <button
                  onClick={() => removeItem(id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                >
                  <Trash size={16} />
                </button>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>

      <div className="bg-gray-900/60 rounded-lg p-6">
        <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
          <PlusCircle size={18} /> Add new step
        </h4>
        <div className="grid md:grid-cols-4 gap-4">
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            className="bg-gray-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600"
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(iconOptions) as IconKey[]).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setForm({ ...form, iconKey: k })}
                className={`p-2 rounded-lg border ${
                  form.iconKey === k ? 'border-purple-500 bg-purple-500/20' : 'border-gray-700'
                } hover:border-purple-500 transition`}
              >
                {iconOptions[k]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={addItem}
          disabled={!form.time || !form.title}
          className="mt-4 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default DailyFlow;
