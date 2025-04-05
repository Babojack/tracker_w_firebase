import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart2,
  Target,
  Brain,
  Plus,
  Calculator,
  Gift
} from 'lucide-react';

import ProjectTracker from './components/trackers/ProjectTracker';
import GoalsTracker from './components/trackers/GoalsTracker';
import MoodTracker from './components/trackers/MoodTracker';
import LifeEQTracker from './components/trackers/LifeEQTracker';
import TodoTracker from './components/trackers/TodoTracker';
import HouseholdBudgetCalculator from './components/trackers/HouseholdBudgetCalculator';
import WishlistTracker from './components/trackers/WishlistTracker';

import ProfileSettings from './components/ProfileSettings'; // Ваш компонент с настройками профиля
import AuthComponent from './components/AuthComponent';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Пример: при желании можно добавить собственный Dashboard-компонент
const Dashboard: React.FC = () => {
  return <div className="text-white">Здесь контент вашей «Главной страницы» (Dashboard)</div>;
};

// Типы для вкладок (без Dashboard!)
type TabId = 'projects' | 'goals' | 'mood' | 'lifeEQ' | 'todos' | 'budget' | 'wishlist';

interface Tab {
  id: TabId;
  name: string;
  Icon: React.FC<any>;
}

// Компонент выпадающего меню профиля
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
      {/* Кнопка с фото профиля (или инициалами) */}
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

      {/* Выпадающее меню */}
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Состояние для трекеров (какая вкладка активна)
  const [activeTab, setActiveTab] = useState<TabId>('projects');

  // Флаги для показа Dashboard и ProfileSettings
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Открыто ли мобильное меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Синхронизация с Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Пример: загружаем из Firestore настройки пользователя (активная вкладка и т.п.)
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (user) {
        const settingsRef = doc(db, 'userSettings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.activeTab) {
            setActiveTab(data.activeTab);
          }
          // Если хотите хранить showDashboard / showProfileSettings в Firestore, тоже можно
        } else {
          await setDoc(settingsRef, { activeTab: 'projects' });
        }
      }
    };
    fetchUserSettings();
  }, [user]);

  // При клике на вкладку убираем Dashboard/Settings
  const handleTabClick = async (tabId: TabId) => {
    setActiveTab(tabId);
    setShowDashboard(false);
    setShowProfileSettings(false);
    setIsMobileMenuOpen(false);

    if (user) {
      const settingsRef = doc(db, 'userSettings', user.uid);
      try {
        await updateDoc(settingsRef, { activeTab: tabId });
      } catch (error) {
        console.error('Error updating user settings:', error);
      }
    }
  };

  // Показать Dashboard (из меню профиля)
  const handleShowDashboard = () => {
    setShowDashboard(true);
    setShowProfileSettings(false);
  };

  // Показать ProfileSettings (из меню профиля)
  const handleShowProfileSettings = () => {
    setShowProfileSettings(true);
    setShowDashboard(false);
  };

  // Пример Import/Export
  const handleImportExport = () => {
    alert('Здесь логика Import/Export');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <AuthComponent />;

  // Массив вкладок (без Dashboard)
  const tabs: Tab[] = [
    { id: 'projects', name: 'Project Tracker', Icon: Activity },
    { id: 'goals', name: 'Goals Tracker', Icon: Target },
    { id: 'mood', name: 'Mood Tracker', Icon: BarChart2 },
    { id: 'lifeEQ', name: 'LifeEQ Tracker', Icon: Brain },
    { id: 'todos', name: "ToDo's", Icon: Plus },
    { id: 'budget', name: 'Household Budget', Icon: Calculator },
    { id: 'wishlist', name: 'Wunschliste', Icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 sm:mb-6 md:mb-8 flex justify-between items-center">
          {/* Левая часть – меню вкладок */}
          <div>
            {/* Мобильное меню */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full bg-gray-800/50 p-3 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {(() => {
                    const activeTabData = tabs.find(tab => tab.id === activeTab);
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
                </div>
              )}
            </div>
            {/* Десктопное меню */}
            <div className="hidden md:flex flex-wrap gap-2 bg-gray-800/50 p-3 rounded-lg">
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
          </div>

          {/* Правая часть – меню профиля */}
          <div className="flex items-center space-x-3">
            <ProfileMenu
              onShowDashboard={handleShowDashboard}
              onShowProfileSettings={handleShowProfileSettings}
              onImportExport={handleImportExport}
            />
          </div>
        </nav>

        {/* Основная область контента */}
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 md:p-6 min-h-[400px]">
          {showProfileSettings ? (
            <ProfileSettings />
          ) : showDashboard ? (
            <Dashboard />
          ) : (
            <>
              {activeTab === 'projects' && <ProjectTracker />}
              {activeTab === 'goals' && <GoalsTracker />}
              {activeTab === 'mood' && <MoodTracker />}
              {activeTab === 'lifeEQ' && <LifeEQTracker />}
              {activeTab === 'todos' && <TodoTracker />}
              {activeTab === 'budget' && <HouseholdBudgetCalculator />}
              {activeTab === 'wishlist' && <WishlistTracker />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
