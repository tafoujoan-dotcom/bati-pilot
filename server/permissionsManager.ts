/**
 * BATI-PILOT — Moteur de Gestion des Rôles & Permissions Fines (Étape 4)
 * Permet la personnalisation des droits par ressource et par rôle pour chaque entreprise BTP.
 */

import { UserRole } from '../src/types';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'approve';

export interface ResourcePermissionItem {
  id: string;
  name: string;
  category: 'Chantiers' | 'RH & Pointage' | 'Stocks & Achats' | 'Finances' | 'Administration';
  description: string;
  availableActions: PermissionAction[];
}

export const PERMISSION_RESOURCES: ResourcePermissionItem[] = [
  {
    id: 'projects',
    name: 'Chantiers de Construction',
    category: 'Chantiers',
    description: 'Création, modification et consultation des fiches chantiers et plannings.',
    availableActions: ['read', 'create', 'update', 'delete'],
  },
  {
    id: 'progress_reports',
    name: 'Avancement & Rapports Journaliers',
    category: 'Chantiers',
    description: 'Saisie quotidienne des travaux réalisés, météo et photos de chantier.',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'workers',
    name: 'Ouvriers & Journaliers',
    category: 'RH & Pointage',
    description: 'Fiches des ouvriers, spécialités et tarifs journaliers en FCFA.',
    availableActions: ['read', 'create', 'update', 'delete'],
  },
  {
    id: 'attendance',
    name: 'Pointage Quotidien',
    category: 'RH & Pointage',
    description: 'Enregistrement des présences, retards, demi-journées et validation.',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'payroll',
    name: 'Paie, Acomptes & Règlements',
    category: 'RH & Pointage',
    description: 'Calcul des salaires journaliers, déduction des acomptes et fiches de paie.',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'stock_materials',
    name: 'Stocks de Matériaux & Dépôts',
    category: 'Stocks & Achats',
    description: 'Consultation des quantités (ciment, fer, sable, parpaings) et alertes.',
    availableActions: ['read', 'create', 'update'],
  },
  {
    id: 'stock_movements',
    name: 'Mouvements de Stock (Entrées/Sorties)',
    category: 'Stocks & Achats',
    description: 'Déclaration des sorties de matériaux avec motif obligatoire et bénéficiaire.',
    availableActions: ['read', 'create'],
  },
  {
    id: 'purchase_orders',
    name: 'Bons de Commande',
    category: 'Stocks & Achats',
    description: 'Émission des besoins matériels et validation financière par le Directeur.',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'deliveries',
    name: 'Bons de Livraison & Réceptions',
    category: 'Stocks & Achats',
    description: 'Réception des matériaux sur site, contrôle des manquants et casses.',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'suppliers',
    name: 'Fournisseurs BTP',
    category: 'Stocks & Achats',
    description: 'Gestion des quincailleries, cimenteries et transporteurs.',
    availableActions: ['read', 'create', 'update', 'delete'],
  },
  {
    id: 'expenses',
    name: 'Dépenses & Factures Chantiers',
    category: 'Finances',
    description: 'Enregistrement des sorties d\'argent (carburant, sable, matériel, nourriture).',
    availableActions: ['read', 'create', 'update', 'approve'],
  },
  {
    id: 'budgets',
    name: 'Budgets Prévisionnels & Plafonds',
    category: 'Finances',
    description: 'Allocation budgétaire par chantier et alertes de dépassement (80%, 90%, 100%).',
    availableActions: ['read', 'create', 'update'],
  },
  {
    id: 'reports',
    name: 'Rapports & Documents PDF/Excel',
    category: 'Administration',
    description: 'Export des rapports journaliers, synthèses financières et rentabilité.',
    availableActions: ['read', 'create'],
  },
  {
    id: 'team_users',
    name: 'Gestion des Utilisateurs & Équipe',
    category: 'Administration',
    description: 'Invitation de collaborateurs, attribution des rôles et suspensions.',
    availableActions: ['read', 'create', 'update', 'delete'],
  },
];

