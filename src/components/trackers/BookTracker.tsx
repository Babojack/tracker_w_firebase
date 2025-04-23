import React, { useEffect, useState, useRef } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
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

interface NoteItem {
  id: string;
  text: string;
  timestamp: string;
  useful?: boolean;
  result?: string;
}

// Three possible statuses for each book entry
const statuses = ['Next Book', 'Reading', 'Read'] as const;
type Status = typeof statuses[number];

interface BookEntry {
  id: string;
  openLibraryId: string;
  title: string;
  authors: string[];
  coverUrl: string;
  status: Status;
  conclusions: NoteItem[];
  exercises: NoteItem[];
  remarks: NoteItem[];
  timestamp: string;
}

interface OLDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

// Use only these two note sections:
const noteSections = ['conclusions', 'remarks'] as const;
type NoteSection = typeof noteSections[number];

const BookTracker: React.FC = () => {
  const [queryText, setQueryText] = useState('');
  const [suggestions, setSuggestions] = useState<OLDoc[]>([]);
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const timeoutRef = useRef<number>();

  // Load saved books
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, 'booksRead'),
        where('userId', '==', auth.currentUser?.uid || '')
      );
      const snap = await getDocs(q);
      const data: BookEntry[] = [];
      snap.forEach(docSnap => data.push({ id: docSnap.id, ...(docSnap.data() as any) }));
      setEntries(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    })();
  }, []);

  // OpenLibrary search
  useEffect(() => {
    if (queryText.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(queryText)}&limit=5`
        );
        const json = await res.json();
        setSuggestions(json.docs || []);
      } catch {
        setSuggestions([]);
      }
    }, 500);
  }, [queryText]);

  const addBook = async (book: OLDoc) => {
    const entry: Omit<BookEntry, 'id'> = {
      openLibraryId: book.key,
      title: book.title,
      authors: book.author_name || [],
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : '',
      status: 'Next Book',
      conclusions: [],
      exercises: [],
      remarks: [],
      timestamp: new Date().toISOString(),
      userId: auth.currentUser?.uid,
    } as any;
    const ref = await addDoc(collection(db, 'booksRead'), entry);
    setEntries(prev => [{ id: ref.id, ...entry }, ...prev]);
    setSuggestions([]);
    setQueryText('');
  };

  // Cycle through statuses: Next Book -> Reading -> Read -> Next Book
  const cycleStatus = async (id: string) => {
    setEntries(prev =>
      prev.map(e => {
        if (e.id !== id) return e;
        const currentIndex = statuses.indexOf(e.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...e, status: statuses[nextIndex] };
      })
    );
    const book = entries.find(e => e.id === id);
    if (book) {
      const nextIndex = (statuses.indexOf(book.status) + 1) % statuses.length;
      await updateDoc(doc(db, 'booksRead', id), { status: statuses[nextIndex] });
    }
  };

  const pushNote = async (
    id: string,
    text: string,
    key: 'conclusions' | 'exercises' | 'remarks'
  ) => {
    if (!text.trim()) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString(),
      ...(key === 'exercises' ? { useful: false, result: '' } : {}),
    };
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, [key]: [...e[key], newNote] } : e)));
    const book = entries.find(e => e.id === id);
    if (book) await updateDoc(doc(db, 'booksRead', id), { [key]: [...book[key], newNote] });
  };

  const deleteNote = async (
    bookId: string,
    noteId: string,
    key: 'conclusions' | 'exercises' | 'remarks'
  ) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setEntries(prev =>
      prev.map(e => (e.id === bookId ? { ...e, [key]: e[key].filter(n => n.id !== noteId) } : e))
    );
    const book = entries.find(e => e.id === bookId);
    if (book)
      await updateDoc(doc(db, 'booksRead', bookId), {
        [key]: book[key].filter(n => n.id !== noteId),
      });
  };

  const updateExerciseProperty = async (
    bookId: string,
    noteId: string,
    field: 'useful' | 'result',
    value: boolean | string
  ) => {
    setEntries(prev =>
      prev.map(e =>
        e.id !== bookId
          ? e
          : { ...e, exercises: e.exercises.map(n => (n.id === noteId ? { ...n, [field]: value } : n)) }
      )
    );
    await updateDoc(doc(db, 'booksRead', bookId), {
      exercises: entries.find(e => e.id === bookId)?.exercises || [],
    });
  };

  const dropBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    await deleteDoc(doc(db, 'booksRead', id));
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          placeholder="Search for a book..."
          className="w-full bg-gray-800 rounded p-2 pl-10 text-sm"
        />
        <SearchIcon className="absolute left-3 top-3 text-gray-400" />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-gray-900 w-full mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map(book => (
              <li
                key={book.key}
                onClick={() => addBook(book)}
                className="flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer"
              >
                {book.cover_i && (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                    alt="cover"
                    className="w-8 h-12 object-cover rounded"
                  />
                )}
                <div className="text-sm">
                  <div className="font-medium">{book.title}</div>
                  <div className="text-gray-400">{(book.author_name || []).join(', ')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entries.map(e => (
          <div key={e.id} className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-4">
                {e.coverUrl && <img src={e.coverUrl} alt="cover" className="w-16 h-24 object-cover rounded" />}
                <div>
                  <h3 className="font-bold text-lg">{e.title}</h3>
                  <p className="text-gray-400 text-sm">{e.authors.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cycleStatus(e.id)}
                  className={`px-3 py-1 rounded ${
                    e.status === 'Next Book' ? 'bg-blue-600' :
                    e.status === 'Reading' ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                >
                  {e.status}
                </button>
                <button onClick={() => dropBook(e.id)}><X /></button>
              </div>
            </div>

            {/* Conclusions & Remarks Sections */}
            {noteSections.map(section => (
              <details key={section} className="bg-gray-900 rounded p-2">
                <summary className="font-semibold cursor-pointer capitalize">{section}</summary>
                <div className="mt-2 space-y-2">
                  <input
                    placeholder={`Add a ${section.slice(0, -1)}...`}
                    className="w-full bg-gray-800 rounded p-2 text-sm"
                    onKeyDown={ev => {
                      if (ev.key === 'Enter') {
                        pushNote(e.id, (ev.target as HTMLInputElement).value, section);
                        (ev.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <div className="space-y-2">
                    {e[section].map((n: NoteItem) => (
                      <Note key={n.id} note={n} onDelete={() => deleteNote(e.id, n.id, section)} />
                    ))}
                  </div>
                </div>
              </details>
            ))}

            {/* Exercises with English labels */}
            <details className="bg-gray-900 rounded p-2">
              <summary className="font-semibold cursor-pointer">Exercises</summary>
              <div className="mt-2 space-y-2">
                <input
                  placeholder="Add an exercise..."
                  className="w-full bg-gray-800 rounded p-2 text-sm"
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') {
                      pushNote(e.id, (ev.target as HTMLInputElement).value, 'exercises');
                      (ev.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <div className="space-y-2">
                  {e.exercises.map(n => (
                    <div key={n.id} className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm flex-1">{n.text}</p>
                        <button onClick={() => deleteNote(e.id, n.id, 'exercises')}><X /></button>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={n.useful}
                            onChange={() => updateExerciseProperty(e.id, n.id, 'useful', !n.useful)}
                          />
                          <span className="ml-2 text-xs">Useful?</span>
                        </label>
                        <input
                          type="text"
                          value={n.result}
                          placeholder="What did I gain from this..."
                          className="flex-1 bg-gray-800 rounded p-1 text-xs"
                          onChange={ev => updateExerciseProperty(e.id, n.id, 'result', ev.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>

          </div>
        ))}
      </div>

      {entries.length === 0 && <p className="text-center text-gray-400">No books added yet.</p>}
    </div>
  );
};

export default BookTracker;
