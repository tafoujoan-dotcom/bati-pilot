import { useEffect, useState } from 'react';

const SIM_OFFLINE_KEY = 'bati_pilot_simulated_offline';

export function getSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(SIM_OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSimulatedOffline(offline: boolean) {
  try {
    localStorage.setItem(SIM_OFFLINE_KEY, offline ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('bati-pilot-offline-mode', { detail: offline }));
  } catch {
    // ignore storage errors
  }
}

export function useOnlineStatus() {
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimOffline] = useState<boolean>(() => getSimulatedOffline());

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    const handleSimToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setSimOffline(Boolean(custom.detail));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('bati-pilot-offline-mode', handleSimToggle);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('bati-pilot-offline-mode', handleSimToggle);
    };
  }, []);

  return {
    browserOnline,
    simulatedOffline,
    isOnline: browserOnline && !simulatedOffline,
  };
}
