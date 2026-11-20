import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { CheckCircle2, Download, ExternalLink, Smartphone, X } from 'lucide-react';

interface PWAInstallButtonProps {
  label?: string;
  compactLabel?: string;
  variant?: 'header' | 'card' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  label = 'Installer App',
  compactLabel = 'Installer',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card' || variant === 'sidebar') {
      return (
        <span
          className={
            variant === 'sidebar'
              ? 'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-950/50 border border-emerald-700/50 text-emerald-300'
              : 'px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5'
          }
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">App déjà installée</span>
        </span>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setShowGuide(true);
  };

  const buttonClasses =
    variant === 'card'
      ? 'px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm'
      : variant === 'sidebar'
      ? 'w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300'
      : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer transition-colors';

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  const guideModal =
    showGuide && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">
                  Installer BATI-PILOT sur votre appareil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="rounded-xl bg-amber-950/50 border border-amber-700/60 p-3 space-y-2">
                <p className="text-xs text-amber-200 leading-relaxed">
                  <strong>Aperçu intégré détecté :</strong> les navigateurs bloquent le bouton d’installation automatique tant que l’application est ouverte dans une fenêtre intégrée.
                </p>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir dans un onglet navigateur pour installer</span>
                </a>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              {isIOS ? (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                  <p className="font-bold text-white">Sur iPhone / iPad (Safari) :</p>
                  <p>1. Touchez le bouton <strong>Partager</strong> dans la barre Safari.</p>
                  <p>2. Appuyez sur <strong>Sur l’écran d’accueil</strong> puis <strong>Ajouter</strong>.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                    <p className="font-bold text-white">Sur Android (Chrome) :</p>
                    <p>1. Ouvrez BATI-PILOT dans un onglet Chrome normal (hors aperçu).</p>
                    <p>2. Appuyez sur le menu <strong>⋮</strong> en haut à droite &rarr; <strong>Ajouter à l’écran d’accueil / Installer l’application</strong>.</p>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                    <p className="font-bold text-white">Sur Ordinateur (Chrome / Edge) :</p>
                    <p>Cliquez sur l’icône <strong>Installer BATI-PILOT</strong> à droite dans la barre d’adresse du navigateur.</p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        title={
          isInstallable
            ? 'Installer BATI-PILOT sur cet appareil (PWA)'
            : 'Installer BATI-PILOT sur mobile ou ordinateur (PWA)'
        }
      >
        {isIOS ? (
          <Smartphone className={variant === 'sidebar' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5'} />
        ) : (
          <Download className={variant === 'sidebar' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5'} />
        )}
        {variant === 'card' || variant === 'sidebar' ? (
          <span className="truncate">{label}</span>
        ) : (
          <>
            <span className="hidden xl:inline">{label}</span>
            <span className="xl:hidden">{compactLabel}</span>
          </>
        )}
      </button>

      {guideModal}
    </>
  );
};
