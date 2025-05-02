// src/App.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Target,
  Brain,
  Plus,
  Calculator,
  Gift,
  Plane,
  ShoppingCart,
  BookOpen,
  User,
  Clock,
  Film,
  Menu,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import DailyFlow from './components/trackers/DailyFlow';
const ProjectTracker = lazy(() => import('./components/trackers/ProjectTracker'));
const GoalsTracker = lazy(() => import('./components/trackers/GoalsTracker'));
const MoodTracker = lazy(() => import('./components/trackers/MoodTracker'));
const LifeEQTracker = lazy(() => import('./components/trackers/LifeEQTracker'));
const TodoTracker = lazy(() => import('./components/trackers/TodoTracker'));
const HouseholdBudgetCalculator = lazy(() => import('./components/trackers/HouseholdBudgetCalculator'));
const WishlistTracker = lazy(() => import('./components/trackers/WishlistTracker'));
const TravelPlanner = lazy(() => import('./components/trackers/TravelPlanner'));
const ShoppingListTracker = lazy(() => import('./components/trackers/ShoppingListTracker'));
const MovieWishlist = lazy(() => import('./components/trackers/MovieWishlist'));
const FloatingChatGPT = lazy(() => import('./components/trackers/FloatingChatGPT'));
const BookTracker = lazy(() => import('./components/trackers/BookTracker'));

import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type TabId =
  | 'dashboard'
  | 'projects'
  | 'goals'
  | 'mood'
  | 'lifeEQ'
  | 'todos'
  | 'budget'
  | 'wishlist'
  | 'movies'
  | 'travel'
  | 'shopping'
  | 'books'
  | 'flow';

interface Tab {
  id: TabId;
  name: string;
  Icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'dashboard', name: 'Dashboard', Icon: BarChart2 },
  { id: 'projects', name: 'Projects', Icon: Activity },
  { id: 'goals', name: 'Goals', Icon: Target },
  { id: 'mood', name: 'Mood', Icon: BarChart2 },
  { id: 'lifeEQ', name: 'LifeEQ', Icon: Brain },
  { id: 'todos', name: "ToDo's", Icon: Plus },
  { id: 'budget', name: 'Budget', Icon: Calculator },
  { id: 'wishlist', name: 'Wishlist', Icon: Gift },
  { id: 'movies', name: 'Movies', Icon: Film },
  { id: 'books', name: 'Books', Icon: BookOpen },
  { id: 'shopping', name: 'Shopping', Icon: ShoppingCart },
  { id: 'travel', name: 'Travel', Icon: Plane },
  { id: 'flow', name: 'Flow', Icon: Clock },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') as TabId | null;
    if (tab) {
      setActiveTab(tab);
      setShowProfileSettings(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, 'userSettings', user.uid);
      const snap = await getDoc(ref);
      if (!new URLSearchParams(location.search).get('tab')) {
        if (snap.exists()) {
          setActiveTab((snap.data() as any).activeTab || 'dashboard');
        } else {
          await setDoc(ref, { activeTab: 'dashboard' }, { merge: true });
        }
      }
    })();
  }, [user, location.search]);

  const changeTab = async (tab: TabId) => {
    setActiveTab(tab);
    setShowProfileSettings(false);
    setMobileMenuOpen(false);
    navigate(`/app?tab=${tab}`, { replace: true });
    if (user) {
      await setDoc(doc(db, 'userSettings', user.uid), { activeTab: tab }, { merge: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto p-4">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">MyLife Dashboard</h1>
          {/* Desktop Profile */}
          <button
            onClick={() => setShowProfileSettings(v => !v)}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
          >
            <User size={18} /><span>Profile</span>
          </button>
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden p-2 focus:outline-none"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* NAVIGATION */}
        {/* Desktop: mehrzeiliges Flex-Wrap statt Scroll */}
        <nav className="hidden md:flex md:flex-wrap gap-2 mb-6 pb-2 border-b border-gray-700">
          {tabs.map(({ id, name, Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                ${activeTab === id
                  ? 'bg-purple-600 shadow-md shadow-purple-500/30 scale-105'
                  : 'bg-gray-700/50 hover:bg-gray-700 hover:scale-105'
                }`}
            >
              <Icon size={18} /><span className="whitespace-nowrap">{name}</span>
            </button>
          ))}
        </nav>

        {/* Mobile Overlay Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-lg z-50 p-4"
            >
              <h2 className="text-xl font-semibold mb-4">Navigation</h2>
              <ul className="space-y-2">
                {tabs.map(({ id, name, Icon }) => (
                  <li key={id}>
                    <button
                      onClick={() => changeTab(id)}
                      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition
                        ${activeTab === id
                          ? 'bg-purple-600'
                          : 'hover:bg-gray-700/60'
                        }`}
                    >
                      <Icon size={20} /><span>{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowProfileSettings(v => !v);
                }}
                className="mt-6 flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition w-full"
              >
                <User size={20} /><span>Profile</span>
              </button>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT */}
        <div className="bg-gray-800/50 rounded-xl p-6 min-h-[60vh] shadow-inner relative">
          <AnimatePresence mode="wait">
            {showProfileSettings ? (
              <motion.div
                key="profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <ProfileSettings />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Suspense fallback={<p className="text-center p-6">Loading module…</p>}>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'projects' && <ProjectTracker />}
                  {activeTab === 'goals' && <GoalsTracker />}
                  {activeTab === 'mood' && <MoodTracker />}
                  {activeTab === 'lifeEQ' && <LifeEQTracker />}
                  {activeTab === 'todos' && <TodoTracker />}
                  {activeTab === 'budget' && <HouseholdBudgetCalculator />}
                  {activeTab === 'wishlist' && <WishlistTracker />}
                  {activeTab === 'books' && <BookTracker />}
                  {activeTab === 'shopping' && <ShoppingListTracker />}
                  {activeTab === 'movies' && <MovieWishlist />}
                  {activeTab === 'travel' && <TravelPlanner />}
                  {activeTab === 'flow' && <DailyFlow />}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating ChatGPT */}
      <Suspense fallback={null}>
        <FloatingChatGPT />
      </Suspense>
    </div>
  );
};

export default App;
