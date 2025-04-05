import React, { useState, useEffect } from 'react';
import { X, Download, Upload } from 'lucide-react';
import Note from '../shared/Note';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface MoodEntry {
  id: string;
  mood: {
    id: number;
    label: string;
    color: string;
    emoji: string;
  };
  timestamp: string;
  notes: {
    id: string;
    text: string;
    timestamp: string;
  }[];
}

const moodLevels = [
  { id: 5, label: 'Excellent', color: 'bg-green-500', emoji: '😃' },
  { id: 4, label: 'Good', color: 'bg-blue-500', emoji: '🙂' },
  { id: 3, label: 'Neutral', color: 'bg-yellow-500', emoji: '😐' },
  { id: 2, label: 'Poor', color: 'bg-orange-500', emoji: '🙁' },
  { id: 1, label: 'Bad', color: 'bg-red-500', emoji: '😞' }
];

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  // Beim Mounten: Einträge aus Firestore laden
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "moodEntries"));
        const moodEntries: MoodEntry[] = [];
        querySnapshot.forEach((document) => {
          moodEntries.push({ id: document.id, ...document.data() } as MoodEntry);
        });
        setEntries(moodEntries);
      } catch (error) {
        console.error("Fehler beim Laden der Einträge:", error);
      }
    };

    fetchEntries();
  }, []);

  // Neuen Eintrag in Firestore hinzufügen
  const addEntry = async (mood: typeof moodLevels[0]) => {
    try {
      const newEntry = {
        mood,
        timestamp: new Date().toISOString(),
        notes: []
      };
      const docRef = await addDoc(collection(db, "moodEntries"), newEntry);
      // Aktualisiere den lokalen State
      setEntries([{ id: docRef.id, ...newEntry } as MoodEntry, ...entries]);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Eintrags:", error);
    }
  };

  // Notiz hinzufügen und Firestore updaten
  const addNote = async (entryId: string, noteText: string) => {
    if (noteText.trim()) {
      // Lokale Aktualisierung: Füge die neue Notiz hinzu
      const updatedEntries = entries.map(entry => {
        if (entry.id === entryId) {
          const newNote = {
            id: Date.now().toString(),
            text: noteText.trim(),
            timestamp: new Date().toISOString()
          };
          return { ...entry, notes: [...(entry.notes || []), newNote] };
        }
        return entry;
      });
      setEntries(updatedEntries);

      // Aktualisiere Firestore
      try {
        const entryRef = doc(db, "moodEntries", entryId);
        const entryToUpdate = updatedEntries.find(e => e.id === entryId);
        if (entryToUpdate) {
          await updateDoc(entryRef, { notes: entryToUpdate.notes });
        }
      } catch (error) {
        console.error("Fehler beim Hinzufügen der Notiz:", error);
      }
    }
  };

  // Eintrag löschen (sowohl lokal als auch in Firestore)
  const deleteEntry = async (entryId: string) => {
    try {
      await deleteDoc(doc(db, "moodEntries", entryId));
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      console.error("Fehler beim Löschen des Eintrags:", error);
    }
  };

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(entry => entry.mood.id === parseInt(filter));

  return (
    <div className="w-full space-y-6 p-4">
      {/* Überschrift und Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Mood Tracker</h2>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto bg-gray-800 p-2 rounded text-sm sm:text-base"
          >
            <option value="all">All Moods</option>
            {moodLevels.map(mood => (
              <option key={mood.id} value={mood.id}>
                {mood.label} Only
              </option>
            ))}
          </select>
          {/* Export-Button – kannst du zunächst beibehalten, um die lokalen Einträge als JSON zu exportieren */}
          <div className="flex space-x-2">
            <button
              onClick={() => console.log("Export funktioniert hier noch nur lokal!")}
              className="flex items-center space-x-1 p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              title="Export Entries"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mood-Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-4">
        {moodLevels.map(mood => (
          <button
            key={mood.id}
            onClick={() => addEntry(mood)}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full transition-all
              hover:opacity-80 ${mood.color} flex items-center justify-center
              text-xl sm:text-2xl shadow-lg hover:scale-110
              active:scale-95 transform duration-150`}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      {/* Mood-Einträge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntries.map(entry => (
          <div
            key={entry.id}
            className={`p-3 sm:p-4 rounded-lg ${entry.mood.color} bg-opacity-20
              backdrop-blur-sm transition-all duration-300 hover:bg-opacity-25`}
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl">{entry.mood.emoji}</span>
                <span className="font-medium text-sm sm:text-base">{entry.mood.label}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <span className="text-xs sm:text-sm text-gray-300">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => {
                    if(window.confirm("Möchtest du diesen Eintrag wirklich löschen?")){
                      deleteEntry(entry.id);
                    }
                  }}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Eingabe für Notizen */}
            <input
              type="text"
              placeholder="Add a note and press Enter..."
              className="w-full bg-gray-800 rounded p-2 mt-2 text-sm sm:text-base
                placeholder:text-gray-500 focus:outline-none focus:ring-2
                focus:ring-blue-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  addNote(entry.id, (e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />

            {/* Liste der Notizen */}
            <div className="space-y-2 mt-2">
              {entry.notes && entry.notes.map(note => (
                <Note
                  key={note.id}
                  note={note}
                  onDelete={() => {
                    // Hier könntest du auch eine Funktion ergänzen, um die Notiz in Firestore zu entfernen.
                    const updatedEntries = entries.map(e => ({
                      ...e,
                      notes: e.id === entry.id
                        ? e.notes.filter(n => n.id !== note.id)
                        : e.notes
                    }));
                    setEntries(updatedEntries);
                    // Und dann Firestore updaten, ähnlich wie in addNote.
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hinweis, falls keine Einträge vorhanden sind */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg">No mood entries yet.</p>
          <p className="text-sm mt-2">Click on any mood button above to start tracking!</p>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
