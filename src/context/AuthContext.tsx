import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, UserRole, RolePermission, SubscriptionPlan } from '../types';
import { ROLE_PERMISSIONS } from '../utils/permissions';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  permissions: RolePermission | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCompany: (data: {
    companyName: string;
    city: string;
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    plan?: SubscriptionPlan;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshCompany: (updatedCompany: Company) => void;
  hasPermission: (perm: keyof RolePermission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'bati_pilot_auth_session';

// Comptes démo de secours en cas de mode hors ligne
const DEMO_FALLBACK_USERS: Record<UserRole, { user: User; company: Company }> = {
  SUPER_ADMIN: {
    user: {
      id: 'usr_superadmin',
      companyId: 'comp_socabat_01',
      companyName: 'BATI-PILOT Platform',
      role: 'SUPER_ADMIN',
      email: 'superadmin@batipilot.cm',
      firstName: 'Alain',
      lastName: 'Mbassi',
      phone: '+237 699 00 11 22',
      specialty: 'Directeur Plateforme SaaS',
      assignedProjectIds: [],
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
  DIRECTOR: {
    user: {
      id: 'usr_directeur_01',
      companyId: 'comp_socabat_01',
      companyName: 'SOCABAT SARL',
      role: 'DIRECTOR',
      email: 'directeur@socabat.cm',
      firstName: 'Samuel',
      lastName: "Eto'o Mbarga",
      phone: '+237 699 45 12 80',
      specialty: 'Directeur Général & Promoteur BTP',
      assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
      isActive: true,
      createdAt: '2026-01-10T08:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
  SITE_MANAGER: {
    user: {
      id: 'usr_chef_01',
      companyId: 'comp_socabat_01',
      companyName: 'SOCABAT SARL',
      role: 'SITE_MANAGER',
      email: 'chef.chantier@socabat.cm',
      firstName: 'Paul',
      lastName: 'Ndongo',
      phone: '+237 677 88 99 00',
      specialty: 'Conducteur de Travaux / Ingénieur GC',
      assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
      isActive: true,
      createdAt: '2026-01-12T09:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
  STOREKEEPER: {
    user: {
      id: 'usr_magasinier_01',
      companyId: 'comp_socabat_01',
      companyName: 'SOCABAT SARL',
      role: 'STOREKEEPER',
      email: 'magasinier@socabat.cm',
      firstName: 'Christian',
      lastName: 'Talla',
      phone: '+237 655 44 33 22',
      specialty: 'Gestionnaire Dépôt & Magasinier',
      assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
      isActive: true,
      createdAt: '2026-01-15T10:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
  ACCOUNTANT: {
    user: {
      id: 'usr_comptable_01',
      companyId: 'comp_socabat_01',
      companyName: 'SOCABAT SARL',
      role: 'ACCOUNTANT',
      email: 'comptable@socabat.cm',
      firstName: 'Nadine',
      lastName: 'Ngo Bell',
      phone: '+237 691 22 33 44',
      specialty: 'Responsable Financière & Paie',
      assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
      isActive: true,
      createdAt: '2026-01-15T11:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
  WORKER: {
    user: {
      id: 'usr_ouvrier_01',
      companyId: 'comp_socabat_01',
      companyName: 'SOCABAT SARL',
      role: 'WORKER',
      email: 'ouvrier@socabat.cm',
      firstName: 'Joseph',
      lastName: 'Kamga',
      phone: '+237 673 12 34 56',
      specialty: 'Chef Maçon & Coffreur',
      assignedProjectIds: ['proj_akwa_01'],
      isActive: true,
      createdAt: '2026-02-01T07:00:00Z',
    },
    company: {
      id: 'comp_socabat_01',
      name: 'SOCABAT SARL (BTP Cameroun)',
      slug: 'socabat',
      address: 'Boulevard de la Liberté, Bonanjo',
      city: 'Douala',
      country: 'Cameroun',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 699 45 12 80',
      email: 'contact@socabat.cm',
      plan: 'PRO',
      maxProjects: 10,
      maxUsers: 20,
      status: 'ACTIVE',
      createdAt: '2026-01-10T08:00:00Z',
    },
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger et vérifier la session JWT stockée au démarrage
  useEffect(() => {
    let active = true;

    const initSession = async () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user && parsed.company && parsed.token) {
            const isLegacyDemoToken =
              typeof parsed.token === 'string' &&
              (parsed.token.startsWith('btp_tk_') || parsed.token.startsWith('tk_demo_'));

            if (isLegacyDemoToken) {
              // Tenter d'échanger silencieusement un ancien jeton démo contre un JWT valide
              const switchRes = await fetch('/api/auth/demo-switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: parsed.user.role }),
              }).catch(() => null);

              if (switchRes && switchRes.ok) {
                const refreshed = await switchRes.json();
                if (active && refreshed.user && refreshed.company && refreshed.token) {
                  setUser(refreshed.user);
                  setCompany(refreshed.company);
                  setToken(refreshed.token);
                  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(refreshed));
                  return;
                }
              }
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              return;
            }

            if (active) {
              setUser(parsed.user);
              setCompany(parsed.company);
              setToken(parsed.token);
            }

            // Vérifier côté serveur si la session JWT est toujours active
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${parsed.token}` },
            }).catch(() => null);

            if (meRes && meRes.ok) {
              const meData = await meRes.json();
              if (active && meData.user && meData.company) {
                setUser(meData.user);
                setCompany(meData.company);
                localStorage.setItem(
                  LOCAL_STORAGE_KEY,
                  JSON.stringify({ user: meData.user, company: meData.company, token: parsed.token })
                );
              }
            } else if (meRes && meRes.status === 401 && active) {
              setUser(null);
              setCompany(null);
              setToken(null);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }
      } catch (e) {
        console.warn('Erreur de lecture de session stockée:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initSession();

    const handleExpired = () => {
      setUser(null);
      setCompany(null);
      setToken(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        // ignore
      }
    };
    window.addEventListener('bati-pilot-auth-expired', handleExpired);

    return () => {
      active = false;
      window.removeEventListener('bati-pilot-auth-expired', handleExpired);
    };
  }, []);

  const saveSession = (u: User, c: Company, t: string) => {
    setUser(u);
    setCompany(c);
    setToken(t);
    setError(null);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ user: u, company: c, token: t }));
    } catch (e) {
      console.warn('Impossible de persister la session:', e);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        saveSession(data.user, data.company, data.token);
        setIsLoading(false);
        return { success: true };
      }

      // Si le serveur renvoie une erreur explicite
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || 'Erreur lors de la connexion. Vérifiez vos identifiants.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    } catch (networkError) {
      // Fallback local en cas d'absence temporaire du serveur backend
      const foundDemo = Object.values(DEMO_FALLBACK_USERS).find(
        (item) => item.user.email.toLowerCase() === email.toLowerCase()
      );

      if (foundDemo && password === 'bati2026') {
        saveSession(foundDemo.user, foundDemo.company, `tk_local_${foundDemo.user.id}`);
        setIsLoading(false);
        return { success: true };
      }

      const errMsg = 'Identifiants invalides ou service indisponible.';
      setError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  const registerCompany = async (data: {
    companyName: string;
    city: string;
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    plan?: SubscriptionPlan;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const resData = await res.json();
        saveSession(resData.user, resData.company, resData.token);
        setIsLoading(false);
        return { success: true };
      }

      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || "Impossible d'enregistrer l'entreprise.";
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    } catch {
      // Fallback local pour inscription
      const newCompany: Company = {
        id: `comp_${Date.now()}`,
        name: data.companyName,
        slug: data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        address: `Siège, ${data.city}`,
        city: data.city,
        country: 'Cameroun',
        currency: 'XAF',
        timezone: 'Africa/Douala',
        phone: data.phone,
        email: data.email,
        plan: data.plan || 'PRO',
        maxProjects: 10,
        maxUsers: 20,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const newUser: User = {
        id: `usr_${Date.now()}`,
        companyId: newCompany.id,
        companyName: newCompany.name,
        role: 'DIRECTOR',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        specialty: 'Directeur Général',
        assignedProjectIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      saveSession(newUser, newCompany, `tk_local_${newUser.id}`);
      setIsLoading(false);
      return { success: true };
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    try {
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        saveSession(data.user, data.company, data.token);
        return;
      }
    } catch {
      // Fallback hors-ligne uniquement
    }
    const demo = DEMO_FALLBACK_USERS[role];
    if (demo) {
      saveSession(demo.user, demo.company, `tk_demo_${role}_${Date.now()}`);
    }
  };

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null);
    setCompany(null);
    setToken(null);
    setError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn('Erreur effacement session:', e);
    }
  };

  const refreshCompany = (updatedCompany: Company) => {
    setCompany(updatedCompany);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ ...parsed, company: updatedCompany })
        );
      }
    } catch {
      // ignore storage errors
    }
  };

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const hasPermission = (perm: keyof RolePermission): boolean => {
    if (!permissions) return false;
    return !!permissions[perm];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        isLoading,
        error,
        permissions,
        login,
        registerCompany,
        logout,
        switchDemoRole,
        refreshCompany,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
};
