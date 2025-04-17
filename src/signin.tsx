import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/app?tab=dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/app?tab=dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen animate-fadeIn">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 animate-slideIn">
        <div className="max-w-sm w-full p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Sign In</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            />
            <button
              type="submit"
              className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors duration-300"
            >
              Sign In
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors duration-300"
          >
            Sign in with Google
          </button>

          <div className="mt-4 text-center text-gray-700">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-600 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-r from-purple-800 to-purple-600 p-10 text-white animate-slideIn">
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome to MyTracker</h1>
        <p className="mb-6 text-lg max-w-md text-center">
          Keep track of your projects, goals, and finances with ease. Discover how simple organization can be – all in one place.
        </p>
        <p className="text-sm text-gray-200">Trusted by over 500,000 users – free and reliable.</p>
      </div>
    </div>
  );
};

export default SignIn;
