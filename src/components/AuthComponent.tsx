import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const AuthComponent: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: `${formData.firstName} ${formData.lastName}`,
          });
        }
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold text-center mb-4">
        {isRegister ? 'Register' : 'Login'}
      </h2>
      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div className="flex space-x-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
        />
        {isRegister && (
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          />
        )}
        <button
          type="submit"
          className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors"
        >
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-gray-600"></div>
        <span className="mx-4 text-gray-400">or</span>
        <div className="flex-grow h-px bg-gray-600"></div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
      >
        Sign in with Google
      </button>

      <p className="text-center mt-4 text-gray-400">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-purple-400 hover:underline"
        >
          {isRegister ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  );
};

export default AuthComponent;
