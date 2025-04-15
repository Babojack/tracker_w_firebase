import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Target,
  Brain,
  Plus,
  Calculator,
  Gift,
  Plane,
  ShoppingCart
} from 'lucide-react';

import LandingPage from './LandingPage';  // Deine erweiterte LandingPage

import ProjectTracker from './components/trackers/ProjectTracker';
import GoalsTracker from './components/trackers/GoalsTracker';
import MoodTracker from './components/trackers/MoodTracker';
import LifeEQTracker from './components/trackers/LifeEQTracker';
import TodoTracker from './components/trackers/TodoTracker';
import HouseholdBudgetCalculator from './components/trackers/HouseholdBudgetCalculator';
import WishlistTracker from './components/trackers/WishlistTracker'; // Fixed path
import TravelPlanner from './components/trackers/TravelPlanner';
import ShoppingListTracker from './components/trackers/ShoppingListTracker';
import ProfileSettings from './components/ProfileSettings';
import Dashboard from './components/Dashboard';

// Dein ChatGPT-Widget
import FloatingChatGPT from './components/trackers/FloatingChatGPT';

// Firebase
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Typen für die Tabs
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

// Interface für Tab-Daten
interface Tab {
  id: TabId;
  name: string;
  Icon: React.FC<any>;
}

// Profil-Menü (Avatar oben rechts)
const ProfileMenu: React.FC<{
  onShowDashboard: () => void;
  onShowProfileSettings: () => void;
  onImportExport: () => void;
}> = ({ onShowDashboard, onShowProfileSettings, onImportExport }) => {
  const [open, setOpen] = useState(false);
  const user = auth.currentUser;

  const toggleMenu = () => setOpen(!open);

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="w-10 h-10 rounded-full overflow-hidden border border-gray-600"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white">
            {user?.displayName ? user.displayName[0] : 'U'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              onShowDashboard();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              onShowProfileSettings();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Profile Settings
          </button>
          <button
            onClick={() => {
              onImportExport();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Import/Export
          </button>
          <button
            onClick={() => {
              signOut(auth);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Aktiver Tab (Dashboard, Projects usw.)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Steuert, ob wir das ProfileSettings-Panel zeigen
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Für das mobile Menü
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1) Holen des eingeloggten Users via Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2) Auslesen des URL-Params "tab" (z.B. ?tab=goals) und setzen des aktiven Tabs
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (
      tabParam &&
      [
        'dashboard',
        'projects',
        'goals',
        'mood',
        'lifeEQ',
        'todos',
        'budget',
        'wishlist',
        'travel',
        'shopping'
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as TabId);
      setShowProfileSettings(false);
    }
  }, [location.search]);

  // 3) User-spezifische Einstellungen aus Firestore (z.B. letzter aktiver Tab)
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user) {
        const settingsRef = doc(db, 'userSettings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        if (!tabParam) {
          // Falls kein ?tab= in der URL, laden wir den zuletzt gespeicherten Tab aus der DB
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if (data.activeTab) setActiveTab(data.activeTab);
          } else {
            // Falls es noch keine Settings gibt, legen wir sie an
            await setDoc(settingsRef, { activeTab: 'dashboard' });
          }
        }
      }
    };
    fetchUserSettings();
  }, [user, location.search]);

  // Klick auf einen Tab -> Tab aktivieren, URL updaten, Firestore updaten
  const handleTabClick = async (tabId: TabId) => {
    setActiveTab(tabId);
    setShowProfileSettings(false);
    setIsMobileMenuOpen(false);
    navigate(`/?tab=${tabId}`);

    if (user) {
      const settingsRef = doc(db, 'userSettings', user.uid);
      try {
        await updateDoc(settingsRef, { activeTab: tabId });
      } catch (error) {
        console.error('Error updating user settings:', error);
      }
    }
  };

  // ProfileMenu-Aktionen
  const handleShowDashboard = () => handleTabClick('dashboard');
  const handleShowProfileSettings = () => {
    setShowProfileSettings(true);
    navigate('/'); // oder navigate('/?tab=dashboard') – wie du magst
  };
  const handleImportExport = () => {
    alert('Hier könnte man Import/Export-Logik implementieren!');
  };

  // Ladezustand
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // **WENN NICHT EINGELOGGT -> LandingPage**
  if (!user) {
    return <LandingPage />;
  }

  // **WENN EINGELOGGT -> Normaler "Tracker/Tab"-Bereich** 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-3 sm:p-4 md:p-6 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <nav className="mb-4 sm:mb-6 md:mb-8">
          {/* MOBILE MENU */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full bg-gray-800/50 p-3 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {(() => {
                  const activeTabData = tabs.find((tab) => tab.id === activeTab);
                  const IconComponent = activeTabData?.Icon;
                  return (
                    <>
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                      <span>{activeTabData?.name}</span>
                    </>
                  );
                })()}
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  isMobileMenuOpen ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMobileMenuOpen && (
              <div className="mt-2 bg-gray-800/50 rounded-lg overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center space-x-2 p-3 transition-colors ${
                      activeTab === tab.id ? 'bg-blue-500' : 'hover:bg-gray-700'
                    }`}
                  >
                    <tab.Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
                <div className="flex justify-end p-2 border-t border-gray-700">
                  <ProfileMenu
                    onShowDashboard={handleShowDashboard}
                    onShowProfileSettings={handleShowProfileSettings}
                    onImportExport={handleImportExport}
                  />
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-blue-500 shadow-lg' : 'hover:bg-gray-700'
                  }`}
                >
                  <tab.Icon className="w-4 h-4" />
                  <span className="text-sm whitespace-nowrap">{tab.name}</span>
                </button>
              ))}
            </div>
            <ProfileMenu
              onShowDashboard={handleShowDashboard}
              onShowProfileSettings={handleShowProfileSettings}
              onImportExport={handleImportExport}
            />
          </div>
        </nav>

        {/* HAUPT-INHALT */}
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 md:p-6 min-h-[400px]">
          {showProfileSettings ? (
            <ProfileSettings />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Floating ChatGPT Icon/Window */}
      <FloatingChatGPT />
    </div>
  );
};

export default App;
