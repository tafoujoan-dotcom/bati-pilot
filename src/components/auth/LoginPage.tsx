import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionPlan } from '../../types';
import {
  HardHat,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Wallet,
  ShoppingCart,
  WifiOff,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerCompany, isLoading, error: authError } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire de connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Formulaire d'inscription
  const [regCompany, setRegCompany] = useState('');
  const [regCity, setRegCity] = useState('Douala');
  const [regPhone, setRegPhone] = useState('+237 6');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState<SubscriptionPlan>('PRO');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Veuillez renseigner votre email et mot de passe.');
      return;
    }
    const result = await login(email.trim(), password);
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (
      !regCompany.trim() ||
      !regEmail.trim() ||
      !regPassword ||
      !regFirstName.trim() ||
      !regLastName.trim()
    ) {
      setLocalError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    const result = await registerCompany({
      companyName: regCompany.trim(),
      city: regCity,
      phone: regPhone.trim(),
      email: regEmail.trim(),
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      password: regPassword,
      plan: regPlan,
    });
    if (!result.success && result.error) {
      setLocalError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-600 selection:text-white">
      {/* Bandeau de marque sobre */}
      <header className="border-b border-slate-900 bg-slate-950/90 px-4 sm:px-6 py-3 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
              <HardHat className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-tight text-white text-sm">BATI-PILOT</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>
              Devise : <strong className="text-slate-200">FCFA (XAF)</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Fuseau : <strong className="text-slate-200">Africa/Douala</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Colonne Gauche : Présentation Produit BATI-PILOT */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
                <HardHat className="w-4 h-4" />
                <span>Plateforme SaaS BTP</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                BATI-PILOT
              </h1>
              <p className="text-base text-orange-400/90 font-medium italic">
                « Maîtrisez vos chantiers, contrôlez vos dépenses. »
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Solution de gestion intégrée dédiée aux entreprises de construction, travaux publics et génie civil en Afrique Centrale.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Chantiers & Budgets FCFA</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Avancement physique par lots, photos terrain et suivi Prévu vs Réalisé en temps réel.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Achats, Stocks & Visa Direction</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Bons de commande signés par la DG, réceptions BL et traçabilité du dépôt central.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Wallet className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Pointage Ouvriers & Paie Mobile Money</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Appels journaliers, avances, bulletins PDF et règlements Orange Money / MTN MoMo.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Application Mobile Hors-Ligne (PWA)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Saisie terrain continue en zone blanche avec synchronisation automatique dès le retour du réseau.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Formulaire d'authentification professionnel */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
              {/* Onglets Connexion / Inscription Entreprise */}
              <div className="flex items-center p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLocalError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Connexion Entreprise
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setLocalError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Créer un compte Entreprise
                </button>
              </div>

              {/* Message d'erreur */}
              {(localError || authError) && (
                <div className="mb-5 p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{localError || authError}</span>
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Adresse email professionnelle
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@entreprise-btp.cm"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white font-semibold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/20 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Connexion en cours...</span>
                      ) : (
                        <>
                          <span>Accéder à l'espace BATI-PILOT</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                      Vous n'avez pas encore d'espace entreprise ?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="text-orange-400 hover:underline font-medium cursor-pointer"
                      >
                        Démarrer l'essai gratuit 14 jours
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nom de l'entreprise BTP *
                      </label>
                      <input
                        type="text"
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="Ex: CAM-CONSTRUCT SARL"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Ville principale (Cameroun)
                      </label>
                      <select
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="Douala">Douala (Littoral)</option>
                        <option value="Yaoundé">Yaoundé (Centre)</option>
                        <option value="Bafoussam">Bafoussam (Ouest)</option>
                        <option value="Garoua">Garoua (Nord)</option>
                        <option value="Bamenda">Bamenda (Nord-Ouest)</option>
                        <option value="Kribi">Kribi (Sud)</option>
                        <option value="Limbe">Limbe (Sud-Ouest)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Prénom du Directeur *
                      </label>
                      <input
                        type="text"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder="Ex: Jean-Luc"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nom du Directeur *
                      </label>
                      <input
                        type="text"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder="Ex: Fokou"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Téléphone professionnel *
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+237 699 00 00 00"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Email du compte DG *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="direction@camconstruct.cm"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Créer un mot de passe *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Formule choisie (Essai 14 jours inclus)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'STARTER', label: 'STARTER', note: '2 chantiers' },
                        { id: 'PRO', label: 'PRO', note: '10 chantiers (Reco)' },
                        { id: 'ENTERPRISE', label: 'ENTERPRISE', note: 'Illimité' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setRegPlan(p.id as SubscriptionPlan)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            regPlan === p.id
                              ? 'bg-orange-600/20 border-orange-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <p className="text-xs font-bold">{p.label}</p>
                          <p className="text-[10px] text-slate-400">{p.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-600/20 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Création en cours...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Créer mon entreprise et démarrer l'essai</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer informatif */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© 2026 BATI-PILOT — Plateforme SaaS BTP Afrique Centrale</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Isolation Multi-entreprises stricte</span>
            <span>·</span>
            <span>Contrôle d’accès RBAC</span>
            <span>·</span>
            <span>Devise FCFA (XAF)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
