// landingpage.tsx

import React, { useState } from 'react';
import AuthComponent from './components/AuthComponent';

// Wir importieren die Icons, die du auch im Dashboard verwendest.
// Wenn du nicht alle brauchst, kannst du sie entfernen.
import {
  Activity,    // Project Tracker
  Target,      // Goals Tracker
  BarChart2,   // Mood Tracker
  Brain,       // LifeEQ
  Plus,        // ToDo
  Calculator,  // Budget
  Gift,        // Wishlist
  Plane,       // Travel
  ShoppingCart // Shopping List
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Hier definieren wir alle Module, ähnlich wie im Dashboard
  const modules = [
    {
      title: 'Project Tracker',
      description: 'Organisiere deine Projekte und verfolge den Fortschritt.',
      icon: <Activity size={32} />,
    },
    {
      title: 'Goals Tracker',
      description: 'Setze und erreiche deine Ziele Schritt für Schritt.',
      icon: <Target size={32} />,
    },
    {
      title: 'Mood Tracker',
      description: 'Dokumentiere deine Stimmung und erkenne emotionale Muster.',
      icon: <BarChart2 size={32} />,
    },
    {
      title: 'LifeEQ Tracker',
      description: 'Finde dein Gleichgewicht in allen Lebensbereichen.',
      icon: <Brain size={32} />,
    },
    {
      title: "ToDo's",
      description: 'Behalte Aufgaben im Blick und bleibe immer organisiert.',
      icon: <Plus size={32} />,
    },
    {
      title: 'Household Budget',
      description: 'Überwache deine Ein- und Ausgaben für einen klaren Überblick.',
      icon: <Calculator size={32} />,
    },
    {
      title: 'Wishlist',
      description: 'Halte deine Wünsche fest und plane deine Anschaffungen.',
      icon: <Gift size={32} />,
    },
    {
      title: 'Travel Planner',
      description: 'Plane deine Reisen effizient und stressfrei.',
      icon: <Plane size={32} />,
    },
    {
      title: 'Shopping List',
      description: 'Erstelle Einkaufslisten und vergiss nie mehr etwas.',
      icon: <ShoppingCart size={32} />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center flex-grow px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Willkommen bei <span className="text-blue-500">MyTracker</span>
        </h1>
        <p className="text-xl max-w-2xl text-gray-300 mb-8">
          Deine All-in-One Plattform für Projekte, Ziele, Stimmung, Finanzen und vieles mehr.
          Behalte dein Leben im Blick – an einem Ort!
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors"
        >
          Jetzt loslegen
        </button>
      </header>

      {/* Features Section */}
      <section className="bg-gray-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Die Vorteile von MyTracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Alles an einem Ort</h3>
              <p className="text-gray-300">
                Verwalte Projekte, Ziele, Stimmungstagebuch, Einkaufslisten und mehr – in einer App.
              </p>
            </div>
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Intelligente Auswertungen</h3>
              <p className="text-gray-300">
                Nutze integrierte Analytics (inkl. ChatGPT-Assistent), um Fortschritte und Trends zu erkennen.
              </p>
            </div>
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Flexibel & Sicher</h3>
              <p className="text-gray-300">
                Dank Cloud-Speicherung und Firebase-Auth hast du deine Daten überall verfügbar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Block 1 */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0 md:mr-8">
              <img
                src="https://via.placeholder.com/600x400?text=Project+Tracker"
                alt="Project Tracker"
                className="rounded shadow-lg"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">Projektverwaltung leicht gemacht</h3>
              <p className="text-gray-300 mb-4">
                Behalte all deine Projekte im Blick, erstelle ToDos und messe deinen Fortschritt mit nur wenigen Klicks.
              </p>
              <p className="text-gray-300">
                Unser Tool hilft dir und deinem Team, strukturiert zu arbeiten – jederzeit und überall.
              </p>
            </div>
          </div>

          {/* Block 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center">
            <div className="md:w-1/2 mb-6 md:mb-0 md:ml-8">
              <img
                src="https://via.placeholder.com/600x400?text=Mood+Tracker"
                alt="Mood Tracker"
                className="rounded shadow-lg"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">Tägliches Stimmungsbarometer</h3>
              <p className="text-gray-300 mb-4">
                Dokumentiere deine Stimmung, identifiziere Muster und verbessere dein Wohlbefinden mit persönlichen Insights.
              </p>
              <p className="text-gray-300">
                Dank unserer Auswertungstools behältst du deine emotionale Gesundheit stets im Fokus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEUE SEKTION: Übersicht aller Module/Tracker */}
      <section className="bg-gray-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Alle Tracker-Module auf einen Blick</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Bei MyTracker findest du vielseitige Tools für jedes Lebensgebiet. Hier eine Übersicht unserer Module:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {modules.map((mod, index) => (
              <div
                key={index}
                className="p-6 bg-gray-700/50 rounded-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow"
              >
                <div className="mb-4 text-blue-400">{mod.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{mod.title}</h3>
                <p className="text-gray-300">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center bg-gray-900 text-gray-400">
        <p>© 2025 MyTracker – Alle Rechte vorbehalten.</p>
      </footer>

      {/* Modal für Login/Register (wenn showAuthModal === true) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Hier binden wir deinen AuthComponent ein */}
            <AuthComponent />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
