import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let cachedPrompt: BeforeInstallPromptEvent | null = null;
let cachedInstalled = false;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  cachedInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    notifyAll();
  });

  window.addEventListener('appinstalled', () => {
    cachedInstalled = true;
    cachedPrompt = null;
    notifyAll();
  });
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS] = useState(() =>
    typeof window !== 'undefined' ? /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) : false
  );
  const [isInIframe] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const install = async () => {
    if (!cachedPrompt) return false;
    await cachedPrompt.prompt();
    const { outcome } = await cachedPrompt.userChoice;
    if (outcome === 'accepted') {
      cachedInstalled = true;
      cachedPrompt = null;
      notifyAll();
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!cachedPrompt,
    isInstalled: cachedInstalled,
    isIOS,
    isInIframe,
    install,
  };
}
