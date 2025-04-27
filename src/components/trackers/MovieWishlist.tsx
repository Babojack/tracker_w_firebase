import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

interface MovieItem {
  id: string;
  title: string;
  link?: string;
  posterUrl?: string;
  userId: string;
  rating?: number;
  genreIds?: number[];
  releaseDate?: string;
}

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids?: number[];
  release_date?: string;
}

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

const MovieWishlist: React.FC = () => {
  const [wishlist, setWishlist] = useState<MovieItem[]>([]);
  const [queryText, setQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [filterRating, setFilterRating] = useState(0);
  const [filterGenre, setFilterGenre] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState('');
  const [savedQuery, setSavedQuery] = useState('');

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const q = query(collection(db, 'movieWishlist'), where('userId', '==', uid));
      const snap = await getDocs(q);
      setWishlist(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<MovieItem, 'id'>) }))
      );
    };
    load();
  }, []);

  const searchMovies = async (text: string) => {
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
      text
    )}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      setSearchResults([]);
      return;
    }
    const { results } = (await resp.json()) as { results: TMDBMovie[] };
    setSearchResults(results);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      queryText.trim() ? searchMovies(queryText) : setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [queryText]);

  const addMovie = async (m: TMDBMovie) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const payload = {
      userId: uid,
      title: m.title,
      posterUrl: m.poster_path
        ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
        : undefined,
      link: '',
      rating: 0,
      genreIds: m.genre_ids || [],
      releaseDate: m.release_date || ''
    };
    const ref = await addDoc(collection(db, 'movieWishlist'), payload);
    setWishlist(prev => [...prev, { id: ref.id, ...payload }]);
  };

  const removeMovie = async (id: string) => {
    await deleteDoc(firestoreDoc(db, 'movieWishlist', id));
    setWishlist(prev => prev.filter(m => m.id !== id));
  };

  const updateLink = async (id: string, link: string) => {
    const docRef = firestoreDoc(db, 'movieWishlist', id);
    await updateDoc(docRef, { link });
    setWishlist(prev => prev.map(m => (m.id === id ? { ...m, link } : m)));
  };

  const updateRating = async (id: string, stars: number) => {
    const docRef = firestoreDoc(db, 'movieWishlist', id);
    await updateDoc(docRef, { rating: stars });
    setWishlist(prev => prev.map(m => (m.id === id ? { ...m, rating: stars } : m)));
  };

  const years = Array.from(
    new Set(
      wishlist
        .map(m => m.releaseDate?.slice(0, 4))
        .filter(y => y)
    )
  ).sort((a, b) => (b as string).localeCompare(a as string));

  const filteredWishlist = wishlist.filter(m =>
    (filterRating === 0 || (m.rating ?? 0) >= filterRating) &&
    (filterGenre === '' || m.genreIds?.includes(filterGenre as number)) &&
    (filterYear === '' || m.releaseDate?.startsWith(filterYear)) &&
    (savedQuery === '' ||
      m.title.toLowerCase().includes(savedQuery.toLowerCase()))
  );

  return (
    <div className="w-full p-6 bg-gray-900 text-white rounded-lg space-y-6">
      <h2 className="text-2xl font-bold">My Movie Wishlist</h2>

      <div className="relative flex items-center">
        <input
          type="text"
          className="flex-1 p-2 bg-gray-800 rounded outline-none"
          placeholder="Type to search for movies..."
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
        />
        {queryText && (
          <button onClick={() => setQueryText('')} className="absolute right-2 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {searchResults.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {searchResults.map(m => (
            <li
              key={m.id}
              className="bg-gray-800 rounded overflow-hidden flex flex-col"
            >
              {m.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-2 flex-1 flex flex-col justify-between">
                <p className="font-semibold truncate">{m.title}</p>
                <button
                  onClick={() => addMovie(m)}
                  className="mt-2 w-full py-1 bg-green-600 rounded hover:bg-green-700"
                >
                  Add to Wishlist
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4">        
        <input
          type="text"
          placeholder="Search your wishlist..."
          className="p-2 bg-gray-800 rounded outline-none"
          value={savedQuery}
          onChange={e => setSavedQuery(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <select
            value={filterRating}
            onChange={e => setFilterRating(Number(e.target.value))}
            className="bg-gray-800 p-2 rounded"
          >
            <option value={0}>All Ratings</option>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>
                {n}+ stars
              </option>
            ))}
          </select>
          <select
            value={filterGenre}
            onChange={e =>
              setFilterGenre(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="bg-gray-800 p-2 rounded"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="">All Years</option>
            {years.map(y => (
              <option key={y as string} value={y as string}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredWishlist.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredWishlist.map(m => (
            <li
              key={m.id}
              className="relative bg-gray-800 rounded overflow-hidden flex flex-col"
            >
              {m.posterUrl && (
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-2 flex-1 flex flex-col">
                <p className="font-semibold truncate">{m.title}</p>
                <input
                  type="text"
                  placeholder="Your link"
                  className="mt-1 p-1 bg-gray-700 rounded text-sm outline-none"
                  defaultValue={m.link}
                  onBlur={e => updateLink(m.id, e.target.value)}
                />
                <button
                  onClick={() => m.link && window.open(m.link, '_blank')}
                  className="mt-1 w-full py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                >
                  GO
                </button>
                <div className="flex items-center mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n}
                      size={18}
                      fill={n <= (m.rating ?? 0) ? '#facc15' : 'none'}
                      stroke={n <= (m.rating ?? 0) ? '#facc15' : '#4b5563'}
                      strokeWidth={1.6}
                      className="cursor-pointer"
                      onClick={() => updateRating(m.id, n)}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => removeMovie(m.id)}
                className="absolute top-2 right-2 text-red-500"
              >
                <X size={20} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No movies found.</p>
      )}
    </div>
  );
};

export default MovieWishlist;
