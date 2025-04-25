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
const FloatingChatGPT = lazy(() => import('./components/trackers/FloatingChatGPT'));
const BookTracker = lazy(() => import('./components/trackers/BookTracker'));

import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export type TabId =
  | 'dashboard'
  | 'projects'
  | 'goals'
  | 'mood'
  | 'lifeEQ'
  | 'todos'
  | 'budget'
  | 'wishlist'
  | 'travel'
  | 'shopping'
  | 'books'
  | 'flow';

interface Tab {
  id: TabId;
  name: string;
  Icon: React.ElementType;
}

const dailyFlow = [
  { time: '07:00', icon: <Clock size={20} />, title: 'Morning Snapshot', desc: 'Quick mood log & review today’s goals.' },
  { time: '09:00', icon: <BookOpen size={20} />, title: 'Deep‑Work Block', desc: 'Start Focus Timer in Project Tracker.' },
  { time: '12:30', icon: <Plus size={20} />, title: 'Lunch & Reflect', desc: 'Update Mood, tick completed tasks.' },
  { time: '15:00', icon: <Calculator size={20} />, title: 'Budget Check‑in', desc: 'Log any expenses, update balance.' },
  { time: '18:00', icon: <Target size={20} />, title: 'Evening Wind‑Down', desc: 'Review progress & plan tomorrow.' },
  { time: '22:30', icon: <Brain size={20} />, title: 'Sleep & Sync', desc: 'All data auto‑syncs. Time to rest.' },
];

const tabs: Tab[] = [
  { id: 'dashboard', name: 'Dashboard', Icon: BarChart2 },
  { id: 'projects', name: 'Project Tracker', Icon: Activity },
  { id: 'goals', name: 'Goals Tracker', Icon: Target },
  { id: 'mood', name: 'Mood Tracker', Icon: BarChart2 },
  { id: 'lifeEQ', name: 'LifeEQ Tracker', Icon: Brain },
  { id: 'todos', name: "ToDo's", Icon: Plus },
  { id: 'budget', name: 'Household Budget', Icon: Calculator },
  { id: 'wishlist', name: 'Wishlist', Icon: Gift },
  { id: 'books', name: 'Book Tracker', Icon: BookOpen },
  { id: 'shopping', name: 'Shopping List', Icon: ShoppingCart },
  { id: 'travel', name: 'Travel Planner', Icon: Plane },
  { id: 'flow', name: 'Daily Flow', Icon: Clock },
];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const urlTab = new URLSearchParams(location.search).get('tab') as TabId | null;
    if (urlTab) {
      setActiveTab(urlTab);
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
          setActiveTab((snap.data() as { activeTab: TabId }).activeTab || 'dashboard');
        } else {
          await setDoc(ref, { activeTab: 'dashboard' }, { merge: true });
        }
      }
    })();
  }, [user, location.search]);

  const changeTab = async (tab: TabId) => {
    setActiveTab(tab);
    setShowProfileSettings(false);
    navigate(`/app?tab=${tab}`);
    if (user) await setDoc(doc(db, 'userSettings', user.uid), { activeTab: tab }, { merge: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 relative">
      <div className="max-w-7xl mx-auto">
        <nav className="flex flex-wrap gap-2 mb-6">
          {tabs.map(({ id, name, Icon }) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                activeTab === id ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
          <button
            onClick={() => setShowProfileSettings((v) => !v)}
            className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors"
          >
            <User size={16} />
            Profile
          </button>
        </nav>

        <div className="bg-gray-800/50 rounded-lg p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {showProfileSettings ? (
              <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ProfileSettings />
              </motion.div>
            ) : (
              <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit">
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
                  {activeTab === 'travel' && <TravelPlanner />}
                  {activeTab === 'flow' && <DailyFlow items={dailyFlow} />}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Suspense fallback={null}>
        <FloatingChatGPT />
      </Suspense>
    </div>
  );
};

export default App;
