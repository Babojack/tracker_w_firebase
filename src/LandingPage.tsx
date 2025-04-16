import React, { useState } from 'react';
import AuthComponent from './components/AuthComponent';

import {
  Activity,    // Project Tracker
  Target,      // Goals Tracker
  BarChart2,   // Mood Tracker
  Brain,       // LifeEQ Tracker
  Plus,        // ToDo's
  Calculator,  // Household Budget
  Gift,        // Wishlist
  Plane,       // Travel Planner
  ShoppingCart // Shopping List
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Define all modules in English with an added "gif" property for the backside content
  const modules = [
    {
      title: 'Project Tracker',
      description: 'Organize your projects and track progress.',
      icon: <Activity size={32} />,
      gif: 'src/assets/projecttracker.gif',
    },
    {
      title: 'Goals Tracker',
      description: 'Set and achieve your goals step by step.',
      icon: <Target size={32} />,
      gif: 'src/assets/goals.gif',
    },
    {
      title: 'Mood Tracker',
      description: 'Document your mood and recognize emotional patterns.',
      icon: <BarChart2 size={32} />,
      gif: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif',
    },
    {
      title: 'LifeEQ Tracker',
      description: 'Find balance in all areas of your life.',
      icon: <Brain size={32} />,
      gif: 'https://media.giphy.com/media/3orieWfIgbngFYwV8k/giphy.gif',
    },
    {
      title: "ToDo's",
      description: 'Keep track of tasks and stay organized.',
      icon: <Plus size={32} />,
      gif: 'https://media.giphy.com/media/10SvWCbt1ytWCc/giphy.gif',
    },
    {
      title: 'Household Budget',
      description: 'Monitor your income and expenses for a clear overview.',
      icon: <Calculator size={32} />,
      gif: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    },
    {
      title: 'Wishlist',
      description: 'Record your wishes and plan your purchases.',
      icon: <Gift size={32} />,
      gif: 'https://media.giphy.com/media/26BRuo6sLetdllPAQ/giphy.gif',
    },
    {
      title: 'Travel Planner',
      description: 'Plan your trips efficiently and stress-free.',
      icon: <Plane size={32} />,
      gif: 'https://media.giphy.com/media/3oEjHP8ELRNNlnlLGM/giphy.gif',
    },
    {
      title: 'Shopping List',
      description: 'Create shopping lists and never forget anything again.',
      icon: <ShoppingCart size={32} />,
      gif: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center flex-grow px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to <span className="text-blue-500">MyTracker</span>
        </h1>
        <p className="text-xl max-w-2xl text-gray-300 mb-8">
          Your all-in-one platform for projects, goals, mood, finances, and much more.
          Keep your life in view – all in one place!
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors"
        >
          Get Started
        </button>
      </header>

      {/* Features Section */}
      <section className="bg-gray-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">The Advantages of MyTracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Everything in One Place</h3>
              <p className="text-gray-300">
                Manage projects, goals, mood journals, shopping lists, and more – all in one app.
              </p>
            </div>
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Intelligent Analytics</h3>
              <p className="text-gray-300">
                Use integrated analytics (including a ChatGPT assistant) to track progress and identify trends.
              </p>
            </div>
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Flexible & Secure</h3>
              <p className="text-gray-300">
                With cloud storage and Firebase-Auth, your data is available wherever you are.
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
                src="src/assets/projecttracker.gif"
                alt="Project Tracker"
                className="rounded shadow-lg"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold mb-4">Project Management Made Easy</h3>
              <p className="text-gray-300 mb-4">
                Keep track of all your projects, create ToDos, and measure your progress with just a few clicks.
              </p>
              <p className="text-gray-300">
                Our tool helps you and your team work in a structured way – anytime, anywhere.
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
              <h3 className="text-2xl font-bold mb-4">Daily Mood Barometer</h3>
              <p className="text-gray-300 mb-4">
                Document your mood, identify patterns, and improve your well-being with personalized insights.
              </p>
              <p className="text-gray-300">
                Our analytics tools ensure your emotional health always stays in focus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Overview of All Tracker Modules */}
      <section className="bg-gray-800/50 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Overview of All Tracker Modules</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            With MyTracker, you'll find versatile tools for every area of life. Here is an overview of our modules:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {modules.map((mod, index) => (
              <div key={index} className="group [perspective:1000px] h-60">
                <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  {/* Front side */}
                  <div className="absolute w-full h-full p-6 bg-gray-700/50 rounded-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow [backface-visibility:hidden]">
                    <div className="mb-4 text-blue-400">{mod.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{mod.title}</h3>
                    <p className="text-gray-300">{mod.description}</p>
                  </div>
                  {/* Back side with GIF */}
                  <div className="absolute w-full h-full p-6 bg-gray-800 rounded-lg flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <img
                      src={mod.gif}
                      alt={`${mod.title} GIF`}
                      className="max-h-full max-w-full rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center bg-gray-900 text-gray-400">
        <p>© 2025 MyTracker – All Rights Reserved.</p>
      </footer>

      {/* Modal for Login/Register (when showAuthModal is true) */}
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
            {/* Include your AuthComponent */}
            <AuthComponent />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
