import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, SubscriptionPlan, Company, User } from '../../types';
import { ROLE_LABELS, formatFCFA } from '../../utils/permissions';
import {
  Building2,
  Users,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Lock,
  UserPlus,
  ExternalLink,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  ArrowRight,
  UserCheck,
  UserX,
  Copy,
  Check,
  Eye,
  EyeOff,
  Share2,
  Trash2,
} from 'lucide-react';

function generateTemporaryPassword(length = 10): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => charset[b % charset.length]).join('');
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

export const TenantManagementView: React.FC = () => {
  const { user, company, token, switchDemoRole } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDirectorOrSuper = user?.role === 'DIRECTOR' || isSuperAdmin;
  const canDeleteCollaborator =
    user?.role === 'DIRECTOR' || user?.role === 'SITE_MANAGER' || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<'tenants' | 'team' | 'company-settings' | 'my-profile'>(
    isSuperAdmin ? 'tenants' : 'team'
  );
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Formulaire nouveau collaborateur
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+237 6');
  const [newRole, setNewRole] = useState<UserRole>('SITE_MANAGER');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newUserPassword, setNewUserPassword] = useState(() => generateTemporaryPassword(10));
  const [showInvitePassword, setShowInvitePassword] = useState(true);
  const [inviteModalError, setInviteModalError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    companyName: string;
    temporaryPassword: string;
    loginUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<'all' | 'password' | 'email' | null>(null);
  const [showSummaryPassword, setShowSummaryPassword] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Formulaire paramètres entreprise
  const [companyName, setCompanyName] = useState(company?.name || '');
  const [companyLegal, setCompanyLegal] = useState(company?.legalNumber || '');
  const [companyAddress, setCompanyAddress] = useState(company?.address || '');
  const [companyCity, setCompanyCity] = useState(company?.city || 'Douala');
  const [companyPhone, setCompanyPhone] = useState(company?.phone || '');
  const [companyEmail, setCompanyEmail] = useState(company?.email || '');

  // Formulaire mot de passe
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Charger les données strictement selon le périmètre du rôle
  const loadData = async () => {
    setIsLoading(true);
    try {
      const teamPromise = fetch(`/api/company/users?companyId=${encodeURIComponent(company?.id || 'comp_socabat_01')}`);

      if (isSuperAdmin) {
        const [resTenants, resTeam] = await Promise.all([
          fetch(`/api/tenants?userRole=${encodeURIComponent(user?.role || '')}`),
          teamPromise,
        ]);
        if (resTenants.ok) {
          const data = await resTenants.json();
          setTenantsList(data.tenants || []);
        }
        if (resTeam.ok) {
          const data = await resTeam.json();
          setTeamMembers(data.users || []);
        }
      } else {
        setTenantsList([]);
        const resTeam = await teamPromise;
        if (resTeam.ok) {
          const data = await resTeam.json();
          setTeamMembers(data.users || []);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données entreprise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'tenants') {
      setActiveTab('team');
    }
    if (company) {
      setCompanyName(company.name || '');
      setCompanyLegal(company.legalNumber || '');
      setCompanyAddress(company.address || '');
      setCompanyCity(company.city || 'Douala');
      setCompanyPhone(company.phone || '');
      setCompanyEmail(company.email || '');
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, user?.role]);

  // Changer statut entreprise (Activer / Suspendre - Super Admin uniquement)
  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    if (!isSuperAdmin) return;
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, userRole: user?.role }),
      });
      if (res.ok) {
        setActionSuccess(`Statut de l'entreprise mis à jour avec succès : ${nextStatus}`);
        setTimeout(() => setActionSuccess(null), 4000);
        await loadData();
      }
    } catch {
      setActionError('Erreur mise à jour statut.');
    }
  };

  // Changer formule abonnement (STARTER / PRO / ENTERPRISE - Super Admin uniquement)
  const handleChangePlan = async (tenantId: string, newPlan: SubscriptionPlan) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan, userRole: user?.role }),
      });
      if (res.ok) {
        setActionSuccess(`Formule d'abonnement modifiée en ${newPlan} ! Quotas mis à jour.`);
        setTimeout(() => setActionSuccess(null), 4000);
        await loadData();
      }
    } catch {
      setActionError('Erreur modification de formule.');
    }
  };

  // Basculer sur une entreprise cliente (Super Admin uniquement)
  const handleSwitchTenant = async (tenantId: string) => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch(`/api/tenants/switch/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: user?.role }),
      });
      if (res.ok) {
        const data = await res.json();
        setActionSuccess(`Basculement réussi vers : ${data.company.name}`);
        setTimeout(() => setActionSuccess(null), 4000);
        if (data.suggestedUser) {
          switchDemoRole('DIRECTOR');
        }
      }
    } catch {
      setActionError('Erreur lors du basculement d’entreprise.');
    }
  };

  // Activer/Désactiver un collaborateur
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/company/users/${userId}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Statut du collaborateur actualisé.');
        setTimeout(() => setActionSuccess(null), 4000);
        await loadData();
      } else {
        setActionError(data.error || 'Action refusée.');
      }
    } catch {
      setActionError('Erreur lors de la modification du statut utilisateur.');
    }
  };

  // Supprimer définitivement un collaborateur (Directeur & Chef de chantier uniquement)
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setActionError(null);
    try {
      const headers: Record<string, string> = {
        'x-user-role': user?.role || '',
        'x-company-id': company?.id || '',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/company/users/${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message || 'Collaborateur supprimé.');
        setTimeout(() => setActionSuccess(null), 4000);
        setUserToDelete(null);
        await loadData();
      } else {
        setActionError(data.error || 'Impossible de supprimer ce collaborateur.');
        setUserToDelete(null);
      }
    } catch {
      setActionError('Erreur réseau lors de la suppression.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Ouvrir la fenêtre d'invitation avec un mot de passe temporaire fraîchement généré
  const openInviteModal = () => {
    setInviteModalError(null);
    setNewUserPassword(generateTemporaryPassword(10));
    setShowInvitePassword(true);
    setShowInviteModal(true);
  };

  // Copier un texte dans le presse-papiers avec retour visuel
  const handleCopyInviteText = async (text: string, field: 'all' | 'password' | 'email') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 2500);
    } catch {
      setActionError('Copie automatique bloquée par le navigateur. Vous pouvez sélectionner le texte manuellement.');
    }
  };

  // Inviter un nouveau collaborateur
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteModalError(null);
    const trimmedPassword = newUserPassword.trim();

    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) {
      setInviteModalError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (trimmedPassword.length < 6) {
      setInviteModalError('Le mot de passe temporaire doit comporter au moins 6 caractères.');
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch('/api/company/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          role: newRole,
          specialty: newSpecialty.trim(),
          password: trimmedPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        let loginUrl = typeof window !== 'undefined' ? window.location.origin : '';
        if (loginUrl.includes('://ais-dev-')) {
          loginUrl = loginUrl.replace('://ais-dev-', '://ais-pre-');
        }
        setCreatedInvite({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          role: newRole,
          companyName: data.companyName || company?.name || 'Votre entreprise',
          temporaryPassword: data.temporaryPassword || trimmedPassword,
          loginUrl,
        });
        setShowSummaryPassword(true);
        setCopiedField(null);
        setActionSuccess(`Collaborateur ${newFirstName.trim()} ${newLastName.trim()} (${ROLE_LABELS[newRole].label}) ajouté avec succès !`);
        setTimeout(() => setActionSuccess(null), 5000);
        setShowInviteModal(false);
        setNewFirstName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('+237 6');
        setNewSpecialty('');
        await loadData();
      } else {
        setInviteModalError(data.error || 'Erreur lors de l’invitation.');
      }
    } catch {
      setInviteModalError('Impossible d’ajouter le collaborateur.');
    } finally {
      setIsInviting(false);
    }
  };

  // Sauvegarder les paramètres de l'entreprise
  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: company?.id || 'comp_socabat_01',
          name: companyName,
          legalNumber: companyLegal,
          address: companyAddress,
          city: companyCity,
          phone: companyPhone,
          email: companyEmail,
        }),
      });

      if (res.ok) {
        setActionSuccess('Coordonnées et paramètres entreprise enregistrés avec succès !');
        setTimeout(() => setActionSuccess(null), 4000);
        await loadData();
      }
    } catch {
      setActionError('Erreur lors de la mise à jour des paramètres.');
    }
  };

  // Changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setActionError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setActionError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setActionSuccess('Votre mot de passe a été modifié avec succès.');
        setTimeout(() => setActionSuccess(null), 4000);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setActionError(data.error || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      setActionError('Erreur réseau.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Étape 3 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
              <Shield className="w-4 h-4" />
              <span>
                {isSuperAdmin
                  ? 'Console Super Admin Multi-Entreprises'
                  : 'Administration Entreprise & Équipe'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isSuperAdmin
                ? 'Supervision Multi-Entreprises & Collaborateurs'
                : `Mon Entreprise & Équipe — ${company?.name || ''}`}
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isSuperAdmin
                ? 'Supervision des entités clientes, gestion des formules tarifaires (STARTER, PRO, ENTERPRISE), gestion des collaborateurs et contrôle de sécurité d’accès.'
                : 'Gestion des comptes de vos collaborateurs, paramètres juridiques, fiscaux (RC / NIU) et sécurité de votre compte.'}
            </p>
          </div>

          {isDirectorOrSuper && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={openInviteModal}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Inviter un collaborateur</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications d'action */}
        {actionSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Onglets de navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm overflow-x-auto">
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Entreprises Clientes ({tenantsList.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'team'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Équipe & Rôles ({teamMembers.length})</span>
        </button>

        {isDirectorOrSuper && (
          <button
            onClick={() => setActiveTab('company-settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'company-settings'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Paramètres Entreprise & Fiscaux</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('my-profile')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'my-profile'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Mon Profil & Sécurité</span>
        </button>
      </div>

      {/* ONGLET 1 : ENTREPRISES CLIENTES (MULTI-TENANTS - SUPER ADMIN UNIQUEMENT) */}
      {isSuperAdmin && activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Liste des entreprises hébergées sur BATI-PILOT avec quotas et statuts d'isolation :</span>
            <span className="text-orange-400">Total : {tenantsList.length} entreprises actives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenantsList.map((tenant) => {
              const isCurrent = tenant.id === company?.id;
              return (
                <div
                  key={tenant.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-900/90 border-orange-500/50 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{tenant.name}</h3>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold">
                            Votre Entreprise
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{tenant.legalNumber || 'N° RC en cours'}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : tenant.status === 'TRIAL'
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800'
                          : 'bg-red-950/60 text-red-400 border-red-800'
                      }`}
                    >
                      {tenant.status === 'ACTIVE' ? 'ACTIF' : tenant.status === 'TRIAL' ? 'ESSAI 14J' : 'SUSPENDU'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-800/80 my-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Ville & Siège</span>
                      <span className="text-slate-200 font-medium">{tenant.city}, {tenant.country}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Formule SaaS</span>
                      <span className="text-orange-400 font-bold">{tenant.plan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Chantiers autorisés</span>
                      <span className="text-slate-200 font-medium">
                        {tenant.projectsCount || 0} / {tenant.maxProjects} max
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Utilisateurs actifs</span>
                      <span className="text-slate-200 font-medium">
                        {tenant.usersCount || 0} / {tenant.maxUsers} max
                      </span>
                    </div>
                  </div>

                  {/* Actions par entreprise */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Formule :</span>
                      {(['STARTER', 'PRO', 'ENTERPRISE'] as SubscriptionPlan[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleChangePlan(tenant.id, p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            tenant.plan === p
                              ? 'bg-orange-600 text-white border-orange-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTenantStatus(tenant.id, tenant.status)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                          tenant.status === 'SUSPENDED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-red-950/80 text-red-400 border border-red-800 hover:bg-red-900'
                        }`}
                      >
                        {tenant.status === 'SUSPENDED' ? 'Réactiver' : 'Suspendre'}
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchTenant(tenant.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          <span>Basculer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ONGLET 2 : ÉQUIPE & RÔLES */}
      {activeTab === 'team' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <span>Collaborateurs de l'Entreprise ({teamMembers.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Gestion des comptes, attribution des rôles BTP et contrôle d'accès pour {company?.name}.
              </p>
            </div>

            {isDirectorOrSuper && (
              <button
                onClick={openInviteModal}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nouveau Collaborateur</span>
              </button>
            )}
          </div>

          <div className="border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nom & Prénom</th>
                  <th className="py-2.5 px-3">Rôle BTP</th>
                  <th className="py-2.5 px-3">Email & Téléphone</th>
                  <th className="py-2.5 px-3">Spécialité</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teamMembers.map((member) => {
                  const roleMeta = ROLE_LABELS[member.role] || { label: member.role, badgeColor: 'bg-slate-800 text-slate-300' };
                  return (
                    <tr key={member.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <strong className="text-white block">{member.firstName} {member.lastName}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{member.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleMeta.badgeColor}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{member.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{member.specialty || 'Général'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            member.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {member.isActive ? 'ACTIF' : 'SUSPENDU'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isDirectorOrSuper && member.id !== user?.id && (
                            <button
                              onClick={() => handleToggleUserStatus(member.id)}
                              className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                                member.isActive
                                  ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/60'
                                  : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                              }`}
                            >
                              {member.isActive ? 'Suspendre' : 'Réactiver'}
                            </button>
                          )}

                          {canDeleteCollaborator &&
                            member.id !== user?.id &&
                            member.role !== 'SUPER_ADMIN' &&
                            !(user?.role === 'SITE_MANAGER' && member.role === 'DIRECTOR') && (
                              <button
                                onClick={() => setUserToDelete(member)}
                                className="px-2 py-1 rounded text-[11px] cursor-pointer transition-colors bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/70 inline-flex items-center gap-1"
                                title="Supprimer définitivement ce collaborateur"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Supprimer</span>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET 3 : PARAMÈTRES ENTREPRISE */}
      {activeTab === 'company-settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              <span>Paramètres Juridiques, Fiscaux & Régionaux</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configuration de l'entreprise pour l'émission des bons de commande, fiches de paie et factures.
            </p>
          </div>

          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Raison Sociale de l'entreprise *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registre de Commerce (RC) & NIU Fiscal *
                </label>
                <input
                  type="text"
                  value={companyLegal}
                  onChange={(e) => setCompanyLegal(e.target.value)}
                  placeholder="Ex: RC/DLA/2018/B/421 - NIU: M051812739482X"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ville d'implantation principale (Cameroun)
                </label>
                <select
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Douala">Douala (Littoral)</option>
                  <option value="Yaoundé">Yaoundé (Centre)</option>
                  <option value="Bafoussam">Bafoussam (Ouest)</option>
                  <option value="Garoua">Garoua (Nord)</option>
                  <option value="Kribi">Kribi (Sud - Port en eau profonde)</option>
                  <option value="Limbe">Limbe (Sud-Ouest)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Adresse physique du siège
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Téléphone du standard / Siège
                </label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email officiel de contact
                </label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ONGLET 4 : MON PROFIL & SÉCURITÉ */}
      {activeTab === 'my-profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fiche Profil */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-400" />
              <span>Vos Informations Personnelles</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Nom complet</span>
                <span className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Rôle attribué</span>
                <span className="text-orange-400 font-semibold">{user ? ROLE_LABELS[user.role].label : ''}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Email de connexion</span>
                <span className="text-slate-200 font-mono">{user?.email}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Téléphone</span>
                <span className="text-slate-200">{user?.phone || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          {/* Formulaire Changement de Mot de Passe */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-400" />
              <span>Changement de Mot de Passe</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mot de passe actuel *
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nouveau mot de passe * (min 6 car.)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirmer le nouveau mot de passe *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : INVITER UN COLLABORATEUR */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-400" />
                <span>Ajouter un Collaborateur</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inviteModalError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inviteModalError}</span>
              </div>
            )}

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                    placeholder="Ex: Alain"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    required
                    placeholder="Ex: Meka"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email professionnel *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="nom@entreprise.cm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Téléphone mobile (Cameroun)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+237 699 00 00 00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rôle BTP attribué *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="SITE_MANAGER">Chef de chantier (Pointage, avancement, photos)</option>
                  <option value="STOREKEEPER">Magasinier (Gestion des stocks & réceptions)</option>
                  <option value="ACCOUNTANT">Comptable (Suivi dépenses, paie & budgets)</option>
                  <option value="WORKER">Ouvrier (Consultation de ses pointages)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Spécialité / Fonction</label>
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Ex: Conducteur de travaux Génie Civil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Mot de passe temporaire * (min. 6 car.)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewUserPassword(generateTemporaryPassword(10))}
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Régénérer</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showInvitePassword ? 'text' : 'password'}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Saisir ou générer un mot de passe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword((prev) => !prev)}
                    title={showInvitePassword ? 'Masquer' : 'Afficher'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showInvitePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Le collaborateur pourra se connecter directement à votre entreprise avec ce mot de passe (et le changer quand il le souhaite depuis son profil).
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  {isInviting ? 'Création...' : "Confirmer l'ajout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : RÉCAPITULATIF & PARTAGE D'ACCÈS COLLABORATEUR */}
      {createdInvite && (() => {
        const roleLabel = ROLE_LABELS[createdInvite.role]?.label || createdInvite.role;
        const inviteMessage = [
          `Bonjour ${createdInvite.firstName},`,
          ``,
          `Votre accès à l'espace ${createdInvite.companyName} sur BATI-PILOT est actif :`,
          `• Lien de connexion : ${createdInvite.loginUrl}`,
          `• Email : ${createdInvite.email}`,
          `• Mot de passe : ${createdInvite.temporaryPassword}`,
          `• Rôle : ${roleLabel}`,
          ``,
          `Vous pourrez modifier votre mot de passe à tout moment dans « Administration → Mon Profil & Sécurité ».`,
        ].join('\n');
        const cleanedPhone = createdInvite.phone.replace(/[^0-9]/g, '');
        const whatsappUrl = cleanedPhone.length >= 8
          ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(inviteMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg bg-slate-900 border border-emerald-700/60 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Accès Collaborateur Créé</h3>
                    <p className="text-[11px] text-slate-400">
                      Rattaché à <span className="text-orange-400 font-semibold">{createdInvite.companyName}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedInvite(null)}
                  className="text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Collaborateur & Rôle</span>
                    <span className="text-sm font-bold text-white">
                      {createdInvite.firstName} {createdInvite.lastName}
                    </span>
                    <span className="text-slate-400 ml-2">• {roleLabel}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Lien de connexion (modifiable)
                  </label>
                  <input
                    type="url"
                    value={createdInvite.loginUrl}
                    onChange={(e) =>
                      setCreatedInvite((prev) => (prev ? { ...prev, loginUrl: e.target.value } : null))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                  {createdInvite.loginUrl.includes('ais-pre-') && (
                    <p className="text-[10px] text-amber-400/90 leading-snug">
                      Mode prévisualisation : vérifiez que le partage d’application est activé, ou remplacez par l’adresse de votre serveur en production (ex : votre domaine).
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Email de connexion</span>
                    <span className="text-slate-100 font-mono truncate block">{createdInvite.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyInviteText(createdInvite.email, 'email')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'email' ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Mot de passe attribué</span>
                    <span className="text-orange-300 font-mono font-bold tracking-wide">
                      {showSummaryPassword ? createdInvite.temporaryPassword : '••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSummaryPassword((prev) => !prev)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title={showSummaryPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showSummaryPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteText(createdInvite.temporaryPassword, 'password')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'password' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'password' ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Message prêt à transmettre au collaborateur :
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {inviteMessage}
                </pre>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager via WhatsApp</span>
                </a>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyInviteText(inviteMessage, 'all')}
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'all' ? 'Invitation copiée !' : "Copier l'invitation"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedInvite(null)}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL : CONFIRMATION SUPPRESSION COLLABORATEUR */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-red-800/70 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer ce collaborateur ?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Vous êtes sur le point de supprimer définitivement{' '}
                  <strong className="text-white">
                    {userToDelete.firstName} {userToDelete.lastName}
                  </strong>{' '}
                  ({userToDelete.email}) de votre entreprise. Il ne pourra plus se connecter à la plateforme.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingUser ? 'Suppression...' : 'Confirmer la suppression'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
