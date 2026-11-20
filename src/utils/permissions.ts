import { UserRole, RolePermission } from '../types';

export const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string; description: string }> = {
  SUPER_ADMIN: {
    label: 'Super Administrateur',
    badgeColor: 'bg-purple-950/60 text-purple-300 border-purple-800',
    description: 'Gestion de la plateforme BATI-PILOT, entreprises et abonnements.',
  },
  DIRECTOR: {
    label: "Directeur d'entreprise",
    badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-800',
    description: 'Accès intégral à tous les chantiers, budgets, validations et rapports.',
  },
  SITE_MANAGER: {
    label: 'Chef de chantier',
    badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-800',
    description: "Saisie journalière d'avancement, pointage, besoins matériels et photos.",
  },
  STOREKEEPER: {
    label: 'Magasinier',
    badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    description: 'Gestion des stocks, entrées/sorties, réceptions et inventaires.',
  },
  ACCOUNTANT: {
    label: 'Comptable',
    badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800',
    description: 'Suivi des dépenses, paiements des ouvriers, budgets et factures.',
  },
  WORKER: {
    label: 'Ouvrier / Journalier',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    description: 'Consultation de ses fiches, jours travaillés et acomptes/solde.',
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  SUPER_ADMIN: {
    canViewAllProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canViewBudgets: true,
    canEditBudgets: true,
    canRecordDailyProgress: true,
    canRecordAttendance: true,
    canValidateAttendance: true,
    canManagePayroll: true,
    canManageStock: true,
    canCreatePurchaseOrder: true,
    canApprovePurchaseOrder: true,
    canRecordDelivery: true,
    canRecordExpense: true,
    canViewReports: true,
    canManageUsers: true,
    canManageCompanySubscription: true,
    canManagePlatform: true,
  },
  DIRECTOR: {
    canViewAllProjects: true,
    canCreateProjects: true,
    canEditProjects: true,
    canViewBudgets: true,
    canEditBudgets: true,
    canRecordDailyProgress: true,
    canRecordAttendance: true,
    canValidateAttendance: true,
    canManagePayroll: true,
    canManageStock: true,
    canCreatePurchaseOrder: true,
    canApprovePurchaseOrder: true,
    canRecordDelivery: true,
    canRecordExpense: true,
    canViewReports: true,
    canManageUsers: true,
    canManageCompanySubscription: true,
    canManagePlatform: false,
  },
  SITE_MANAGER: {
    canViewAllProjects: false, // Seulement ses chantiers assignés
    canCreateProjects: false,
    canEditProjects: false,
    canViewBudgets: false,
    canEditBudgets: false,
    canRecordDailyProgress: true,
    canRecordAttendance: true,
    canValidateAttendance: true,
    canManagePayroll: false,
    canManageStock: true, // Demande de sortie / réception sur site
    canCreatePurchaseOrder: true, // Demande d'approvisionnement
    canApprovePurchaseOrder: false, // Réservé au directeur
    canRecordDelivery: true,
    canRecordExpense: false,
    canViewReports: true, // Rapports opérationnels de son chantier
    canManageUsers: false,
    canManageCompanySubscription: false,
    canManagePlatform: false,
  },
  STOREKEEPER: {
    canViewAllProjects: false,
    canCreateProjects: false,
    canEditProjects: false,
    canViewBudgets: false,
    canEditBudgets: false,
    canRecordDailyProgress: false,
    canRecordAttendance: false,
    canValidateAttendance: false,
    canManagePayroll: false,
    canManageStock: true,
    canCreatePurchaseOrder: true,
    canApprovePurchaseOrder: false,
    canRecordDelivery: true,
    canRecordExpense: false,
    canViewReports: true, // Rapports stocks
    canManageUsers: false,
    canManageCompanySubscription: false,
    canManagePlatform: false,
  },
  ACCOUNTANT: {
    canViewAllProjects: true,
    canCreateProjects: false,
    canEditProjects: false,
    canViewBudgets: true,
    canEditBudgets: false,
    canRecordDailyProgress: false,
    canRecordAttendance: false,
    canValidateAttendance: false,
    canManagePayroll: true,
    canManageStock: false,
    canCreatePurchaseOrder: false,
    canApprovePurchaseOrder: false,
    canRecordDelivery: false,
    canRecordExpense: true,
    canViewReports: true, // Rapports financiers
    canManageUsers: false,
    canManageCompanySubscription: false,
    canManagePlatform: false,
  },
  WORKER: {
    canViewAllProjects: false,
    canCreateProjects: false,
    canEditProjects: false,
    canViewBudgets: false,
    canEditBudgets: false,
    canRecordDailyProgress: false,
    canRecordAttendance: false,
    canValidateAttendance: false,
    canManagePayroll: false,
    canManageStock: false,
    canCreatePurchaseOrder: false,
    canApprovePurchaseOrder: false,
    canRecordDelivery: false,
    canRecordExpense: false,
    canViewReports: false,
    canManageUsers: false,
    canManageCompanySubscription: false,
    canManagePlatform: false,
  },
};

/**
 * Formatage des montants en Francs CFA (XAF)
 */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount).replace('XAF', 'FCFA');
}
