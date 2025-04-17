
import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const ensurePersistence = async () => {
    await setPersistence(auth, indexedDBLocalPersistence)
      .catch(() => setPersistence(auth, browserLocalPersistence))
      .catch(() => setPersistence(auth, inMemoryPersistence));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await ensurePersistence();
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      if (cred.user)
        await updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}` });
      navigate('/app?tab=dashboard', { replace: true });
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen animate-fadeIn">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 animate-slideIn">
        <div className="max-w-sm w-full p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Create your Account</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={submit} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={change}
                required
                className="w-1/2 px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={change}
                required
                className="w-1/2 px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={change}
              required
              className="w-full px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={change}
              required
              className="w-full px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={change}
              required
              className="w-full px-4 py-2 rounded bg-white border border-gray-300 focus:ring-purple-500"
            />

            <button
              type="submit"
              className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-4 text-center text-gray-700">
            Already have an account?{' '}
            <Link to="/signin" className="text-purple-600 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-r from-purple-800 to-purple-600 p-10 text-white animate-slideIn">
        <h1 className="text-4xl font-bold mb-4 text-center">Welcome to MyTracker</h1>
        <p className="mb-6 text-lg max-w-md text-center">
          Create an account and discover how easy organization can be – all your tasks, goals, and finances in one place.
        </p>
        <p className="text-sm text-gray-200">Trusted by over 500 000 users worldwide – free of charge.</p>
      </div>
    </div>
  );
};

export default SignUp;
