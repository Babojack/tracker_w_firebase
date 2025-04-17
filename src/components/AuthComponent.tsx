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
      // Registrierungsmodus
      if (formData.password !== formData.confirmPassword) {
        setError('Die Passwörter stimmen nicht überein.');
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
      // Anmeldemodus
      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* LINKER BEREICH (FORMULAR) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100">
        {/* Um das Formular zentriert und angenehm zu platzieren, begrenzen wir die Breite */}
        <div className="max-w-sm w-full p-8">
          <h2 className="text-3xl font-bold text-center mb-6">
            {isRegister ? 'Konto erstellen' : 'Anmelden'}
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nur anzeigen, wenn sich Benutzer registriert */}
            {isRegister && (
              <div className="flex space-x-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Vorname"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-1/2 px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Nachname"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-1/2 px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <input
              type="email"
              name="email"
              placeholder="E-Mail"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <input
              type="password"
              name="password"
              placeholder="Passwort"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {isRegister && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Passwort bestätigen"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded bg-white placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}

            <button
              type="submit"
              className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors"
            >
              {isRegister ? 'Konto anlegen' : 'Anmelden'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="mx-4 text-gray-500">oder</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
          >
            Mit Google anmelden
          </button>

          <p className="text-center mt-4 text-gray-600">
            {isRegister ? 'Du hast bereits ein Konto?' : 'Noch kein Konto?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-600 hover:underline"
            >
              {isRegister ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </p>
        </div>
      </div>

      {/* RECHTER BEREICH (BRANDING) - Wird auf kleineren Screens ausgeblendet */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col items-center justify-center bg-gradient-to-r from-purple-800 to-purple-600 p-10 text-white">
        <h1 className="text-4xl font-bold mb-4 text-center">Bleibe organisiert mit MyTracker</h1>
        <p className="mb-6 text-lg max-w-md text-center">
          Verwalte Aufgaben, Ziele, Finanzen und mehr – alles an einem Ort. 
          So hast du dein Leben stets im Blick.
        </p>
        <p className="text-sm text-gray-200">
          Bereits über 500.000 Nutzer sind dabei – dauerhaft kostenlos.
        </p>
      </div>
    </div>
  );
};

export default AuthComponent;
