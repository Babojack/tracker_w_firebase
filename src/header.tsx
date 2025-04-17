import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  user: any;                                   // auth.currentUser или null
  onShowDashboard?: () => void;
  onShowProfileSettings?: () => void;
  onImportExport?: () => void;
}

/** Вспомогательный дроп‑даун с аватаркой и пунктами меню */
const ProfileMenu: React.FC<{
  user: any;
  onShowDashboard?: () => void;
  onShowProfileSettings?: () => void;
  onImportExport?: () => void;
}> = ({ user, onShowDashboard, onShowProfileSettings, onImportExport }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full overflow-hidden border border-gray-600"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white">
            {user?.displayName?.[0] || 'U'}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              onShowDashboard?.();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              onShowProfileSettings?.();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Profile Settings
          </button>
          <button
            onClick={() => {
              onImportExport?.();
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
          >
            Import / Export
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

const Header: React.FC<HeaderProps> = ({
  user,
  onShowDashboard,
  onShowProfileSettings,
  onImportExport,
}) => (
  <header className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
    <div className="text-2xl font-bold">
      <Link to="/">MyTracker</Link>
    </div>

    {user ? (
      <ProfileMenu
        user={user}
        onShowDashboard={onShowDashboard}
        onShowProfileSettings={onShowProfileSettings}
        onImportExport={onImportExport}
      />
    ) : (
      <nav className="space-x-4">
        <Link to="/signin" className="px-3 py-2 rounded hover:bg-gray-700 transition-colors">
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-3 py-2 rounded bg-gradient-to-r from-purple-600 to-blue-500 font-semibold hover:from-purple-700 hover:to-blue-600 transition-colors"
        >
          Get Started
        </Link>
      </nav>
    )}
  </header>
);

export default Header;
