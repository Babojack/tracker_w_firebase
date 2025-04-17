// src/signin.tsx
import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /** pick the best persistence available for this browser */
  const ensurePersistence = async () => {
    await setPersistence(auth, indexedDBLocalPersistence)
      .catch(() => setPersistence(auth, browserLocalPersistence))
      .catch(() => setPersistence(auth, inMemoryPersistence)); // ultimate fallback
  };

  /** Google sign‑in with popup → redirect fallback */
  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await ensurePersistence();
      await signInWithPopup(auth, provider);
      navigate('/app?tab=dashboard', { replace: true });
    } catch (e: any) {
      // fallback if popup blocked / not supported
      if (
        e.code === 'auth/popup-blocked' ||
        e.code === 'auth/operation-not-supported-in-this-environment' ||
        e.code === 'auth/popup-closed-by-user'
      ) {
        try {
          await auth.signOut();         // clear any partial session
          await signInWithRedirect(auth, provider);
        } catch (err: any) {
          setError(err.message);
        }
      } else {
        setError(e.message);
      }
    }
  };

  /** Email + password sign‑in */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await ensurePersistence();
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/app?tab=dashboard', { replace: true });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen animate-fadeIn">
      {/* form side */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 animate-slideIn">
        <div className="max-w-sm w-full p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Sign In</h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={onChange}
              required
              className="w-full px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={onChange}
              required
              className="w-full px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600"
            >
              Sign In
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
          >
            Sign in with Google
          </button>

          <div className="mt-4 text-center text-gray-700">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-purple-600 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>

      {/* branding side */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-r from-purple-800 to-purple-600 p-10 text-white animate-slideIn">
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome to MyTracker</h1>
        <p className="mb-6 text-lg max-w-md text-center">
          Keep track of projects, goals and finances — all in one place.
        </p>
        <p className="text-sm text-gray-200">
          Trusted by over 500 000 users worldwide — free and reliable.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
