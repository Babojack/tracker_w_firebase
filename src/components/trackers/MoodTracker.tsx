// src/components/trackers/MoodTracker.tsx
import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import Note from '../shared/Note';

interface Activity {
  id: number;
  label: string;
  emoji: React.ReactNode;
}

// ───────────────────────────────────────────
// Activity options (including new sleep states + anxiety/medication)
// ───────────────────────────────────────────
const activityOptions: Activity[] = [
  { id: 1, label: 'Reading', emoji: '📚' },
  { id: 2, label: 'Gaming', emoji: '🎮' },
  { id: 3, label: 'Walking', emoji: '🚶‍♂️' },
  { id: 4, label: 'Food', emoji: '🍕' },
  { id: 5, label: 'Success', emoji: '🏆' },
  { id: 6, label: 'Workout', emoji: '🏃‍♂️' },
  { id: 7, label: 'Illness', emoji: '🤒' },
  { id: 8, label: 'Argument', emoji: '💢' },
  { id: 9, label: 'Sunny', emoji: '☀️' },
  { id: 10, label: 'Cloudy', emoji: '☁️' },
  // NEW: Sleep quality states
  { id: 11, label: 'Dizzy', emoji: '😴' },
  { id: 12, label: 'Good Sleep', emoji: '🛌+' },
  { id: 13, label: 'Bad Sleep', emoji: '🛌-' },
  // NEW: Anxiety/Medication state
  { id: 14, label: 'Anxiety / Meds', emoji: '💊' },
  { id: 15, label: 'Anxiety / Meds', emoji: '😰' },
];

interface NoteItem {
  id: string;
  text: string;
  timestamp: string;
}

interface MoodType {
  id: number;
  label: string;
  color: string;
  emoji: string;
}

interface MoodEntry {
  id: string;
  mood: MoodType;
  timestamp: string;
  notes: NoteItem[];
  activities: Activity[];
}

// ────────────────────────────────────────────────────────────────────────────────
// Mood levels
// ────────────────────────────────────────────────────────────────────────────────

const moodLevels: MoodType[] = [
  { id: 7, label: 'Proud', color: 'bg-pink-500', emoji: '🥹' },
  { id: 6, label: 'Pattern', color: 'bg-purple-500', emoji: '🌀' },
  { id: 5, label: 'Excellent', color: 'bg-green-500', emoji: '😃' },
  { id: 4, label: 'Good', color: 'bg-blue-500', emoji: '🙂' },
  { id: 3, label: 'Neutral', color: 'bg-yellow-500', emoji: '😐' },
  { id: 2, label: 'Poor', color: 'bg-orange-500', emoji: '🙁' },
  { id: 1, label: 'Bad', color: 'bg-red-500', emoji: '😞' },
];

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, 'moodEntries'),
        where('userId', '==', auth.currentUser?.uid || '')
      );
      const snap = await getDocs(q);
      const data: MoodEntry[] = [];
      snap.forEach((d) => {
        const docData: any = d.data();
        data.push({
          id: d.id,
          mood: docData.mood,
          timestamp: docData.timestamp,
          notes: docData.notes || [],
          activities: docData.activities || [],
        });
      });
      setEntries(data);
    };
    load();
  }, []);

  const pushEntry = async (mood: MoodType) => {
    const entry = {
      mood,
      timestamp: new Date().toISOString(),
      notes: [] as NoteItem[],
      activities: [] as Activity[],
      userId: auth.currentUser?.uid,
    };
    const ref = await addDoc(collection(db, 'moodEntries'), entry);
    setEntries([{ id: ref.id, ...entry }, ...entries]);
  };

  const pushNote = async (eid: string, text: string) => {
    if (!text.trim()) return;
    const upd = entries.map((e) =>
      e.id === eid
        ? {
            ...e,
            notes: [
              ...e.notes,
              { id: Date.now().toString(), text, timestamp: new Date().toISOString() },
            ],
          }
        : e
    );
    setEntries(upd);
    const item = upd.find((e) => e.id === eid);
    if (item) await updateDoc(doc(db, 'moodEntries', eid), { notes: item.notes });
  };

  const toggleAct = async (eid: string, act: Activity) => {
    const upd = entries.map((e) => {
      if (e.id !== eid) return e;
      const list = e.activities.some((a) => a.id === act.id)
        ? e.activities.filter((a) => a.id !== act.id)
        : [...e.activities, act];
      return { ...e, activities: list };
    });
    setEntries(upd);
    const item = upd.find((e) => e.id === eid);
    if (item) await updateDoc(doc(db, 'moodEntries', eid), { activities: item.activities });
  };

  const dropEntry = async (id: string) => {
    await deleteDoc(doc(db, 'moodEntries', id));
    setEntries(entries.filter((e) => e.id !== id));
  };

  const sorted = (
    filter === 'all' ? entries : entries.filter((e) => e.mood.id === +filter)
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="w-full space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Mood Tracker</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="all">All</option>
            {moodLevels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button className="p-2 bg-green-500 rounded">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {moodLevels.map((m) => (
          <button
            key={m.id}
            onClick={() => pushEntry(m)}
            className={`w-14 h-14 rounded-full ${m.color} flex items-center justify-center text-2xl`}
          >
            {m.emoji}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((e) => (
          <div key={e.id} className={`p-4 rounded-lg ${e.mood.color} bg-opacity-20`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{e.mood.emoji}</span>
                <span>{e.mood.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {new Date(e.timestamp).toLocaleString()}
                <button onClick={() => dropEntry(e.id)} className="p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {activityOptions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAct(e.id, a)}
                  className={`p-2 rounded-full text-xl ${e.activities.some((x) => x.id === a.id) ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  {a.emoji}
                </button>
              ))}
            </div>

            <input
              placeholder="Add a note..."
              className="w-full bg-gray-800 rounded p-2 text-sm"
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  pushNote(e.id, (ev.target as HTMLInputElement).value);
                  (ev.target as HTMLInputElement).value = '';
                }
              }}
            />
            <div className="space-y-2 mt-2">
              {e.notes.map((n) => (
                <Note
                  key={n.id}
                  note={n}
                  onDelete={async () => {
                    const upd = entries.map((en) =>
                      en.id === e.id ? { ...en, notes: en.notes.filter((nn) => nn.id !== n.id) } : en
                    );
                    setEntries(upd);
                    const item = upd.find((en) => en.id === e.id);
                    if (item) await updateDoc(doc(db, 'moodEntries', e.id), { notes: item.notes });
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && <p className="text-center text-gray-400">No entries yet.</p>}
    </div>
  );
};

export default MoodTracker;
