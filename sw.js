if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // в продакшене and dev на Netlify это сработает
      const swPath = '/sw.js';
  
      // отключаем на localhost, если не нужен
      if (location.hostname === 'localhost') return;
  
      navigator.serviceWorker
        .register(swPath, { scope: '/' })
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.error('SW registration failed', err));
    });
  }
  