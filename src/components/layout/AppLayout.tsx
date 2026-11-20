import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/permissions';
import {
  HardHat,
  LayoutDashboard,
  Building2,
  TrendingUp,
  Users,
  Coins,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
  Briefcase,
  FileText,
  Bell,
  WifiOff,
  CreditCard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import type { AppStep } from '../../App';

interface AppLayoutProps {
  children: React.ReactNode;
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  target: AppStep;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'dashboard', name: 'Tableau de bord', icon: LayoutDashboard, target: 'step5' },
  { id: 'projects', name: 'Chantiers', icon: Building2, target: 'step6' },
  { id: 'progress', name: 'Suivi avancement', icon: TrendingUp, target: 'step7' },
  { id: 'attendance', name: 'Personnel & Pointage', icon: Users, target: 'step8' },
  { id: 'payroll', name: 'Paie & Salaires', icon: Coins, target: 'step9' },
  { id: 'stock', name: 'Stocks de matériaux', icon: Package, target: 'step10' },
  { id: 'orders', name: 'Bons de commande', icon: ShoppingCart, target: 'step11' },
  { id: 'deliveries', name: 'Bons de livraison', icon: Truck, target: 'step12' },
  { id: 'expenses', name: 'Dépenses & Budgets', icon: Wallet, target: 'step13' },
  { id: 'suppliers', name: 'Fournisseurs', icon: Briefcase, target: 'step14' },
  { id: 'reports', name: 'Rapports & Documents', icon: FileText, target: 'step15' },
  { id: 'notifications', name: 'Notifications', icon: Bell, target: 'step16' },
  { id: 'pwa', name: 'Mode Hors-ligne / PWA', icon: WifiOff, target: 'step17' },
  { id: 'subscriptions', name: 'Abonnements SaaS', icon: CreditCard, target: 'step18' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children, currentStep, setCurrentStep }) => {
  const { user, company, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user || !company) return null;

  const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.WORKER;
  const isAdminUser = user.role === 'DIRECTOR' || user.role === 'SUPER_ADMIN';
  const canAccessTeamView = isAdminUser || user.role === 'SITE_MANAGER';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Ouvrir ou fermer le menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep('step5');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black shadow-md shadow-orange-600/30">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base block leading-tight">
                BATI-PILOT
              </span>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Gestion BTP & Chantiers · XAF
              </p>
            </div>
          </button>
        </div>

        {/* Barre droite : Entreprise active & Menu Utilisateur */}
        <div className="flex items-center gap-2.5">
          {/* Entreprise courante */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <div className="leading-tight">
              <span className="font-semibold text-slate-200 block truncate max-w-[200px]">
                {company.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {company.city} · {company.currency}
              </span>
            </div>
          </div>

          {/* Menu profil utilisateur connecté */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs cursor-pointer transition-colors"
            >
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleMeta.badgeColor}`}>
                {roleMeta.label}
              </span>
              <span className="hidden sm:inline text-slate-300 font-medium">
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 text-xs space-y-0.5">
                  <span className="font-semibold text-white block">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
                  <span className="text-[10px] text-orange-400 font-medium block pt-0.5">
                    {company.name}
                  </span>
                </div>

                {canAccessTeamView && (
                  <div className="py-1.5 space-y-1 border-b border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep('step3');
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-orange-400" />
                      <span>
                        {user.role === 'SUPER_ADMIN'
                          ? 'Multi-Entreprises & Équipes'
                          : user.role === 'SITE_MANAGER'
                          ? 'Équipe & Collaborateurs'
                          : 'Mon Entreprise & Équipe'}
                      </span>
                    </button>
                    {isAdminUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep('step4');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                        <span>Rôles & Permissions</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Déconnexion rapide */}
          <button
            type="button"
            onClick={logout}
            title="Déconnexion"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-red-950/40 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body avec Sidebar et Contenu Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar latérale de production */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between pt-16 lg:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            {/* Menu Principal */}
            <nav className="space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Opérations & Gestion BTP
              </p>

              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentStep === item.target;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentStep(item.target);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-orange-600/20 text-orange-300 font-semibold border border-orange-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-orange-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}

              <div className="pt-1">
                <PWAInstallButton variant="sidebar" label="Installer App" />
              </div>
            </nav>

            {/* Administration (Direction, Chef de chantier pour équipe & Super Admin) */}
            {canAccessTeamView && (
              <div className="pt-3 border-t border-slate-800/80 space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Administration
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('step3');
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentStep === 'step3'
                      ? 'bg-orange-600/20 text-orange-300 font-semibold border border-orange-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 shrink-0 ${
                      currentStep === 'step3' ? 'text-orange-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">
                    {user.role === 'SUPER_ADMIN'
                      ? 'Multi-Entreprises & Équipes'
                      : user.role === 'SITE_MANAGER'
                      ? 'Équipe & Collaborateurs'
                      : 'Mon Entreprise & Équipe'}
                  </span>
                </button>

                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('step4');
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                      currentStep === 'step4'
                        ? 'bg-orange-600/20 text-orange-300 font-semibold border border-orange-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        currentStep === 'step4' ? 'text-orange-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">Rôles & Permissions</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">BATI-PILOT BTP</p>
            <p>Devise : XAF (FCFA)</p>
            <p>Douala · Yaoundé · Afrique Centrale</p>
          </div>
        </aside>

        {/* Zone de contenu principale */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Indicateur flottant Hors-Ligne / File d'attente PWA */}
      <OfflineIndicator
        companyId={company.id}
        userRole={user.role}
        authorName={`${user.firstName} ${user.lastName}`}
        onOpenPwaView={() => setCurrentStep('step17')}
      />
    </div>
  );
};