// Matrice standard par rôle par défaut
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<string, PermissionAction[]>> = {
  SUPER_ADMIN: {
    projects: ['read', 'create', 'update', 'delete'],
    progress_reports: ['read', 'create', 'update', 'approve'],
    workers: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'approve'],
    payroll: ['read', 'create', 'update', 'approve'],
    stock_materials: ['read', 'create', 'update'],
    stock_movements: ['read', 'create'],
    purchase_orders: ['read', 'create', 'update', 'approve'],
    deliveries: ['read', 'create', 'update', 'approve'],
    suppliers: ['read', 'create', 'update', 'delete'],
    expenses: ['read', 'create', 'update', 'approve'],
    budgets: ['read', 'create', 'update'],
    reports: ['read', 'create'],
    team_users: ['read', 'create', 'update', 'delete'],
  },
  DIRECTOR: {
    projects: ['read', 'create', 'update', 'delete'],
    progress_reports: ['read', 'create', 'update', 'approve'],
    workers: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'approve'],
    payroll: ['read', 'create', 'update', 'approve'],
    stock_materials: ['read', 'create', 'update'],
    stock_movements: ['read', 'create'],
    purchase_orders: ['read', 'create', 'update', 'approve'], // DG seul habilité à valider
    deliveries: ['read', 'create', 'update', 'approve'],
    suppliers: ['read', 'create', 'update', 'delete'],
    expenses: ['read', 'create', 'update', 'approve'],
    budgets: ['read', 'create', 'update'],
    reports: ['read', 'create'],
    team_users: ['read', 'create', 'update', 'delete'],
  },
  SITE_MANAGER: {
    projects: ['read'], // Ses chantiers seulement
    progress_reports: ['read', 'create', 'update'], // Saisie journalière d'avancement
    workers: ['read'], // Consultation des ouvriers affectés
    attendance: ['read', 'create', 'update'], // Pointage quotidien sur le terrain
    payroll: [], // Pas d'accès aux salaires globaux
    stock_materials: ['read'], // Consultation stocks de chantier
    stock_movements: ['read', 'create'], // Demande de sortie de matériaux
    purchase_orders: ['read', 'create'], // Demande d'approvisionnement (sans pouvoir d'approbation)
    deliveries: ['read', 'create'], // Constat de réception sur site
    suppliers: ['read'],
    expenses: ['read'], // Pas d'autorisation de décaissement
    budgets: [], // Confidentiel
    reports: ['read', 'create'], // Rapports d'avancement de chantier
    team_users: [],
  },
  STOREKEEPER: {
    projects: ['read'],
    progress_reports: [],
    workers: [],
    attendance: [],
    payroll: [],
    stock_materials: ['read', 'create', 'update'], // Gestion active du stock
    stock_movements: ['read', 'create'], // Enregistrement sorties et entrées
    purchase_orders: ['read', 'create'], // Demande de réassort
    deliveries: ['read', 'create', 'update'], // Réception physique et contrôle
    suppliers: ['read', 'create'],
    expenses: [],
    budgets: [],
    reports: ['read', 'create'], // Rapport d'inventaire
    team_users: [],
  },
  ACCOUNTANT: {
    projects: ['read'],
    progress_reports: ['read'],
    workers: ['read', 'create', 'update'], // Données salariales
    attendance: ['read'], // Contrôle pour paie
    payroll: ['read', 'create', 'update', 'approve'], // Gestion de la paie
    stock_materials: ['read'], // Valorisation du stock
    stock_movements: ['read'],
    purchase_orders: ['read'], // Suivi factures
    deliveries: ['read'],
    suppliers: ['read', 'create', 'update'],
    expenses: ['read', 'create', 'update', 'approve'], // Suivi de trésorerie
    budgets: ['read', 'update'], // Suivi consommation budgétaire
    reports: ['read', 'create'], // Bilans financiers
    team_users: [],
  },
  WORKER: {
    projects: ['read'],
    progress_reports: [],
    workers: ['read'], // Seulement sa propre fiche
    attendance: ['read'], // Ses propres jours pointés
    payroll: ['read'], // Ses propres fiches de paie
    stock_materials: [],
    stock_movements: [],
    purchase_orders: [],
    deliveries: [],
    suppliers: [],
    expenses: [],
    budgets: [],
    reports: [],
    team_users: [],
  },
};

class PermissionsManager {
  // Stockage par entreprise des surcharges de permissions
  private companyOverrides: Record<string, Record<UserRole, Record<string, PermissionAction[]>>> = {};

  getCompanyPermissions(companyId: string): Record<UserRole, Record<string, PermissionAction[]>> {
    if (!this.companyOverrides[companyId]) {
      // Cloner la matrice par défaut
      this.companyOverrides[companyId] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }
    return this.companyOverrides[companyId];
  }

  exportOverrides(): Record<string, Record<UserRole, Record<string, PermissionAction[]>>> {
    return this.companyOverrides;
  }

