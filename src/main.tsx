import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Typischer Registrierungs-Code (z. B. bei Verwendung von Vite-PWA-Plugin)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" })
    .then((registration) => {
      console.log("Service Worker registriert:", registration);
    })
    .catch((error) => {
      console.error("Service Worker-Registrierung fehlgeschlagen:", error);
    });
}
