import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { installFetchAuthInterceptor } from './utils/installFetchAuthInterceptor';
import App from './App.tsx';
import './index.css';

installFetchAuthInterceptor();

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('bati-pilot-sw-ready'));
      },
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent('bati-pilot-sw-update'));
      },
    });
  } else {
    // En mode développement / aperçu AI Studio : nettoyer tout ancien Service Worker dev-sw.js
    // qui aurait pu mettre en cache une ancienne réponse HTML.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          const scriptUrl = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
          if (scriptUrl.includes('dev-sw.js')) {
            void reg.unregister();
          }
        });
      })
      .catch(() => undefined);

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys
            .filter((k) => k.includes('workbox-precache'))
            .forEach((k) => {
              void caches.delete(k);
            });
        })
        .catch(() => undefined);
    }
  }
}

createRoot(document.getElementById('root')!).render(<App />);