  hydrateOverrides(overrides: Record<string, Record<UserRole, Record<string, PermissionAction[]>>>): void {
    if (overrides && typeof overrides === 'object') {
      this.companyOverrides = overrides;
    }
  }

  getRolePermissions(companyId: string, role: UserRole): Record<string, PermissionAction[]> {
    const compPerms = this.getCompanyPermissions(companyId);
    return compPerms[role] || DEFAULT_ROLE_PERMISSIONS[role];
  }

  hasPermission(companyId: string, role: UserRole, resource: string, action: PermissionAction): boolean {
    const rolePerms = this.getRolePermissions(companyId, role);
    const actions = rolePerms[resource] || [];
    return actions.includes(action);
  }

  togglePermission(
    companyId: string,
    role: UserRole,
    resource: string,
    action: PermissionAction
  ): { success: boolean; isAllowed: boolean; message: string } {
    const compPerms = this.getCompanyPermissions(companyId);
    if (!compPerms[role]) {
      compPerms[role] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]));
    }

    if (!compPerms[role][resource]) {
      compPerms[role][resource] = [];
    }

    const currentActions = compPerms[role][resource];
    const index = currentActions.indexOf(action);
    let isAllowed = false;

    if (index >= 0) {
      // Retirer l'action
      currentActions.splice(index, 1);
      isAllowed = false;
    } else {
      // Ajouter l'action
      currentActions.push(action);
      isAllowed = true;
    }

    return {
      success: true,
      isAllowed,
      message: `Permission '${action}' sur '${resource}' ${isAllowed ? 'accordée' : 'retirée'} pour le rôle ${role}.`,
    };
  }

  resetPermissions(companyId: string): { success: boolean; message: string } {
    this.companyOverrides[companyId] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    return {
      success: true,
      message: 'Les permissions standard BTP ont été rétablies avec succès pour votre entreprise.',
    };
  }

  simulateAction(
    companyId: string,
    role: UserRole,
    actionScenario: string
  ): { isAllowed: boolean; roleName: string; requiredPermission: string; reason: string } {
    const scenarios: Record<string, { resource: string; action: PermissionAction; description: string; reasonDenied: string }> = {
      approve_purchase_order: {
        resource: 'purchase_orders',
        action: 'approve',
        description: 'Valider et signer un bon de commande fournisseur (ex: 2 450 000 FCFA ciment Cimencam)',
        reasonDenied: 'Seul le Directeur Général ou l\'Administrateur a le pouvoir d\'engager financièrement l\'entreprise.',
      },
      record_attendance: {
        resource: 'attendance',
        action: 'create',
        description: 'Enregistrer le pointage quotidien des ouvriers journaliers sur le chantier',
        reasonDenied: 'Ce rôle n\'est pas habilité à pointer le personnel.',
      },
      record_stock_exit: {
        resource: 'stock_movements',
        action: 'create',
        description: 'Déclarer une sortie de 100 sacs de ciment pour coulage de dalle',
        reasonDenied: 'Ce rôle ne peut pas enregistrer de mouvement de stock direct.',
      },
      manage_payroll: {
        resource: 'payroll',
        action: 'approve',
        description: 'Valider les fiches de paie et effectuer le versement des acomptes',
        reasonDenied: 'Opération financière confidentielle réservée à la Direction et au Comptable.',
      },
      create_project: {
        resource: 'projects',
        action: 'create',
        description: 'Créer un nouveau chantier (Nom, Maître d\'ouvrage, Budget FCFA)',
        reasonDenied: 'Seule la Direction Générale peut ouvrir un nouveau chantier dans le système.',
      },
      delete_worker: {
        resource: 'workers',
        action: 'delete',
        description: 'Supprimer définitivement la fiche d\'un ouvrier',
        reasonDenied: 'La suppression de collaborateurs est restreinte pour préserver la traçabilité.',
      },
    };

    const scenario = scenarios[actionScenario];
    if (!scenario) {
      return {
        isAllowed: false,
        roleName: role,
        requiredPermission: 'action_inconnue',
        reason: 'Scénario de test non reconnu.',
      };
    }

    const isAllowed = this.hasPermission(companyId, role, scenario.resource, scenario.action);

    return {
      isAllowed,
      roleName: role,
      requiredPermission: `${scenario.resource}:${scenario.action}`,
      reason: isAllowed
        ? `Autorisé : Le rôle dispose du droit '${scenario.action}' sur la ressource '${scenario.resource}'.`
        : `Refusé : ${scenario.reasonDenied}`,
    };
  }
}

export const permissionsManager = new PermissionsManager();
