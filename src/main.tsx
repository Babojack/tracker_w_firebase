import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebaseConfig';
import Header from './header';
import PageTransitionWrapper from './PageTransitionWrapper';

import LandingPage from './LandingPage';
import SignIn from './signin';
import SignUp from './registration';
import App from './App';

import './styles/index.css';

const Root: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (
      user &&
      (location.pathname === '/signin' ||
        location.pathname === '/signup' ||
        location.pathname === '/')
    ) {
      navigate('/app?tab=dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <>
      <Header user={user} />
      <PageTransitionWrapper>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/app/*" element={<App />} />
      </PageTransitionWrapper>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => console.log('Service Worker зарегистрирован:', reg))
    .catch((err) => console.error('Service Worker‑регистрация не удалась:', err));
}
