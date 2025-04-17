import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Activity, BarChart2, Target, Brain, Plus, Calculator, Gift, Plane, ShoppingCart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import ProjectTracker from './components/trackers/ProjectTracker';
import GoalsTracker from './components/trackers/GoalsTracker';
import MoodTracker from './components/trackers/MoodTracker';
import LifeEQTracker from './components/trackers/LifeEQTracker';
import TodoTracker from './components/trackers/TodoTracker';
import HouseholdBudgetCalculator from './components/trackers/HouseholdBudgetCalculator';
import WishlistTracker from './components/trackers/WishlistTracker';
import TravelPlanner from './components/trackers/TravelPlanner';
import ShoppingListTracker from './components/trackers/ShoppingListTracker';
import FloatingChatGPT from './components/trackers/FloatingChatGPT';

import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

type TabId =
  | 'dashboard'
  | 'projects'
  | 'goals'
  | 'mood'
  | 'lifeEQ'
  | 'todos'
  | 'budget'
  | 'wishlist'
  | 'travel'
  | 'shopping';

interface Tab {
  id: TabId;
  name: string;
  Icon: React.FC<any>;
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  }), []);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const t = p.get('tab') as TabId | null;
    if (t) {
      setActiveTab(t);
      setShowProfileSettings(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ref = doc(db, 'userSettings', user.uid);
      const snap = await getDoc(ref);
      const p = new URLSearchParams(location.search);
      if (!p.get('tab')) {
        if (snap.exists()) setActiveTab(snap.data().activeTab);
        else await setDoc(ref, { activeTab: 'dashboard' });
      }
    })();
  }, [user, location.search]);

  const saveTab = async (tab: TabId) => {
    setActiveTab(tab);
    setShowProfileSettings(false);
    navigate(`/app?tab=${tab}`);
    if (user) await updateDoc(doc(db, 'userSettings', user.uid), { activeTab: tab });
  };

  const tabs: Tab[] = [
    { id: 'dashboard', name: 'Dashboard', Icon: BarChart2 },
    { id: 'projects', name: 'Project Tracker', Icon: Activity },
    { id: 'goals', name: 'Goals Tracker', Icon: Target },
    { id: 'mood', name: 'Mood Tracker', Icon: BarChart2 },
    { id: 'lifeEQ', name: 'LifeEQ Tracker', Icon: Brain },
    { id: 'todos', name: "ToDo's", Icon: Plus },
    { id: 'budget', name: 'Household Budget', Icon: Calculator },
    { id: 'wishlist', name: 'Wishlist', Icon: Gift },
    { id: 'shopping', name: 'Shopping List', Icon: ShoppingCart },
    { id: 'travel', name: 'Travel Planner', Icon: Plane },
  ];

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
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => saveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
                activeTab === t.id ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
            >
              <t.Icon size={16} />
              {t.name}
            </button>
          ))}
        </nav>

        <div className="bg-gray-800/50 rounded-lg p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {showProfileSettings ? (
              <motion.div
                key="profile-settings"
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
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'projects' && <ProjectTracker />}
                {activeTab === 'goals' && <GoalsTracker />}
                {activeTab === 'mood' && <MoodTracker />}
                {activeTab === 'lifeEQ' && <LifeEQTracker />}
                {activeTab === 'todos' && <TodoTracker />}
                {activeTab === 'budget' && <HouseholdBudgetCalculator />}
                {activeTab === 'wishlist' && <WishlistTracker />}
                {activeTab === 'shopping' && <ShoppingListTracker />}
                {activeTab === 'travel' && <TravelPlanner />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FloatingChatGPT />
    </div>
  );
};

export default App;
