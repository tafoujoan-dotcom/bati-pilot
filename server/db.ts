/**
 * BATI-PILOT — Magasin de données backend (in-memory avec persistence multi-entreprises)
 * Pré-configuré avec des données réalistes BTP Cameroun (Douala / Yaoundé)
 */

import {
  Company,
  User,
  Project,
  ProjectDailyLog,
  ProjectTask,
  ProjectPhoto,
  Worker,
  AttendanceRecord,
  AttendanceStatus,
  PayrollAdvance,
  PayrollRecord,
  PaymentMethod,
  MaterialCategory,
  MaterialItem,
  StockMovement,
  StockMovementType,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  DeliveryNote,
  DeliveryNoteItem,
  DeliveryStatus,
  DeliveryDestination,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseRecord,
  ProjectBudgetLine,
  UserRole,
  NotificationSeverity,
  NotificationChannel,
  NotificationCategory,
  BtpNotification,
  NotificationPreferences,
  OfflineQueueItem,
  OfflineSyncReceipt,
  SubscriptionPlan,
  BillingCycle,
  SaaSPlanCatalog,
  SaaSInvoice,
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentGatewayProvider,
  Supplier,
  SupplierCategory,
  SupplierPaymentTerms,
  SupplierStatus,
  SupplierPerformanceMetrics,
  SupplierWithPerformance,
  VaultDocumentCategory,
  VaultDocumentRecord,
  SystemGeneratedDocument,
} from '../src/types';
import { getPaymentGatewayStatus } from './paymentGateway.ts';
import { hashPassword, verifyPassword, isBcryptHash } from './security.ts';

export interface DatabaseState {
  companies: Company[];
  users: (User & { passwordHash: string })[];
  projects: Project[];
  dailyLogs: ProjectDailyLog[];
  tasks: ProjectTask[];
  photos: ProjectPhoto[];
  workers: Worker[];
  attendanceRecords: AttendanceRecord[];
  payrollAdvances: PayrollAdvance[];
  payrollRecords: PayrollRecord[];
  materials: MaterialItem[];
  stockMovements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  deliveryNotes: DeliveryNote[];
  expenses: ExpenseRecord[];
  budgetLines: ProjectBudgetLine[];
  notifications: BtpNotification[];
  notificationPreferences: NotificationPreferences[];
  saasInvoices: SaaSInvoice[];
  paymentTransactions: PaymentTransaction[];
  suppliers: Supplier[];
  vaultDocuments: VaultDocumentRecord[];
}

export const initialCompanies: Company[] = [
  {
    id: 'comp_socabat_01',
    name: 'SOCABAT SARL (Bâtiment & Travaux Publics)',
    slug: 'socabat',
    legalNumber: 'RC/DLA/2018/B/421 - NIU: M051812739482X',
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
  {
    id: 'comp_sahel_02',
    name: 'SAHEL INFRASTRUCTURES & GÉNIE CIVIL',
    slug: 'sahel-infra',
    legalNumber: 'RC/YAO/2020/B/890 - NIU: M032014859601Y',
    address: 'Avenue Rosa Parks, Bastos',
    city: 'Yaoundé',
    country: 'Cameroun',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    phone: '+237 677 30 19 44',
    email: 'direction@sahel-infra.cm',
    plan: 'STARTER',
    maxProjects: 2,
    maxUsers: 5,
    status: 'TRIAL',
    trialEndsAt: '2026-11-20T23:59:59Z',
    createdAt: '2026-10-15T10:00:00Z',
  },
];

export const initialProjects: Project[] = [
  {
    id: 'proj_akwa_01',
    companyId: 'comp_socabat_01',
    code: 'CH-2026-DLA-01',
    name: 'Immeuble R+5 Commercial & Bureaux Akwa',
    clientName: 'SCI Le Phénix Douala',
    clientPhone: '+237 699 80 12 34',
    location: 'Rue Pau, Quartier Akwa',
    city: 'Douala',
    lat: 4.0511,
    lng: 9.7085,
    description: 'Construction gros œuvre, maçonnerie, électricité et second œuvre complet.',
    startDate: '2026-02-01',
    expectedEndDate: '2026-12-15',
    budgetTotal: 185000000, // 185 millions FCFA
    budgetSpent: 74200000,  // 74.2 millions FCFA
    managerId: 'usr_chef_01',
    managerName: 'Ing. Paul Ndongo',
    status: 'IN_PROGRESS',
    progressPercentage: 42,
    workersCount: 28,
    createdAt: '2026-01-20T09:00:00Z',
  },
  {
    id: 'proj_laquintinie_02',
    companyId: 'comp_socabat_01',
    code: 'CH-2026-DLA-02',
    name: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    clientName: 'Délégation Régionale de la Santé Littoral',
    clientPhone: '+237 670 11 22 33',
    location: 'Hôpital Laquintinie, Akwa Nord',
    city: 'Douala',
    lat: 4.0583,
    lng: 9.7042,
    description: 'Renforcement structurel, plomberie sanitaire médicale et carrelage.',
    startDate: '2026-03-10',
    expectedEndDate: '2026-08-30',
    budgetTotal: 65000000, // 65 millions FCFA
    budgetSpent: 38400000,
    managerId: 'usr_chef_01',
    managerName: 'Ing. Paul Ndongo',
    status: 'IN_PROGRESS',
    progressPercentage: 68,
    workersCount: 16,
    createdAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'proj_bastos_03',
    companyId: 'comp_sahel_02',
    code: 'CH-2026-YDE-01',
    name: 'Voie Pavée Résidentielle et Caniveaux Bastos',
    clientName: 'Syndicat des Copropriétaires Bastos',
    clientPhone: '+237 691 55 44 22',
    location: 'Descente Ambassade, Bastos',
    city: 'Yaoundé',
    lat: 3.8922,
    lng: 11.5133,
    description: 'Terrassement, pose de bordures T2 et pavés autobloquants 8cm.',
    startDate: '2026-05-01',
    expectedEndDate: '2026-10-31',
    budgetTotal: 42000000,
    budgetSpent: 12500000,
    managerId: 'usr_chef_sahel',
    managerName: 'Ing. Moussa Bello',
    status: 'IN_PROGRESS',
    progressPercentage: 30,
    workersCount: 12,
    createdAt: '2026-04-20T14:00:00Z',
  },
];

export const initialUsers: (User & { passwordHash: string })[] = [
  {
    id: 'usr_superadmin',
    companyId: 'comp_socabat_01',
    companyName: 'BATI-PILOT Platform',
    role: 'SUPER_ADMIN',
    email: 'superadmin@batipilot.cm',
    passwordHash: 'bati2026',
    firstName: 'Alain',
    lastName: 'Mbassi',
    phone: '+237 699 00 11 22',
    specialty: 'Directeur Plateforme SaaS',
    assignedProjectIds: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr_directeur_01',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL',
    role: 'DIRECTOR',
    email: 'directeur@socabat.cm',
    passwordHash: 'bati2026',
    firstName: 'Samuel',
    lastName: "Eto'o Mbarga",
    phone: '+237 699 45 12 80',
    specialty: 'Directeur Général & Promoteur BTP',
    assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr_chef_01',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL',
    role: 'SITE_MANAGER',
    email: 'chef.chantier@socabat.cm',
    passwordHash: 'bati2026',
    firstName: 'Paul',
    lastName: 'Ndongo',
    phone: '+237 677 88 99 00',
    specialty: 'Conducteur de Travaux / Génie Civil',
    assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
    isActive: true,
    createdAt: '2026-01-12T09:00:00Z',
  },
  {
    id: 'usr_magasinier_01',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL',
    role: 'STOREKEEPER',
    email: 'magasinier@socabat.cm',
    passwordHash: 'bati2026',
    firstName: 'Christian',
    lastName: 'Talla',
    phone: '+237 655 44 33 22',
    specialty: 'Gestionnaire Dépôt & Stocks BTP',
    assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'usr_comptable_01',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL',
    role: 'ACCOUNTANT',
    email: 'comptable@socabat.cm',
    passwordHash: 'bati2026',
    firstName: 'Nadine',
    lastName: 'Ngo Bell',
    phone: '+237 691 22 33 44',
    specialty: 'Responsable Financière & Paie',
    assignedProjectIds: ['proj_akwa_01', 'proj_laquintinie_02'],
    isActive: true,
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'usr_ouvrier_01',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL',
    role: 'WORKER',
    email: 'ouvrier@socabat.cm',
    passwordHash: 'bati2026',
    firstName: 'Joseph',
    lastName: 'Kamga',
    phone: '+237 673 12 34 56',
    specialty: 'Chef Maçon & Coffreur',
    assignedProjectIds: ['proj_akwa_01'],
    isActive: true,
    createdAt: '2026-02-01T07:00:00Z',
  },
];

export const initialDailyLogs: ProjectDailyLog[] = [
  {
    id: 'log_01',
    projectId: 'proj_akwa_01',
    date: '2026-11-04',
    authorName: 'Ing. Paul Ndongo (Conducteur)',
    weather: 'SUNNY',
    workersPresent: 28,
    workDone: 'Coulage complet de la dalle pleine niveau 2 (18m³ béton B25). Ferraillage des amorces poteaux R+3.',
    materialsUsed: '80 sacs ciment CPJ 42.5 CIMENCAM, 2 camions sable Sanaga, 2 camions gravier concassé',
    incidentsOrAlerts: 'RAS - Prise de béton excellente, contrôle scléromètre conforme aux prescriptions.',
    createdAt: '2026-11-04T17:30:00Z',
  },
  {
    id: 'log_02',
    projectId: 'proj_akwa_01',
    date: '2026-11-05',
    authorName: 'Ing. Paul Ndongo (Conducteur)',
    weather: 'CLOUDY',
    workersPresent: 28,
    workDone: 'Coffrage métallique et bois des 14 poteaux niveau 3. Pose des aciers HA 12 pour poutres maîtresses.',
    materialsUsed: '60 barres acier HA 12 FOKOU, 15kg fil de fer recuit, huile de décoffrage',
    incidentsOrAlerts: 'Avis météo averses côtières reçu : coulages extérieurs décalés à demain matin.',
    createdAt: '2026-11-05T09:30:00Z',
  },
  {
    id: 'log_03',
    projectId: 'proj_laquintinie_02',
    date: '2026-11-05',
    authorName: 'Ing. Paul Ndongo (Conducteur)',
    weather: 'SUNNY',
    workersPresent: 16,
    workDone: 'Pose de faïence murale et carrelage grès cérame dans les salles d\'accouchement et stérilisation.',
    materialsUsed: '45 cartons carreaux grès 60x60 SOREPCO, 15 sacs mortier-colle C2S',
    incidentsOrAlerts: 'Visite de conformité du médecin-chef de Laquintinie très satisfait du rendu sanitaire.',
    createdAt: '2026-11-05T11:00:00Z',
  },
];

export const initialTasks: ProjectTask[] = [
  // Chantier 1 : Immeuble R+5 Akwa (Pondération totale = 100%, moyenne pondérée = 42%)
  {
    id: 'task_akwa_01',
    projectId: 'proj_akwa_01',
    lotName: 'Lot 1 : Terrassement & Fondations',
    title: 'Implantation, fouilles en rigoles et semelles isolées',
    description: 'Décapage terre végétale, implantation topographique et coulage semelles armées dosées à 350kg/m³.',
    startDate: '2026-02-01',
    endDate: '2026-03-10',
    progressPercentage: 100,
    weight: 20,
    status: 'COMPLETED',
    assignedToName: 'Joseph Kamga (Chef Maçon)',
    isMilestone: true,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'task_akwa_02',
    projectId: 'proj_akwa_01',
    lotName: 'Lot 2 : Gros Œuvre & Béton Armé',
    title: 'Élévation poteaux et coulage planchers R+1 à R+5',
    description: 'Ferraillage HA 12/HA 8, coffrage et coulage des dalles pleines et poutres maîtresses.',
    startDate: '2026-03-12',
    endDate: '2026-07-20',
    progressPercentage: 55,
    weight: 35,
    status: 'IN_PROGRESS',
    assignedToName: 'Michel Tchinda (Ferrailleur)',
    isMilestone: true,
    createdAt: '2026-03-12T08:00:00Z',
  },
  {
    id: 'task_akwa_03',
    projectId: 'proj_akwa_01',
    lotName: 'Lot 3 : Maçonnerie & Agglos',
    title: 'Montage murs en parpaings de 15 et cloisons intérieures',
    description: 'Élévation des façades et refends en agglos vibrés creux 15x20x40 et linteaux.',
    startDate: '2026-05-15',
    endDate: '2026-09-05',
    progressPercentage: 15,
    weight: 20,
    status: 'DELAYED',
    assignedToName: 'Joseph Kamga (Chef Maçon)',
    isMilestone: false,
    createdAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 'task_akwa_04',
    projectId: 'proj_akwa_01',
    lotName: 'Lot 4 : Électricité & Plomberie',
    title: 'Incorporation gaines électriques, colonnes montantes PVC et TGBT',
    description: 'Saignées, passages fourreaux encastrés et évacuations sanitaires.',
    startDate: '2026-07-01',
    endDate: '2026-10-25',
    progressPercentage: 0,
    weight: 15,
    status: 'TODO',
    assignedToName: 'Salomon Nguema (Électricien)',
    isMilestone: false,
    createdAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'task_akwa_05',
    projectId: 'proj_akwa_01',
    lotName: 'Lot 5 : Finitions & Revêtements',
    title: 'Enduits, carrelage grès cérame, menuiserie alu et peinture',
    description: 'Travaux de second œuvre, vitrerie façade Akwa et réception technique.',
    startDate: '2026-10-01',
    endDate: '2026-12-15',
    progressPercentage: 0,
    weight: 10,
    status: 'TODO',
    assignedToName: 'Ing. Paul Ndongo',
    isMilestone: true,
    createdAt: '2026-10-01T08:00:00Z',
  },
  // Chantier 2 : Hôpital Laquintinie (Moyenne pondérée = 68%)
  {
    id: 'task_laq_01',
    projectId: 'proj_laquintinie_02',
    lotName: 'Lot 1 : Démolition & Reprise Structure',
    title: 'Curage des anciens revêtements et renforcement poteaux',
    description: 'Dépose sanitaires vétustes et chemisage béton des appuis porteurs.',
    startDate: '2026-03-10',
    endDate: '2026-04-20',
    progressPercentage: 100,
    weight: 25,
    status: 'COMPLETED',
    assignedToName: 'Joseph Kamga',
    isMilestone: true,
    createdAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'task_laq_02',
    projectId: 'proj_laquintinie_02',
    lotName: 'Lot 2 : Plomberie Médicale & Réseaux',
    title: 'Réseaux eau chaude/froide et fluides médicaux',
    description: 'Tuyauterie cuivre/PPR et tests de pression réglementaires.',
    startDate: '2026-04-22',
    endDate: '2026-06-15',
    progressPercentage: 90,
    weight: 30,
    status: 'IN_PROGRESS',
    assignedToName: 'Salomon Nguema',
    isMilestone: false,
    createdAt: '2026-04-22T08:00:00Z',
  },
  {
    id: 'task_laq_03',
    projectId: 'proj_laquintinie_02',
    lotName: 'Lot 3 : Carrelage & Peinture Antibactérienne',
    title: 'Faïence murale blocs stériles et peinture lavable',
    description: 'Pose carreaux grès 60x60 SOREPCO avec joints époxy hospitaliers.',
    startDate: '2026-06-10',
    endDate: '2026-08-30',
    progressPercentage: 35,
    weight: 45,
    status: 'IN_PROGRESS',
    assignedToName: 'Ing. Paul Ndongo',
    isMilestone: true,
    createdAt: '2026-06-10T08:00:00Z',
  },
];

export const initialPhotos: ProjectPhoto[] = [
  {
    id: 'photo_01',
    projectId: 'proj_akwa_01',
    taskId: 'task_akwa_01',
    uploaderName: 'Ing. Paul Ndongo',
    photoUrl: '/images/chantiers/avant.jpg',
    caption: 'État initial du terrain Akwa : piquetage topographique et implantation des axes sur latérite.',
    photoType: 'BEFORE',
    takenDate: '2026-02-03',
    createdAt: '2026-02-03T10:15:00Z',
  },
  {
    id: 'photo_02',
    projectId: 'proj_akwa_01',
    taskId: 'task_akwa_02',
    uploaderName: 'Ing. Paul Ndongo',
    photoUrl: '/images/chantiers/pendant.jpg',
    caption: 'Coulage de la dalle pleine R+2 à la pompe à béton et contrôle des armatures HA 12.',
    photoType: 'DURING',
    takenDate: '2026-11-04',
    createdAt: '2026-11-04T15:20:00Z',
  },
  {
    id: 'photo_03',
    projectId: 'proj_laquintinie_02',
    taskId: 'task_laq_03',
    uploaderName: 'Ing. Paul Ndongo',
    photoUrl: '/images/chantiers/apres.jpg',
    caption: 'Façade réhabilitée et terrasse carrelée du Pavillon Mère & Enfant (aperçu finition).',
    photoType: 'AFTER',
    takenDate: '2026-11-05',
    createdAt: '2026-11-05T11:30:00Z',
  },
  {
    id: 'photo_04',
    projectId: 'proj_laquintinie_02',
    taskId: 'task_laq_01',
    uploaderName: 'Christian Talla',
    photoUrl: '/images/chantiers/avant.jpg',
    caption: 'Préparation zone annexe avant démarrage des travaux de reprise structurelle.',
    photoType: 'BEFORE',
    takenDate: '2026-03-11',
    createdAt: '2026-03-11T09:00:00Z',
  },
];

export const initialWorkers: Worker[] = [
  // SOCABAT — Chantier Akwa R+5
  {
    id: 'wrk_01',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-001',
    fullName: 'Joseph Kamga',
    phone: '+237 673 12 34 56',
    specialty: 'CHEF_EQUIPE',
    specialtyLabel: "Chef d'équipe Maçonnerie",
    contractType: 'MENSUEL',
    dailyRateXAF: 11000,
    cniNumber: '118293044',
    isActive: true,
    createdAt: '2026-02-01T07:00:00Z',
  },
  {
    id: 'wrk_02',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-002',
    fullName: 'Michel Tchinda',
    phone: '+237 694 21 88 10',
    specialty: 'FERRAILLEUR',
    specialtyLabel: 'Chef Ferrailleur HA',
    contractType: 'TACHERON',
    dailyRateXAF: 9000,
    cniNumber: '115482910',
    isActive: true,
    createdAt: '2026-02-02T07:00:00Z',
  },
  {
    id: 'wrk_03',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-003',
    fullName: 'Jean-Pierre Mbarga',
    phone: '+237 677 45 90 12',
    specialty: 'COFFREUR',
    specialtyLabel: 'Coffreur Boiseur',
    contractType: 'JOURNALIER',
    dailyRateXAF: 8000,
    cniNumber: '119023847',
    isActive: true,
    createdAt: '2026-02-03T07:00:00Z',
  },
  {
    id: 'wrk_04',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-004',
    fullName: 'Rodrigue Njoya',
    phone: '+237 655 78 33 19',
    specialty: 'MACON',
    specialtyLabel: 'Maçon Qualifié Agglos',
    contractType: 'JOURNALIER',
    dailyRateXAF: 7500,
    isActive: true,
    createdAt: '2026-02-05T07:00:00Z',
  },
  {
    id: 'wrk_05',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-005',
    fullName: 'Salomon Nguema',
    phone: '+237 698 14 25 36',
    specialty: 'ELECTRICIEN',
    specialtyLabel: 'Électricien Bâtiment CFO',
    contractType: 'TACHERON',
    dailyRateXAF: 8500,
    isActive: true,
    createdAt: '2026-02-10T07:00:00Z',
  },
  {
    id: 'wrk_06',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-006',
    fullName: 'Fabrice Moukoko',
    phone: '+237 671 55 09 41',
    specialty: 'PLOMBIER',
    specialtyLabel: 'Plombier Sanitaire',
    contractType: 'JOURNALIER',
    dailyRateXAF: 7500,
    isActive: true,
    createdAt: '2026-02-12T07:00:00Z',
  },
  {
    id: 'wrk_07',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-007',
    fullName: 'Oumarou Sanda',
    phone: '+237 690 42 18 77',
    specialty: 'MANOEUVRE',
    specialtyLabel: 'Manœuvre Bétonnage',
    contractType: 'JOURNALIER',
    dailyRateXAF: 4500,
    isActive: true,
    createdAt: '2026-02-15T07:00:00Z',
  },
  {
    id: 'wrk_08',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    matricule: 'SOC-008',
    fullName: 'Benoît Fouda',
    phone: '+237 652 33 89 14',
    specialty: 'MANOEUVRE',
    specialtyLabel: 'Manœuvre Approvisionnement',
    contractType: 'JOURNALIER',
    dailyRateXAF: 4500,
    isActive: true,
    createdAt: '2026-02-15T07:00:00Z',
  },
  // SOCABAT — Chantier Hôpital Laquintinie
  {
    id: 'wrk_09',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    matricule: 'SOC-009',
    fullName: 'Emmanuel Essomba',
    phone: '+237 678 90 11 22',
    specialty: 'CARRELEUR',
    specialtyLabel: 'Carreleur Faïencier',
    contractType: 'TACHERON',
    dailyRateXAF: 9000,
    isActive: true,
    createdAt: '2026-03-12T07:00:00Z',
  },
  {
    id: 'wrk_10',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    matricule: 'SOC-010',
    fullName: 'Serge Biya',
    phone: '+237 695 34 67 80',
    specialty: 'PLOMBIER',
    specialtyLabel: 'Plombier Fluides Médicaux',
    contractType: 'JOURNALIER',
    dailyRateXAF: 8500,
    isActive: true,
    createdAt: '2026-03-14T07:00:00Z',
  },
  {
    id: 'wrk_11',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    matricule: 'SOC-011',
    fullName: 'Arnaud Mvondo',
    phone: '+237 650 19 82 44',
    specialty: 'MACON',
    specialtyLabel: 'Maçon Finitions',
    contractType: 'JOURNALIER',
    dailyRateXAF: 7000,
    isActive: true,
    createdAt: '2026-03-15T07:00:00Z',
  },
  {
    id: 'wrk_12',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    matricule: 'SOC-012',
    fullName: 'Ibrahim Aboubakar',
    phone: '+237 693 66 21 09',
    specialty: 'MANOEUVRE',
    specialtyLabel: 'Manœuvre Nettoyage & Port',
    contractType: 'JOURNALIER',
    dailyRateXAF: 4500,
    isActive: true,
    createdAt: '2026-03-16T07:00:00Z',
  },
  // SAHEL INFRA — Chantier Bastos Yaoundé
  {
    id: 'wrk_13',
    companyId: 'comp_sahel_02',
    projectId: 'proj_bastos_03',
    matricule: 'SAH-001',
    fullName: 'Amadou Ousmanou',
    phone: '+237 697 22 44 11',
    specialty: 'CHEF_EQUIPE',
    specialtyLabel: "Chef d'équipe VRD & Pavage",
    contractType: 'MENSUEL',
    dailyRateXAF: 10500,
    isActive: true,
    createdAt: '2026-05-02T07:00:00Z',
  },
  {
    id: 'wrk_14',
    companyId: 'comp_sahel_02',
    projectId: 'proj_bastos_03',
    matricule: 'SAH-002',
    fullName: 'Clément Atangana',
    phone: '+237 674 88 15 02',
    specialty: 'MACON',
    specialtyLabel: 'Poseur Bordures & Caniveaux',
    contractType: 'JOURNALIER',
    dailyRateXAF: 7500,
    isActive: true,
    createdAt: '2026-05-03T07:00:00Z',
  },
  {
    id: 'wrk_15',
    companyId: 'comp_sahel_02',
    projectId: 'proj_bastos_03',
    matricule: 'SAH-003',
    fullName: 'Dieudonné Ondoa',
    phone: '+237 654 19 03 88',
    specialty: 'MANOEUVRE',
    specialtyLabel: 'Manœuvre Compactage',
    contractType: 'JOURNALIER',
    dailyRateXAF: 4500,
    isActive: true,
    createdAt: '2026-05-04T07:00:00Z',
  },
];

function computeAttendancePay(dailyRateXAF: number, status: AttendanceStatus, overtimeHours: number): {
  hoursWorked: number;
  amountEarnedXAF: number;
} {
  const hourlyRate = dailyRateXAF / 8;
  const overtimePay = Math.round(overtimeHours * hourlyRate * 1.25);

  if (status === 'PRESENT') {
    return { hoursWorked: 8, amountEarnedXAF: dailyRateXAF + overtimePay };
  }
  if (status === 'LATE') {
    return { hoursWorked: 7, amountEarnedXAF: dailyRateXAF + overtimePay };
  }
  if (status === 'HALF_DAY') {
    return { hoursWorked: 4, amountEarnedXAF: Math.round(dailyRateXAF * 0.5) + overtimePay };
  }
  return { hoursWorked: 0, amountEarnedXAF: 0 };
}

function buildInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  // Générer 7 jours glissants (du J-6 à Aujourd'hui) pour démonstration réaliste
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getTime() - offset * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const isSunday = d.getDay() === 0;
    const isToday = offset === 0;

    initialWorkers.forEach((w, idx) => {
      // Le dimanche, seulement quelques gardiens/tâcherons ou repos chantier
      let status: AttendanceStatus = 'PRESENT';
      let checkInTime = '07:25';
      let overtimeHours = 0;

      if (isSunday) {
        status = idx % 4 === 0 ? 'HALF_DAY' : 'ABSENT';
        checkInTime = status === 'ABSENT' ? '' : '08:00';
      } else if (isToday) {
        // Aujourd'hui : pointage réaliste en cours (1 retard, 1 absent sur Akwa)
        if (w.id === 'wrk_04') {
          status = 'LATE';
          checkInTime = '08:20';
        } else if (w.id === 'wrk_08') {
          status = 'ABSENT';
          checkInTime = '';
        } else if (w.id === 'wrk_02') {
          overtimeHours = 2;
        }
      } else {
        // Jours passés validés
        if ((idx + offset) % 9 === 0) {
          status = 'ABSENT';
          checkInTime = '';
        } else if ((idx + offset) % 7 === 0) {
          status = 'LATE';
          checkInTime = '08:15';
        } else if ((idx + offset) % 5 === 0) {
          overtimeHours = 1;
        }
      }

      const { hoursWorked, amountEarnedXAF } = computeAttendancePay(w.dailyRateXAF, status, overtimeHours);

      records.push({
        id: `att_${w.id}_${dateStr}`,
        companyId: w.companyId,
        projectId: w.projectId,
        workerId: w.id,
        date: dateStr,
        status,
        checkInTime,
        hoursWorked,
        overtimeHours,
        amountEarnedXAF,
        isValidated: !isToday, // Jours précédents déjà validés pour la paie
        validatedBy: !isToday ? 'Ing. Paul Ndongo' : undefined,
        notes: status === 'LATE' ? 'Retard transport pluie matinale' : status === 'ABSENT' && !isSunday ? 'Absence non justifiée' : '',
        updatedAt: `${dateStr}T08:30:00Z`,
      });
    });
  }

  return records;
}

export const initialAttendanceRecords: AttendanceRecord[] = buildInitialAttendance();

const todayDateStr = new Date().toISOString().split('T')[0];

export const initialPayrollAdvances: PayrollAdvance[] = [
  {
    id: 'adv_01',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    workerId: 'wrk_01',
    workerName: 'Joseph Kamga',
    amountXAF: 15000,
    date: todayDateStr,
    reason: 'Acompte quinzaine & frais médicaux famille',
    paymentMethod: 'ORANGE_MONEY',
    deductedInPayrollId: 'pay_wrk_01',
    createdAt: `${todayDateStr}T09:00:00Z`,
  },
  {
    id: 'adv_02',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    workerId: 'wrk_03',
    workerName: 'Jean-Pierre Mbarga',
    amountXAF: 10000,
    date: todayDateStr,
    reason: 'Avance transport & ration chantier',
    paymentMethod: 'CASH',
    deductedInPayrollId: 'pay_wrk_03',
    createdAt: `${todayDateStr}T10:15:00Z`,
  },
  {
    id: 'adv_03',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    workerId: 'wrk_09',
    workerName: 'Emmanuel Essomba',
    amountXAF: 12000,
    date: todayDateStr,
    reason: 'Acompte sur pose faïence bloc stérile',
    paymentMethod: 'MTN_MOMO',
    deductedInPayrollId: 'pay_wrk_09',
    createdAt: `${todayDateStr}T11:00:00Z`,
  },
];

function buildInitialPayrolls(): PayrollRecord[] {
  const periodLabel = 'Quinzaine en cours (Cumul 7 jours)';
  return initialWorkers.map((w, idx) => {
    const workerAtt = initialAttendanceRecords.filter((r) => r.workerId === w.id && r.projectId === w.projectId);
    let daysWorked = 0;
    let overtimeHours = 0;
    let totalAttendancePay = 0;

    workerAtt.forEach((r) => {
      if (r.status === 'PRESENT' || r.status === 'LATE') daysWorked += 1;
      else if (r.status === 'HALF_DAY') daysWorked += 0.5;
      overtimeHours += r.overtimeHours || 0;
      totalAttendancePay += r.amountEarnedXAF || 0;
    });

    const hourlyRate = w.dailyRateXAF / 8;
    const overtimePayXAF = Math.round(overtimeHours * hourlyRate * 1.25);
    const basePayXAF = Math.max(0, totalAttendancePay - overtimePayXAF);
    const bonusXAF = w.specialty === 'CHEF_EQUIPE' ? 10000 : w.specialty === 'FERRAILLEUR' ? 5000 : 0;

    const advancesDeductedXAF = initialPayrollAdvances
      .filter((a) => a.workerId === w.id && a.projectId === w.projectId)
      .reduce((sum, a) => sum + a.amountXAF, 0);

    const grossPayXAF = basePayXAF + overtimePayXAF + bonusXAF;
    const netPayXAF = Math.max(0, grossPayXAF - advancesDeductedXAF);

    // Varier les statuts réalistes sur Akwa pour démonstration
    let status: 'DRAFT' | 'APPROVED' | 'PAID' = 'DRAFT';
    let paymentMethod: PaymentMethod | undefined;
    let paymentReference: string | undefined;
    let paidAt: string | undefined;

    if (idx === 0 || idx === 6) {
      status = 'PAID';
      paymentMethod = idx === 0 ? 'ORANGE_MONEY' : 'MTN_MOMO';
      paymentReference = idx === 0 ? 'OM-CM-984210' : 'MOMO-451029';
      paidAt = `${todayDateStr}T14:20:00Z`;
    } else if (idx === 1 || idx === 2 || idx === 4) {
      status = 'APPROVED';
    }

    return {
      id: `pay_${w.id}`,
      companyId: w.companyId,
      projectId: w.projectId,
      workerId: w.id,
      workerMatricule: w.matricule,
      workerName: w.fullName,
      specialtyLabel: w.specialtyLabel,
      phone: w.phone,
      periodLabel,
      daysWorked,
      dailyRateXAF: w.dailyRateXAF,
      basePayXAF,
      overtimeHours,
      overtimePayXAF,
      bonusXAF,
      advancesDeductedXAF,
      grossPayXAF,
      netPayXAF,
      status,
      paymentMethod,
      paymentReference,
      paidAt,
      createdAt: `${todayDateStr}T08:00:00Z`,
    };
  });
}

export const initialPayrollRecords: PayrollRecord[] = buildInitialPayrolls();

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  LIANTS: 'Liants & Ciments',
  ACIERS: 'Aciers & Ferraillage',
  GRANULATS: 'Granulats & Sables',
  MACONNERIE: 'Maçonnerie & Agglos',
  PLOMBERIE_ELEC: 'Plomberie & Réseaux',
  BOIS_COFFRAGE: 'Bois & Coffrage',
  CARBURANT: 'Carburant & Engins',
};

export const initialMaterials: MaterialItem[] = [
  {
    id: 'mat_01',
    companyId: 'comp_socabat_01',
    reference: 'MAT-CIM-425',
    designation: 'Ciment CPJ 42.5 CIMENCAM (Sac 50kg)',
    category: 'LIANTS',
    categoryLabel: CATEGORY_LABELS.LIANTS,
    unit: 'Sac 50kg',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: 88, // Alerte critique (< 100) pour démonstration immédiate
    minimumStockAlert: 100,
    unitPriceXAF: 4900,
    supplierName: 'CIMENCAM Douala',
    lastMovementAt: `${todayDateStr}T08:15:00Z`,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'mat_02',
    companyId: 'comp_socabat_01',
    reference: 'MAT-FER-HA12',
    designation: 'Fer à béton HA 12mm (Barre 12m)',
    category: 'ACIERS',
    categoryLabel: CATEGORY_LABELS.ACIERS,
    unit: 'Barre 12m',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: 265,
    minimumStockAlert: 60,
    unitPriceXAF: 6800,
    supplierName: 'GROUPE FOKOU',
    lastMovementAt: `${todayDateStr}T09:10:00Z`,
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'mat_03',
    companyId: 'comp_socabat_01',
    reference: 'MAT-FER-HA8',
    designation: 'Fer à béton HA 8mm pour cadres (Barre 12m)',
    category: 'ACIERS',
    categoryLabel: CATEGORY_LABELS.ACIERS,
    unit: 'Barre 12m',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: 105, // Sous vigilance (<= 1.35 * 80)
    minimumStockAlert: 80,
    unitPriceXAF: 3100,
    supplierName: 'GROUPE FOKOU',
    lastMovementAt: `${todayDateStr}T07:45:00Z`,
    createdAt: '2026-02-02T08:00:00Z',
  },
  {
    id: 'mat_04',
    companyId: 'comp_socabat_01',
    reference: 'MAT-SAB-SAN',
    designation: 'Sable fin fleuve Sanaga (Camion 20m³)',
    category: 'GRANULATS',
    categoryLabel: CATEGORY_LABELS.GRANULATS,
    unit: 'Camion 20m³',
    depotLocation: 'Aire Stockage Akwa',
    currentStock: 7,
    minimumStockAlert: 3,
    unitPriceXAF: 185000,
    supplierName: 'Dragages Sanaga SARL',
    lastMovementAt: `${todayDateStr}T10:00:00Z`,
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'mat_05',
    companyId: 'comp_socabat_01',
    reference: 'MAT-GRA-1525',
    designation: 'Gravier concassé basalte 15/25 (Camion 20m³)',
    category: 'GRANULATS',
    categoryLabel: CATEGORY_LABELS.GRANULATS,
    unit: 'Camion 20m³',
    depotLocation: 'Aire Stockage Akwa',
    currentStock: 2, // Alerte critique (<= 3)
    minimumStockAlert: 3,
    unitPriceXAF: 240000,
    supplierName: 'Carrière Razel Logbaba',
    lastMovementAt: `${todayDateStr}T10:30:00Z`,
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'mat_06',
    companyId: 'comp_socabat_01',
    reference: 'MAT-PARP-15',
    designation: 'Parpaings vibrés creux 15x20x40',
    category: 'MACONNERIE',
    categoryLabel: CATEGORY_LABELS.MACONNERIE,
    unit: 'Pièce',
    depotLocation: 'Parc Matériel Akwa',
    currentStock: 3400,
    minimumStockAlert: 600,
    unitPriceXAF: 280,
    supplierName: 'Briquetterie Yassa',
    lastMovementAt: `${todayDateStr}T11:20:00Z`,
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'mat_07',
    companyId: 'comp_socabat_01',
    reference: 'MAT-PVC-110',
    designation: 'Tube PVC évacuation Ø110mm (Longueur 4m)',
    category: 'PLOMBERIE_ELEC',
    categoryLabel: CATEGORY_LABELS.PLOMBERIE_ELEC,
    unit: 'Barre 4m',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: 74,
    minimumStockAlert: 25,
    unitPriceXAF: 5400,
    supplierName: 'SOREPCO Quincaillerie',
    lastMovementAt: `${todayDateStr}T12:00:00Z`,
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'mat_08',
    companyId: 'comp_socabat_01',
    reference: 'MAT-BOIS-COF',
    designation: 'Planches de coffrage Ayous 30x400cm',
    category: 'BOIS_COFFRAGE',
    categoryLabel: CATEGORY_LABELS.BOIS_COFFRAGE,
    unit: 'Planche',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: 195,
    minimumStockAlert: 50,
    unitPriceXAF: 3500,
    supplierName: 'Scierie du Wouri',
    lastMovementAt: `${todayDateStr}T09:40:00Z`,
    createdAt: '2026-02-12T08:00:00Z',
  },
  {
    id: 'mat_09',
    companyId: 'comp_socabat_01',
    reference: 'MAT-GAS-ENG',
    designation: 'Gasoil Engins & Bétonnières (Fût / Litre)',
    category: 'CARBURANT',
    categoryLabel: CATEGORY_LABELS.CARBURANT,
    unit: 'Litre',
    depotLocation: 'Cuve Sécurisée Dépôt Bassa',
    currentStock: 620,
    minimumStockAlert: 200,
    unitPriceXAF: 828,
    supplierName: 'TOTAL Énergies Cameroun',
    lastMovementAt: `${todayDateStr}T07:15:00Z`,
    createdAt: '2026-02-14T08:00:00Z',
  },
  // SAHEL INFRASTRUCTURES (Yaoundé)
  {
    id: 'mat_10',
    companyId: 'comp_sahel_02',
    reference: 'SAH-CIM-425',
    designation: 'Ciment 42.5 DANGOTE (Sac 50kg)',
    category: 'LIANTS',
    categoryLabel: CATEGORY_LABELS.LIANTS,
    unit: 'Sac 50kg',
    depotLocation: 'Dépôt Bastos (Yaoundé)',
    currentStock: 140,
    minimumStockAlert: 60,
    unitPriceXAF: 4850,
    supplierName: 'DANGOTE Cement Cameroun',
    lastMovementAt: `${todayDateStr}T08:30:00Z`,
    createdAt: '2026-05-01T08:00:00Z',
  },
  {
    id: 'mat_11',
    companyId: 'comp_sahel_02',
    reference: 'SAH-PAV-08',
    designation: 'Pavés autobloquants 8cm haute résistance',
    category: 'MACONNERIE',
    categoryLabel: CATEGORY_LABELS.MACONNERIE,
    unit: 'm² (36 pcs)',
    depotLocation: 'Chantier Bastos (Yaoundé)',
    currentStock: 320,
    minimumStockAlert: 80,
    unitPriceXAF: 6500,
    supplierName: 'BETON-YAO SARL',
    lastMovementAt: `${todayDateStr}T09:50:00Z`,
    createdAt: '2026-05-02T08:00:00Z',
  },
  {
    id: 'mat_12',
    companyId: 'comp_sahel_02',
    reference: 'SAH-BORD-T2',
    designation: 'Bordures béton préfabriquées T2 (1m)',
    category: 'MACONNERIE',
    categoryLabel: CATEGORY_LABELS.MACONNERIE,
    unit: 'Unité 1m',
    depotLocation: 'Chantier Bastos (Yaoundé)',
    currentStock: 42, // Critique (< 50)
    minimumStockAlert: 50,
    unitPriceXAF: 4200,
    supplierName: 'BETON-YAO SARL',
    lastMovementAt: `${todayDateStr}T10:15:00Z`,
    createdAt: '2026-05-03T08:00:00Z',
  },
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'mvt_01',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    materialId: 'mat_01',
    materialReference: 'MAT-CIM-425',
    materialDesignation: 'Ciment CPJ 42.5 CIMENCAM (Sac 50kg)',
    unit: 'Sac 50kg',
    type: 'EXIT',
    quantity: 80,
    unitPriceXAF: 4900,
    totalValueXAF: 392000,
    referenceDoc: 'BS-2026-089',
    operatorName: 'Christian Talla (Magasinier)',
    recipientName: 'Ing. Paul Ndongo (Akwa R+5)',
    notes: 'Coulage poteaux & poutres R+2',
    createdAt: `${todayDateStr}T08:15:00Z`,
  },
  {
    id: 'mvt_02',
    companyId: 'comp_socabat_01',
    materialId: 'mat_02',
    materialReference: 'MAT-FER-HA12',
    materialDesignation: 'Fer à béton HA 12mm (Barre 12m)',
    unit: 'Barre 12m',
    type: 'ENTRY',
    quantity: 200,
    unitPriceXAF: 6800,
    totalValueXAF: 1360000,
    referenceDoc: 'BE-2026-041',
    operatorName: 'Christian Talla (Magasinier)',
    recipientName: 'GROUPE FOKOU (BL #FK-9021)',
    notes: 'Réception camion semi-remorque vérifiée au dépôt Bassa',
    createdAt: `${todayDateStr}T09:10:00Z`,
  },
  {
    id: 'mvt_03',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    projectName: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    materialId: 'mat_07',
    materialReference: 'MAT-PVC-110',
    materialDesignation: 'Tube PVC évacuation Ø110mm (Longueur 4m)',
    unit: 'Barre 4m',
    type: 'EXIT',
    quantity: 26,
    unitPriceXAF: 5400,
    totalValueXAF: 140400,
    referenceDoc: 'BS-2026-090',
    operatorName: 'Christian Talla (Magasinier)',
    recipientName: 'Emmanuel Essomba (Plomberie)',
    notes: 'Colonnes d\'évacuation bloc sanitaire aile Nord',
    createdAt: `${todayDateStr}T12:00:00Z`,
  },
  {
    id: 'mvt_04',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    materialId: 'mat_05',
    materialReference: 'MAT-GRA-1525',
    materialDesignation: 'Gravier concassé basalte 15/25 (Camion 20m³)',
    unit: 'Camion 20m³',
    type: 'EXIT',
    quantity: 2,
    unitPriceXAF: 240000,
    totalValueXAF: 480000,
    referenceDoc: 'BS-2026-091',
    operatorName: 'Christian Talla (Magasinier)',
    recipientName: 'Joseph Kamga (Chef Maçon)',
    notes: 'Approvisionnement bétonnière dalle niveau 2',
    createdAt: `${todayDateStr}T10:30:00Z`,
  },
  {
    id: 'mvt_05',
    companyId: 'comp_sahel_02',
    projectId: 'proj_bastos_03',
    projectName: 'Voie Pavée Résidentielle et Caniveaux Bastos',
    materialId: 'mat_11',
    materialReference: 'SAH-PAV-08',
    materialDesignation: 'Pavés autobloquants 8cm haute résistance',
    unit: 'm² (36 pcs)',
    type: 'EXIT',
    quantity: 85,
    unitPriceXAF: 6500,
    totalValueXAF: 552500,
    referenceDoc: 'BS-YDE-019',
    operatorName: 'Ing. Moussa Bello',
    recipientName: 'Amadou Ousmanou (Équipe VRD)',
    notes: 'Pose tronçon avenue Ambassade',
    createdAt: `${todayDateStr}T09:50:00Z`,
  },
];

const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po_001',
    companyId: 'comp_socabat_01',
    orderNumber: 'BC-2026-DLA-001',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    supplierName: 'CIMENCAM (Ciments du Cameroun)',
    supplierContact: 'Service Grands Comptes',
    supplierPhone: '+237 233 42 15 20',
    requestedByName: 'Ing. Paul Ndongo',
    requestedByRole: 'SITE_MANAGER',
    approvedByName: "Samuel Eto'o Mbarga (DG)",
    approvedAt: `${todayDateStr}T09:15:00Z`,
    expectedDeliveryDate: nextWeekStr,
    paymentTerms: 'Virement 30 jours',
    includeTVA: false,
    subtotalXAF: 2450000,
    tvaXAF: 0,
    totalAmountXAF: 2450000,
    status: 'APPROVED',
    items: [
      {
        id: 'poi_001_1',
        materialId: 'mat_01',
        designation: 'Ciment CPJ 42.5 CIMENCAM (Sac 50kg)',
        unit: 'Sac 50kg',
        quantity: 500,
        unitPriceXAF: 4900,
        totalLineXAF: 2450000,
      },
    ],
    notes: 'Livraison directe chantier Rue Pau Akwa avant coulage dalle R+3.',
    createdAt: `${todayDateStr}T08:00:00Z`,
    updatedAt: `${todayDateStr}T09:15:00Z`,
  },
  {
    id: 'po_002',
    companyId: 'comp_socabat_01',
    orderNumber: 'BC-2026-DLA-002',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    supplierName: 'GROUPE FOKOU (Quincaillerie Lourde)',
    supplierContact: 'Jean-Pierre Ndzie',
    supplierPhone: '+237 699 10 20 30',
    requestedByName: 'Ing. Paul Ndongo',
    requestedByRole: 'SITE_MANAGER',
    expectedDeliveryDate: nextWeekStr,
    paymentTerms: 'Chèque à réception',
    includeTVA: true,
    subtotalXAF: 1732000,
    tvaXAF: 333410,
    totalAmountXAF: 2065410,
    status: 'PENDING_APPROVAL',
    items: [
      {
        id: 'poi_002_1',
        materialId: 'mat_02',
        designation: 'Fer à béton HA 12mm (Barre 12m)',
        unit: 'Barre 12m',
        quantity: 200,
        unitPriceXAF: 6800,
        totalLineXAF: 1360000,
      },
      {
        id: 'poi_002_2',
        materialId: 'mat_03',
        designation: 'Fer à béton HA 8mm pour cadres (Barre 12m)',
        unit: 'Barre 12m',
        quantity: 120,
        unitPriceXAF: 3100,
        totalLineXAF: 372000,
      },
    ],
    notes: 'Urgent : ferraillage poutres maîtresses et chaînages R+3.',
    createdAt: `${todayDateStr}T10:30:00Z`,
    updatedAt: `${todayDateStr}T10:30:00Z`,
  },
  {
    id: 'po_003',
    companyId: 'comp_socabat_01',
    orderNumber: 'BC-2026-DLA-003',
    projectId: 'proj_laquintinie_02',
    projectCode: 'CH-2026-DLA-02',
    projectName: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    supplierName: 'SOREPCO Cameroun',
    supplierContact: 'Clarisse Tchounkeu',
    supplierPhone: '+237 677 44 55 66',
    requestedByName: 'Ing. Paul Ndongo',
    requestedByRole: 'SITE_MANAGER',
    approvedByName: "Samuel Eto'o Mbarga (DG)",
    approvedAt: `${todayDateStr}T11:00:00Z`,
    expectedDeliveryDate: nextWeekStr,
    paymentTerms: 'Virement bancaire',
    includeTVA: false,
    subtotalXAF: 864000,
    tvaXAF: 0,
    totalAmountXAF: 864000,
    status: 'ORDERED',
    items: [
      {
        id: 'poi_003_1',
        materialId: 'mat_07',
        designation: 'Tube PVC évacuation Ø110mm (Longueur 4m)',
        unit: 'Barre 4m',
        quantity: 60,
        unitPriceXAF: 5400,
        totalLineXAF: 324000,
      },
      {
        id: 'poi_003_2',
        designation: 'Lot robinetterie inox hospitalière & siphons',
        unit: 'Ensemble',
        quantity: 12,
        unitPriceXAF: 45000,
        totalLineXAF: 540000,
      },
    ],
    notes: 'Bon transmis au fournisseur pour livraison bloc stérile.',
    createdAt: `${todayDateStr}T09:45:00Z`,
    updatedAt: `${todayDateStr}T11:20:00Z`,
  },
  {
    id: 'po_004',
    companyId: 'comp_socabat_01',
    orderNumber: 'BC-2026-DLA-004',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    supplierName: 'Carrière Razel Logbaba',
    supplierContact: 'Dispatch Agrégats',
    supplierPhone: '+237 695 11 22 44',
    requestedByName: 'Ing. Paul Ndongo',
    requestedByRole: 'SITE_MANAGER',
    expectedDeliveryDate: nextWeekStr,
    paymentTerms: 'Mobile Money / Cash livraison',
    includeTVA: false,
    subtotalXAF: 960000,
    tvaXAF: 0,
    totalAmountXAF: 960000,
    status: 'DRAFT',
    items: [
      {
        id: 'poi_004_1',
        materialId: 'mat_05',
        designation: 'Gravier concassé basalte 15/25 (Camion 20m³)',
        unit: 'Camion 20m³',
        quantity: 4,
        unitPriceXAF: 240000,
        totalLineXAF: 960000,
      },
    ],
    notes: 'Réapprovisionnement suite alerte stock critique (2 camions restants).',
    createdAt: `${todayDateStr}T12:10:00Z`,
    updatedAt: `${todayDateStr}T12:10:00Z`,
  },
  {
    id: 'po_005',
    companyId: 'comp_sahel_02',
    orderNumber: 'BC-2026-YDE-001',
    projectId: 'proj_bastos_03',
    projectCode: 'CH-2026-YDE-01',
    projectName: 'Voie Pavée Résidentielle et Caniveaux Bastos',
    supplierName: 'BETON-YAO SARL',
    supplierContact: 'Direction Commerciale Yaoundé',
    supplierPhone: '+237 677 90 12 33',
    requestedByName: 'Ing. Moussa Bello',
    requestedByRole: 'SITE_MANAGER',
    expectedDeliveryDate: nextWeekStr,
    paymentTerms: 'Chèque à réception',
    includeTVA: false,
    subtotalXAF: 1070000,
    tvaXAF: 0,
    totalAmountXAF: 1070000,
    status: 'PENDING_APPROVAL',
    items: [
      {
        id: 'poi_005_1',
        materialId: 'mat_12',
        designation: 'Bordures béton préfabriquées T2 (1m)',
        unit: 'Unité 1m',
        quantity: 100,
        unitPriceXAF: 4200,
        totalLineXAF: 420000,
      },
      {
        id: 'poi_005_2',
        materialId: 'mat_11',
        designation: 'Pavés autobloquants 8cm haute résistance',
        unit: 'm² (36 pcs)',
        quantity: 100,
        unitPriceXAF: 6500,
        totalLineXAF: 650000,
      },
    ],
    notes: 'Extension linéaire caniveau descente Ambassade.',
    createdAt: `${todayDateStr}T11:30:00Z`,
    updatedAt: `${todayDateStr}T11:30:00Z`,
  },
];

export const initialDeliveryNotes: DeliveryNote[] = [
  {
    id: 'dn_001',
    companyId: 'comp_socabat_01',
    deliveryNumber: 'BL-2026-DLA-001',
    supplierBlReference: 'CIM-BL-88412',
    purchaseOrderId: 'po_001',
    purchaseOrderNumber: 'BC-2026-DLA-001',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    supplierName: 'CIMENCAM (Ciments du Cameroun)',
    destination: 'DEPOT',
    receivedByName: 'Christian Talla (Magasinier)',
    receivedByRole: 'STOREKEEPER',
    driverName: 'Emmanuel Fotsing',
    truckPlate: 'LT 892 HF',
    deliveryDate: todayDateStr,
    status: 'PARTIAL',
    totalValueXAF: 1470000,
    stockSynced: true,
    items: [
      {
        id: 'dni_001_1',
        purchaseOrderItemId: 'poi_001_1',
        materialId: 'mat_01',
        designation: 'Ciment CPJ 42.5 CIMENCAM (Sac 50kg)',
        unit: 'Sac 50kg',
        orderedQuantity: 500,
        previouslyDeliveredQuantity: 0,
        deliveredQuantity: 300,
        damagedOrRejectedQuantity: 0,
        unitPriceXAF: 4900,
        totalValueXAF: 1470000,
        conformityNote: '1ère rotation camion 15T conforme — reste 200 sacs à livrer.',
      },
    ],
    observations: 'Livraison partielle (Rotation 1/2). Sacs stockés sur palettes sèches Dépôt Bassa.',
    createdAt: `${todayDateStr}T10:15:00Z`,
  },
  {
    id: 'dn_002',
    companyId: 'comp_socabat_01',
    deliveryNumber: 'BL-2026-DLA-002',
    supplierBlReference: 'SOR-2026-319',
    purchaseOrderId: 'po_003',
    purchaseOrderNumber: 'BC-2026-DLA-003',
    projectId: 'proj_laquintinie_02',
    projectCode: 'CH-2026-DLA-02',
    projectName: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    supplierName: 'SOREPCO Cameroun',
    destination: 'DIRECT_SITE',
    receivedByName: 'Ing. Paul Ndongo',
    receivedByRole: 'SITE_MANAGER',
    driverName: 'Michel Njoya',
    truckPlate: 'LT 410 KG',
    deliveryDate: todayDateStr,
    status: 'DISPUTED',
    totalValueXAF: 783000,
    stockSynced: false,
    items: [
      {
        id: 'dni_002_1',
        purchaseOrderItemId: 'poi_003_1',
        materialId: 'mat_07',
        designation: 'Tube PVC évacuation Ø110mm (Longueur 4m)',
        unit: 'Barre 4m',
        orderedQuantity: 60,
        previouslyDeliveredQuantity: 0,
        deliveredQuantity: 45,
        damagedOrRejectedQuantity: 5,
        unitPriceXAF: 5400,
        totalValueXAF: 243000,
        conformityNote: '5 barres fissurées refusées au déchargement.',
      },
      {
        id: 'dni_002_2',
        purchaseOrderItemId: 'poi_003_2',
        designation: 'Lot robinetterie inox hospitalière & siphons',
        unit: 'Ensemble',
        orderedQuantity: 12,
        previouslyDeliveredQuantity: 0,
        deliveredQuantity: 12,
        damagedOrRejectedQuantity: 0,
        unitPriceXAF: 45000,
        totalValueXAF: 540000,
        conformityNote: 'Lot complet conforme.',
      },
    ],
    observations: 'Réserve émise sur BL papier : 5 barres PVC endommagées pendant le transport. Remplacement demandé.',
    createdAt: `${todayDateStr}T13:20:00Z`,
  },
];

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MATERIAUX: 'Matériaux & Agrégats',
  MAIN_OEUVRE: 'Main d\'œuvre & Journaliers',
  ENGINS_CARBURANT: 'Engins, Location & Carburant',
  SOUS_TRAITANCE: 'Sous-traitance & Lots Techniques',
  FRAIS_CHANTIER: 'Frais Généraux Chantier',
  DIVERS: 'Menues Dépenses & Divers',
};

export const initialProjectBudgetLines: ProjectBudgetLine[] = [
  // SOCABAT — proj_akwa_01 (Total 185 000 000 FCFA)
  { id: 'bl_01', companyId: 'comp_socabat_01', projectId: 'proj_akwa_01', category: 'MATERIAUX', categoryLabel: EXPENSE_CATEGORY_LABELS.MATERIAUX, allocatedBudgetXAF: 95000000 },
  { id: 'bl_02', companyId: 'comp_socabat_01', projectId: 'proj_akwa_01', category: 'MAIN_OEUVRE', categoryLabel: EXPENSE_CATEGORY_LABELS.MAIN_OEUVRE, allocatedBudgetXAF: 42000000 },
  { id: 'bl_03', companyId: 'comp_socabat_01', projectId: 'proj_akwa_01', category: 'ENGINS_CARBURANT', categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT, allocatedBudgetXAF: 18000000 },
  { id: 'bl_04', companyId: 'comp_socabat_01', projectId: 'proj_akwa_01', category: 'SOUS_TRAITANCE', categoryLabel: EXPENSE_CATEGORY_LABELS.SOUS_TRAITANCE, allocatedBudgetXAF: 20000000 },
  { id: 'bl_05', companyId: 'comp_socabat_01', projectId: 'proj_akwa_01', category: 'FRAIS_CHANTIER', categoryLabel: EXPENSE_CATEGORY_LABELS.FRAIS_CHANTIER, allocatedBudgetXAF: 10000000 },
  // SOCABAT — proj_laquintinie_02 (Total 78 000 000 FCFA)
  { id: 'bl_06', companyId: 'comp_socabat_01', projectId: 'proj_laquintinie_02', category: 'MATERIAUX', categoryLabel: EXPENSE_CATEGORY_LABELS.MATERIAUX, allocatedBudgetXAF: 38000000 },
  { id: 'bl_07', companyId: 'comp_socabat_01', projectId: 'proj_laquintinie_02', category: 'MAIN_OEUVRE', categoryLabel: EXPENSE_CATEGORY_LABELS.MAIN_OEUVRE, allocatedBudgetXAF: 18000000 },
  { id: 'bl_08', companyId: 'comp_socabat_01', projectId: 'proj_laquintinie_02', category: 'ENGINS_CARBURANT', categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT, allocatedBudgetXAF: 6000000 },
  { id: 'bl_09', companyId: 'comp_socabat_01', projectId: 'proj_laquintinie_02', category: 'SOUS_TRAITANCE', categoryLabel: EXPENSE_CATEGORY_LABELS.SOUS_TRAITANCE, allocatedBudgetXAF: 11000000 },
  { id: 'bl_10', companyId: 'comp_socabat_01', projectId: 'proj_laquintinie_02', category: 'FRAIS_CHANTIER', categoryLabel: EXPENSE_CATEGORY_LABELS.FRAIS_CHANTIER, allocatedBudgetXAF: 5000000 },
  // SAHEL — proj_bastos_03 (Total 120 000 000 FCFA)
  { id: 'bl_11', companyId: 'comp_sahel_02', projectId: 'proj_bastos_03', category: 'MATERIAUX', categoryLabel: EXPENSE_CATEGORY_LABELS.MATERIAUX, allocatedBudgetXAF: 65000000 },
  { id: 'bl_12', companyId: 'comp_sahel_02', projectId: 'proj_bastos_03', category: 'MAIN_OEUVRE', categoryLabel: EXPENSE_CATEGORY_LABELS.MAIN_OEUVRE, allocatedBudgetXAF: 28000000 },
  { id: 'bl_13', companyId: 'comp_sahel_02', projectId: 'proj_bastos_03', category: 'ENGINS_CARBURANT', categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT, allocatedBudgetXAF: 17000000 },
  { id: 'bl_14', companyId: 'comp_sahel_02', projectId: 'proj_bastos_03', category: 'FRAIS_CHANTIER', categoryLabel: EXPENSE_CATEGORY_LABELS.FRAIS_CHANTIER, allocatedBudgetXAF: 10000000 },
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp_001',
    companyId: 'comp_socabat_01',
    reference: 'DEP-2026-DLA-001',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    category: 'ENGINS_CARBURANT',
    categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT,
    title: 'Location grue à tour & gasoil groupe électrogène (Quinzaine)',
    beneficiary: 'TotalEnergies / MATGENIE Douala',
    amountXAF: 2450000,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'VIR-2026-4418',
    invoiceRef: 'FAC-MG-0912',
    expenseDate: todayDateStr,
    status: 'PAID',
    recordedByName: 'Nadine Ngo Bell (Comptable)',
    approvedByName: "Samuel Eto'o Mbarga (DG)",
    notes: 'Couvre 2 000 L gasoil et forfait grue chantier Akwa.',
    createdAt: `${todayDateStr}T08:40:00Z`,
  },
  {
    id: 'exp_002',
    companyId: 'comp_socabat_01',
    reference: 'DEP-2026-DLA-002',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    category: 'SOUS_TRAITANCE',
    categoryLabel: EXPENSE_CATEGORY_LABELS.SOUS_TRAITANCE,
    title: 'Acompte 40% lot étanchéité & cuvelage sous-sol',
    beneficiary: 'ETANCHE-CAM SARL',
    amountXAF: 3800000,
    paymentMethod: 'BANK_TRANSFER',
    invoiceRef: 'DEV-ET-2026-14',
    expenseDate: todayDateStr,
    status: 'APPROVED',
    recordedByName: 'Ing. Paul Ndongo',
    approvedByName: "Samuel Eto'o Mbarga (DG)",
    notes: 'Bon à payer validé par le DG — attente décaissement comptable.',
    createdAt: `${todayDateStr}T10:05:00Z`,
  },
  {
    id: 'exp_003',
    companyId: 'comp_socabat_01',
    reference: 'DEP-2026-DLA-003',
    projectId: 'proj_akwa_01',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Commercial & Bureaux Akwa',
    category: 'FRAIS_CHANTIER',
    categoryLabel: EXPENSE_CATEGORY_LABELS.FRAIS_CHANTIER,
    title: 'Menues dépenses caisse chantier (disques meuleuse, EPI, eau)',
    beneficiary: 'Caisse Avance Chantier Akwa',
    amountXAF: 185000,
    paymentMethod: 'ORANGE_MONEY',
    invoiceRef: 'REC-AKW-077',
    expenseDate: todayDateStr,
    status: 'PENDING',
    recordedByName: 'Ing. Paul Ndongo',
    notes: 'Justificatifs remis au chef comptable.',
    createdAt: `${todayDateStr}T11:30:00Z`,
  },
  {
    id: 'exp_004',
    companyId: 'comp_socabat_01',
    reference: 'DEP-2026-DLA-004',
    projectId: 'proj_laquintinie_02',
    projectCode: 'CH-2026-DLA-02',
    projectName: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    category: 'SOUS_TRAITANCE',
    categoryLabel: EXPENSE_CATEGORY_LABELS.SOUS_TRAITANCE,
    title: 'Pose réseaux fluides médicaux & gaz bloc stérile',
    beneficiary: 'MEDITECH Afrique Centrale',
    amountXAF: 2950000,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: 'VIR-2026-4490',
    invoiceRef: 'FAC-MED-108',
    expenseDate: todayDateStr,
    status: 'PAID',
    recordedByName: 'Nadine Ngo Bell (Comptable)',
    approvedByName: "Samuel Eto'o Mbarga (DG)",
    createdAt: `${todayDateStr}T09:15:00Z`,
  },
  {
    id: 'exp_005',
    companyId: 'comp_socabat_01',
    reference: 'DEP-2026-DLA-005',
    projectId: 'proj_laquintinie_02',
    projectCode: 'CH-2026-DLA-02',
    projectName: 'Réhabilitation Pavillon Mère & Enfant Hôpital Laquintinie',
    category: 'ENGINS_CARBURANT',
    categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT,
    title: 'Évacuation gravats & location benne 15T (5 rotations)',
    beneficiary: 'TRANS-LITTORAL Douala',
    amountXAF: 425000,
    paymentMethod: 'MTN_MOMO',
    invoiceRef: 'BL-TL-309',
    expenseDate: todayDateStr,
    status: 'PENDING',
    recordedByName: 'Ing. Paul Ndongo',
    createdAt: `${todayDateStr}T12:20:00Z`,
  },
  {
    id: 'exp_006',
    companyId: 'comp_sahel_02',
    reference: 'DEP-2026-YDE-001',
    projectId: 'proj_bastos_03',
    projectCode: 'CH-2026-YDE-01',
    projectName: 'Voie Pavée Résidentielle et Caniveaux Bastos',
    category: 'ENGINS_CARBURANT',
    categoryLabel: EXPENSE_CATEGORY_LABELS.ENGINS_CARBURANT,
    title: 'Carburant compacteur & niveleuse + huile hydraulique',
    beneficiary: 'Tradex Station Bastos',
    amountXAF: 980000,
    paymentMethod: 'CASH',
    paymentReference: 'CAISSE-YDE-112',
    invoiceRef: 'FAC-TRX-781',
    expenseDate: todayDateStr,
    status: 'PAID',
    recordedByName: 'Ing. Moussa Bello',
    approvedByName: 'Direction Sahel Infra',
    createdAt: `${todayDateStr}T10:45:00Z`,
  },
];

export const initialNotificationPreferences: NotificationPreferences[] = [
  {
    companyId: 'comp_socabat_01',
    enableCriticalStockAlerts: true,
    enableDgApprovalAlerts: true,
    enableDeliveryDisputeAlerts: true,
    enableBudgetThresholdAlerts: true,
    enablePayrollAlerts: true,
    channels: {
      inApp: true,
      whatsapp: true,
      sms: true,
      email: true,
    },
    whatsappNumber: '+237 699 42 18 05',
    digestEmail: 'dg@socabat-cm.com',
  },
  {
    companyId: 'comp_sahel_02',
    enableCriticalStockAlerts: true,
    enableDgApprovalAlerts: true,
    enableDeliveryDisputeAlerts: true,
    enableBudgetThresholdAlerts: true,
    enablePayrollAlerts: true,
    channels: {
      inApp: true,
      whatsapp: true,
      sms: false,
      email: true,
    },
    whatsappNumber: '+237 677 18 90 44',
    digestEmail: 'direction@sahel-infra.cm',
  },
];

export const initialManualNotifications: BtpNotification[] = [
  {
    id: 'notif_init_01',
    companyId: 'comp_socabat_01',
    category: 'SYSTEME',
    severity: 'INFO',
    title: 'Briefing Sécurité & Port des EPI — Zone Bonapriso',
    message:
      'Rappel aux Chefs de chantier et Magasiniers : contrôle obligatoire des casques, harnais et gilets avant l’arrivée de la toupie béton prévue à 08h30.',
    projectCode: 'CH-2026-DLA-01',
    projectName: 'Immeuble R+5 Résidence Bonapriso',
    targetRoles: ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'WORKER'],
    actionTargetStep: 'step6',
    actionLabel: 'Voir le chantier',
    channelsSent: ['IN_APP', 'WHATSAPP', 'SMS'],
    isRead: false,
    isArchived: false,
    isDynamic: false,
    createdAt: `${todayDateStr}T06:45:00Z`,
  },
  {
    id: 'notif_init_02',
    companyId: 'comp_socabat_01',
    category: 'RH_PAIE',
    severity: 'MEDIUM',
    title: 'Clôture hebdomadaire des pointages Orange Money / MTN MoMo',
    message:
      'Merci aux Chefs de chantier de valider les heures supplémentaires avant 17h00 pour permettre au Comptable de préparer les virements de quinzaine.',
    projectCode: 'CH-2026-DLA-02',
    projectName: 'Centre Commercial Akwa Nord',
    targetRoles: ['DIRECTOR', 'SITE_MANAGER', 'ACCOUNTANT'],
    actionTargetStep: 'step8',
    actionLabel: 'Vérifier les pointages',
    channelsSent: ['IN_APP', 'EMAIL'],
    isRead: true,
    isArchived: false,
    isDynamic: false,
    createdAt: `${todayDateStr}T07:15:00Z`,
  },
  {
    id: 'notif_init_03',
    companyId: 'comp_sahel_02',
    category: 'SYSTEME',
    severity: 'INFO',
    title: 'Inspection Contrôle Qualité Voirie Bastos',
    message:
      'Passage de la mission de contrôle technique prévu demain matin sur le lot Caniveaux & Pavage. Préparer les fiches d’avancement.',
    projectCode: 'CH-2026-YDE-01',
    projectName: 'Voie Pavée Résidentielle et Caniveaux Bastos',
    targetRoles: ['DIRECTOR', 'SITE_MANAGER'],
    actionTargetStep: 'step6',
    actionLabel: 'Ouvrir Chantiers',
    channelsSent: ['IN_APP', 'WHATSAPP'],
    isRead: false,
    isArchived: false,
    isDynamic: false,
    createdAt: `${todayDateStr}T07:30:00Z`,
  },
];

// Singleton Database Manager
class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = {
      companies: [...initialCompanies],
      users: [...initialUsers],
      projects: [...initialProjects],
      dailyLogs: [...initialDailyLogs],
      tasks: [...initialTasks],
      photos: [...initialPhotos],
      workers: [...initialWorkers],
      attendanceRecords: [...initialAttendanceRecords],
      payrollAdvances: [...initialPayrollAdvances],
      payrollRecords: [...initialPayrollRecords],
      materials: [...initialMaterials],
      stockMovements: [...initialStockMovements],
      purchaseOrders: [...initialPurchaseOrders],
      deliveryNotes: [...initialDeliveryNotes],
      expenses: [...initialExpenses],
      budgetLines: [...initialProjectBudgetLines],
      notifications: [...initialManualNotifications],
      notificationPreferences: [...initialNotificationPreferences],
      saasInvoices: [...initialSaasInvoices],
      paymentTransactions: [],
      suppliers: [...initialSuppliers],
      vaultDocuments: [...initialVaultDocuments],
    };
    this.ensureHashedPasswords();
  }

  private ensureHashedPasswords(): void {
    for (const user of this.state.users) {
      if (user.passwordHash && !isBcryptHash(user.passwordHash)) {
        user.passwordHash = hashPassword(user.passwordHash);
      }
    }
  }

  exportState(): DatabaseState {
    return this.state;
  }

  hydrateState(incoming: Partial<DatabaseState>): void {
    if (!incoming || typeof incoming !== 'object') return;
    this.state = {
      ...this.state,
      ...incoming,
    };
    this.ensureHashedPasswords();
  }

  getCompanies(): Company[] {
    return this.state.companies;
  }

  getCompanyById(id: string): Company | undefined {
    return this.state.companies.find((c) => c.id === id);
  }

  createCompany(data: Omit<Company, 'id' | 'createdAt'>): Company {
    const newCompany: Company = {
      ...data,
      id: `comp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.companies.push(newCompany);
    return newCompany;
  }

  getUsers(companyId?: string): User[] {
    const users = this.state.users.map(({ passwordHash, ...rest }) => rest);
    if (!companyId) return users;
    return users.filter((u) => u.companyId === companyId && u.role !== 'SUPER_ADMIN');
  }

  getUserByEmail(email: string) {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string) {
    return this.state.users.find((u) => u.id === id);
  }

  createUser(data: Omit<User, 'id' | 'createdAt'> & { passwordHash: string }) {
    const safeHash = isBcryptHash(data.passwordHash)
      ? data.passwordHash
      : hashPassword(data.passwordHash);
    const newUser = {
      ...data,
      passwordHash: safeHash,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  getProjects(companyId: string): Project[] {
    return this.state.projects.filter((p) => p.companyId === companyId);
  }

  getProjectById(id: string): Project | undefined {
    return this.state.projects.find((p) => p.id === id);
  }

  createProject(data: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.projects.unshift(newProject);
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const project = this.state.projects.find((p) => p.id === id);
    if (!project) return null;
    Object.assign(project, updates);
    return project;
  }

  getDailyLogs(projectId: string): ProjectDailyLog[] {
    return this.state.dailyLogs.filter((log) => log.projectId === projectId);
  }

  addDailyLog(data: Omit<ProjectDailyLog, 'id' | 'createdAt'>): ProjectDailyLog {
    const newLog: ProjectDailyLog = {
      ...data,
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.dailyLogs.unshift(newLog);
    return newLog;
  }

  getTasks(projectId: string): ProjectTask[] {
    return this.state.tasks.filter((t) => t.projectId === projectId);
  }

  createTask(data: Omit<ProjectTask, 'id' | 'createdAt'>): ProjectTask {
    const newTask: ProjectTask = {
      ...data,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.tasks.push(newTask);
    this.recalculateProjectProgress(data.projectId);
    return newTask;
  }

  updateTask(taskId: string, updates: Partial<ProjectTask>): ProjectTask | null {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    Object.assign(task, updates);
    if (task.progressPercentage >= 100) {
      task.progressPercentage = 100;
      task.status = 'COMPLETED';
    } else if (task.progressPercentage > 0 && task.status === 'TODO') {
      task.status = 'IN_PROGRESS';
    }
    this.recalculateProjectProgress(task.projectId);
    return task;
  }

  deleteTask(taskId: string): boolean {
    const idx = this.state.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;
    const projectId = this.state.tasks[idx].projectId;
    this.state.tasks.splice(idx, 1);
    this.recalculateProjectProgress(projectId);
    return true;
  }

  recalculateProjectProgress(projectId: string): number {
    const project = this.state.projects.find((p) => p.id === projectId);
    const projectTasks = this.state.tasks.filter((t) => t.projectId === projectId);
    if (!project || projectTasks.length === 0) return project?.progressPercentage || 0;

    const totalWeight = projectTasks.reduce((sum, t) => sum + (t.weight || 1), 0);
    const weightedSum = projectTasks.reduce((sum, t) => sum + t.progressPercentage * (t.weight || 1), 0);
    const newProgress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    project.progressPercentage = newProgress;
    return newProgress;
  }

  getPhotos(projectId: string): ProjectPhoto[] {
    return this.state.photos.filter((p) => p.projectId === projectId);
  }

  addPhoto(data: Omit<ProjectPhoto, 'id' | 'createdAt'>): ProjectPhoto {
    const newPhoto: ProjectPhoto = {
      ...data,
      id: `photo_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.photos.unshift(newPhoto);
    return newPhoto;
  }

  deletePhoto(photoId: string): boolean {
    const idx = this.state.photos.findIndex((p) => p.id === photoId);
    if (idx === -1) return false;
    this.state.photos.splice(idx, 1);
    return true;
  }

  updateCompany(id: string, updates: Partial<Company>): Company | null {
    const company = this.state.companies.find((c) => c.id === id);
    if (!company) return null;
    Object.assign(company, updates);
    return company;
  }

  updateCompanyStatus(id: string, status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'): Company | null {
    return this.updateCompany(id, { status });
  }

  updateCompanyPlan(id: string, plan: any): Company | null {
    const maxProjects = plan === 'STARTER' ? 2 : plan === 'PRO' ? 10 : 999;
    const maxUsers = plan === 'STARTER' ? 5 : plan === 'PRO' ? 20 : 999;
    return this.updateCompany(id, { plan, maxProjects, maxUsers });
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.state.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable.' };
    if (!verifyPassword(oldPass, user.passwordHash)) {
      return { success: false, error: 'Ancien mot de passe incorrect.' };
    }
    user.passwordHash = hashPassword(newPass);
    return { success: true };
  }

  toggleUserStatus(userId: string): User | null {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user || user.role === 'SUPER_ADMIN') return null;
    user.isActive = !user.isActive;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  deleteUser(userId: string): User | null {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    const target = this.state.users[idx];
    if (target.role === 'SUPER_ADMIN') return null;
    this.state.users.splice(idx, 1);
    const { passwordHash, ...safeUser } = target;
    return safeUser;
  }

  // ============================================================================
  // ÉTAPE 8 : GESTION DU PERSONNEL & POINTAGE QUOTIDIEN
  // ============================================================================

  getWorkers(companyId: string, projectId?: string): Worker[] {
    return this.state.workers.filter(
      (w) => w.companyId === companyId && (!projectId || w.projectId === projectId)
    );
  }

  createWorker(data: Omit<Worker, 'id' | 'matricule' | 'createdAt'> & { matricule?: string }): Worker {
    const companyWorkersCount = this.state.workers.filter((w) => w.companyId === data.companyId).length;
    const prefix = data.companyId === 'comp_sahel_02' ? 'SAH' : 'SOC';
    const newWorker: Worker = {
      ...data,
      id: `wrk_${Date.now()}`,
      matricule: data.matricule || `${prefix}-${String(companyWorkersCount + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    this.state.workers.unshift(newWorker);

    // Mettre à jour le compteur d'effectifs du chantier
    const proj = this.state.projects.find((p) => p.id === data.projectId);
    if (proj) {
      proj.workersCount = this.state.workers.filter((w) => w.projectId === proj.id && w.isActive).length;
    }
    return newWorker;
  }

  toggleWorkerActive(workerId: string): Worker | null {
    const worker = this.state.workers.find((w) => w.id === workerId);
    if (!worker) return null;
    worker.isActive = !worker.isActive;
    const proj = this.state.projects.find((p) => p.id === worker.projectId);
    if (proj) {
      proj.workersCount = this.state.workers.filter((w) => w.projectId === proj.id && w.isActive).length;
    }
    return worker;
  }

  deleteWorker(workerId: string): Worker | null {
    const idx = this.state.workers.findIndex((w) => w.id === workerId);
    if (idx === -1) return null;
    const [removed] = this.state.workers.splice(idx, 1);
    this.state.attendanceRecords = this.state.attendanceRecords.filter((r) => r.workerId !== workerId);
    const proj = this.state.projects.find((p) => p.id === removed.projectId);
    if (proj) {
      proj.workersCount = this.state.workers.filter((w) => w.projectId === proj.id && w.isActive).length;
    }
    return removed;
  }

  getAttendanceForDate(companyId: string, projectId: string, date: string): AttendanceRecord[] {
    return this.state.attendanceRecords.filter(
      (r) => r.companyId === companyId && r.projectId === projectId && r.date === date
    );
  }

  upsertAttendance(input: {
    companyId: string;
    projectId: string;
    workerId: string;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    overtimeHours?: number;
    notes?: string;
  }): AttendanceRecord | null {
    const worker = this.state.workers.find((w) => w.id === input.workerId);
    if (!worker) return null;

    const overtimeHours = Math.max(0, Math.min(6, Number(input.overtimeHours || 0)));
    const { hoursWorked, amountEarnedXAF } = computeAttendancePay(worker.dailyRateXAF, input.status, overtimeHours);

    const existing = this.state.attendanceRecords.find(
      (r) => r.workerId === input.workerId && r.projectId === input.projectId && r.date === input.date
    );

    const defaultCheckIn =
      input.status === 'ABSENT'
        ? ''
        : input.checkInTime !== undefined
          ? input.checkInTime
          : input.status === 'LATE'
            ? '08:15'
            : '07:30';

    if (existing) {
      existing.status = input.status;
      existing.checkInTime = defaultCheckIn;
      existing.hoursWorked = hoursWorked;
      existing.overtimeHours = overtimeHours;
      existing.amountEarnedXAF = amountEarnedXAF;
      existing.isValidated = false; // Réouverture suite à modification
      if (input.notes !== undefined) existing.notes = input.notes;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const created: AttendanceRecord = {
      id: `att_${input.workerId}_${input.date}`,
      companyId: input.companyId,
      projectId: input.projectId,
      workerId: input.workerId,
      date: input.date,
      status: input.status,
      checkInTime: defaultCheckIn,
      hoursWorked,
      overtimeHours,
      amountEarnedXAF,
      isValidated: false,
      notes: input.notes || '',
      updatedAt: new Date().toISOString(),
    };
    this.state.attendanceRecords.push(created);
    return created;
  }

  markAllPresent(companyId: string, projectId: string, date: string): AttendanceRecord[] {
    const activeWorkers = this.state.workers.filter(
      (w) => w.companyId === companyId && w.projectId === projectId && w.isActive
    );

    const updated: AttendanceRecord[] = [];
    for (const w of activeWorkers) {
      const rec = this.upsertAttendance({
        companyId,
        projectId,
        workerId: w.id,
        date,
        status: 'PRESENT',
        checkInTime: '07:30',
        overtimeHours: 0,
      });
      if (rec) updated.push(rec);
    }
    return updated;
  }

  validateDailySheet(companyId: string, projectId: string, date: string, validatorName: string): AttendanceRecord[] {
    const activeWorkers = this.state.workers.filter(
      (w) => w.companyId === companyId && w.projectId === projectId && w.isActive
    );

    // S'assurer que chaque ouvrier actif a un pointage pour cette date avant clôture
    for (const w of activeWorkers) {
      const exists = this.state.attendanceRecords.find(
        (r) => r.workerId === w.id && r.projectId === projectId && r.date === date
      );
      if (!exists) {
        this.upsertAttendance({
          companyId,
          projectId,
          workerId: w.id,
          date,
          status: 'PRESENT',
          checkInTime: '07:30',
          overtimeHours: 0,
        });
      }
    }

    const dayRecords = this.getAttendanceForDate(companyId, projectId, date);
    for (const r of dayRecords) {
      r.isValidated = true;
      r.validatedBy = validatorName;
      r.updatedAt = new Date().toISOString();
    }
    return dayRecords;
  }

  getWeeklyAttendanceSummary(companyId: string, projectId: string, endDateStr: string) {
    const endDate = new Date(`${endDateStr}T12:00:00Z`);
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate.getTime() - i * 86400000);
      days.push(d.toISOString().split('T')[0]);
    }

    const workers = this.state.workers.filter((w) => w.companyId === companyId && w.projectId === projectId);
    const rows = workers.map((w) => {
      let daysWorked = 0;
      let overtimeTotal = 0;
      let totalEarnedXAF = 0;

      const dayStatuses = days.map((dateStr) => {
        const rec = this.state.attendanceRecords.find(
          (r) => r.workerId === w.id && r.projectId === projectId && r.date === dateStr
        );
        if (rec) {
          if (rec.status === 'PRESENT' || rec.status === 'LATE') daysWorked += 1;
          else if (rec.status === 'HALF_DAY') daysWorked += 0.5;
          overtimeTotal += rec.overtimeHours || 0;
          totalEarnedXAF += rec.amountEarnedXAF || 0;
        }
        return {
          date: dateStr,
          status: rec?.status || null,
          overtimeHours: rec?.overtimeHours || 0,
          amountEarnedXAF: rec?.amountEarnedXAF || 0,
          isValidated: rec?.isValidated || false,
        };
      });

      return {
        worker: w,
        dayStatuses,
        daysWorked,
        overtimeTotal,
        totalEarnedXAF,
      };
    });

    return { days, rows };
  }

  // ============================================================================
  // ÉTAPE 9 : MODULE 5 — PAIE & SALAIRES DES OUVRIERS (FCFA & MOBILE MONEY)
  // ============================================================================

  getPayrollData(companyId: string, projectId: string) {
    const payrolls = this.state.payrollRecords.filter(
      (p) => p.companyId === companyId && p.projectId === projectId
    );
    const advances = this.state.payrollAdvances.filter(
      (a) => a.companyId === companyId && a.projectId === projectId
    );
    return { payrolls, advances };
  }

  getPayrollById(payrollId: string): PayrollRecord | undefined {
    return this.state.payrollRecords.find((p) => p.id === payrollId);
  }

  syncPayrollFromAttendance(companyId: string, projectId: string, endDateStr?: string): PayrollRecord[] {
    const targetEndDate = endDateStr || new Date().toISOString().split('T')[0];
    const weekly = this.getWeeklyAttendanceSummary(companyId, projectId, targetEndDate);
    const periodLabel = 'Quinzaine en cours (Cumul 7 jours)';

    weekly.rows.forEach((row) => {
      const w = row.worker;
      const existing = this.state.payrollRecords.find(
        (p) => p.workerId === w.id && p.projectId === projectId
      );

      const hourlyRate = w.dailyRateXAF / 8;
      const overtimePayXAF = Math.round(row.overtimeTotal * hourlyRate * 1.25);
      const basePayXAF = Math.max(0, row.totalEarnedXAF - overtimePayXAF);
      const advancesDeductedXAF = this.state.payrollAdvances
        .filter((a) => a.workerId === w.id && a.projectId === projectId)
        .reduce((sum, a) => sum + a.amountXAF, 0);

      if (existing) {
        if (existing.status !== 'PAID') {
          existing.daysWorked = row.daysWorked;
          existing.overtimeHours = row.overtimeTotal;
          existing.overtimePayXAF = overtimePayXAF;
          existing.basePayXAF = basePayXAF;
          existing.advancesDeductedXAF = advancesDeductedXAF;
          existing.grossPayXAF = basePayXAF + overtimePayXAF + existing.bonusXAF;
          existing.netPayXAF = Math.max(0, existing.grossPayXAF - advancesDeductedXAF);
        }
      } else {
        const grossPayXAF = basePayXAF + overtimePayXAF;
        const netPayXAF = Math.max(0, grossPayXAF - advancesDeductedXAF);
        this.state.payrollRecords.unshift({
          id: `pay_${w.id}_${Date.now()}`,
          companyId,
          projectId,
          workerId: w.id,
          workerMatricule: w.matricule,
          workerName: w.fullName,
          specialtyLabel: w.specialtyLabel,
          phone: w.phone,
          periodLabel,
          daysWorked: row.daysWorked,
          dailyRateXAF: w.dailyRateXAF,
          basePayXAF,
          overtimeHours: row.overtimeTotal,
          overtimePayXAF,
          bonusXAF: 0,
          advancesDeductedXAF,
          grossPayXAF,
          netPayXAF,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return this.state.payrollRecords.filter(
      (p) => p.companyId === companyId && p.projectId === projectId
    );
  }

  createAdvance(input: {
    companyId: string;
    projectId: string;
    workerId: string;
    amountXAF: number;
    reason: string;
    paymentMethod: PaymentMethod;
    date?: string;
  }): PayrollAdvance | null {
    const worker = this.state.workers.find((w) => w.id === input.workerId);
    if (!worker) return null;

    const amountXAF = Math.max(500, Math.round(Number(input.amountXAF)));
    const targetPayroll = this.state.payrollRecords.find(
      (p) => p.workerId === worker.id && p.projectId === input.projectId && p.status !== 'PAID'
    );

    const advance: PayrollAdvance = {
      id: `adv_${Date.now()}`,
      companyId: input.companyId,
      projectId: input.projectId,
      workerId: worker.id,
      workerName: worker.fullName,
      amountXAF,
      date: input.date || new Date().toISOString().split('T')[0],
      reason: input.reason || 'Acompte sur salaire',
      paymentMethod: input.paymentMethod,
      deductedInPayrollId: targetPayroll?.id,
      createdAt: new Date().toISOString(),
    };
    this.state.payrollAdvances.unshift(advance);

    if (targetPayroll) {
      targetPayroll.advancesDeductedXAF += amountXAF;
      targetPayroll.netPayXAF = Math.max(0, targetPayroll.grossPayXAF - targetPayroll.advancesDeductedXAF);
    }

    return advance;
  }

  updatePayrollBonus(payrollId: string, bonusXAF: number): PayrollRecord | null {
    const rec = this.state.payrollRecords.find((p) => p.id === payrollId);
    if (!rec || rec.status === 'PAID') return null;

    rec.bonusXAF = Math.max(0, Math.round(Number(bonusXAF)));
    rec.grossPayXAF = rec.basePayXAF + rec.overtimePayXAF + rec.bonusXAF;
    rec.netPayXAF = Math.max(0, rec.grossPayXAF - rec.advancesDeductedXAF);
    return rec;
  }

  approvePayroll(payrollId: string): PayrollRecord | null {
    const rec = this.state.payrollRecords.find((p) => p.id === payrollId);
    if (!rec) return null;
    if (rec.status === 'DRAFT') rec.status = 'APPROVED';
    return rec;
  }

  approveAllPayrolls(companyId: string, projectId: string): number {
    let count = 0;
    this.state.payrollRecords.forEach((p) => {
      if (p.companyId === companyId && p.projectId === projectId && p.status === 'DRAFT') {
        p.status = 'APPROVED';
        count++;
      }
    });
    return count;
  }

  private generatePaymentRef(method: PaymentMethod): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    if (method === 'ORANGE_MONEY') return `OM-CM-${code}`;
    if (method === 'MTN_MOMO') return `MOMO-${code}`;
    if (method === 'BANK_TRANSFER') return `VIR-${code}`;
    return `CAISSE-${code}`;
  }

  payPayroll(payrollId: string, paymentMethod: PaymentMethod, paymentReference?: string): PayrollRecord | null {
    const rec = this.state.payrollRecords.find((p) => p.id === payrollId);
    if (!rec || rec.status === 'PAID') return rec || null;

    rec.status = 'PAID';
    rec.paymentMethod = paymentMethod;
    rec.paymentReference = paymentReference?.trim() || this.generatePaymentRef(paymentMethod);
    rec.paidAt = new Date().toISOString();

    // Synchroniser la dépense sur le budget consommé du chantier
    const proj = this.state.projects.find((p) => p.id === rec.projectId);
    if (proj) {
      proj.budgetSpent += rec.netPayXAF;
    }

    return rec;
  }

  payAllApproved(companyId: string, projectId: string, paymentMethod: PaymentMethod): number {
    let count = 0;
    this.state.payrollRecords.forEach((p) => {
      if (p.companyId === companyId && p.projectId === projectId && p.status === 'APPROVED') {
        this.payPayroll(p.id, paymentMethod);
        count++;
      }
    });
    return count;
  }

  // ============================================================================
  // ÉTAPE 10 : MODULE 6 — GESTION DES STOCKS DE MATÉRIAUX & DÉPÔT BTP
  // ============================================================================

  getMaterials(companyId: string): MaterialItem[] {
    return this.state.materials.filter((m) => m.companyId === companyId);
  }

  getMaterialById(id: string): MaterialItem | undefined {
    return this.state.materials.find((m) => m.id === id);
  }

  createMaterial(input: {
    companyId: string;
    reference?: string;
    designation: string;
    category: MaterialCategory;
    unit: string;
    depotLocation?: string;
    currentStock: number;
    minimumStockAlert: number;
    unitPriceXAF: number;
    supplierName: string;
  }): MaterialItem {
    const count = this.state.materials.filter((m) => m.companyId === input.companyId).length;
    const prefix = input.companyId === 'comp_sahel_02' ? 'SAH' : 'MAT';
    const now = new Date().toISOString();

    const newItem: MaterialItem = {
      id: `mat_${Date.now()}`,
      companyId: input.companyId,
      reference: input.reference?.trim() || `${prefix}-${String(count + 1).padStart(3, '0')}`,
      designation: input.designation.trim(),
      category: input.category,
      categoryLabel: CATEGORY_LABELS[input.category] || 'Matériaux BTP',
      unit: input.unit.trim() || 'Unité',
      depotLocation: input.depotLocation?.trim() || 'Dépôt Central Bassa (Douala)',
      currentStock: Math.max(0, Number(input.currentStock) || 0),
      minimumStockAlert: Math.max(1, Number(input.minimumStockAlert) || 10),
      unitPriceXAF: Math.max(0, Math.round(Number(input.unitPriceXAF) || 0)),
      supplierName: input.supplierName.trim() || 'Fournisseur Local BTP',
      lastMovementAt: now,
      createdAt: now,
    };

    this.state.materials.unshift(newItem);
    return newItem;
  }

  updateMaterialUnitPrice(materialId: string, unitPriceXAF: number): MaterialItem | null {
    const material = this.state.materials.find((m) => m.id === materialId);
    if (!material) return null;
    material.unitPriceXAF = Math.max(0, Math.round(Number(unitPriceXAF) || 0));
    material.lastMovementAt = new Date().toISOString();
    return material;
  }

  getStockMovements(companyId: string, projectId?: string): StockMovement[] {
    return this.state.stockMovements.filter(
      (mv) => mv.companyId === companyId && (!projectId || projectId === 'ALL' || mv.projectId === projectId)
    );
  }

  getStockMovementById(id: string): StockMovement | undefined {
    return this.state.stockMovements.find((mv) => mv.id === id);
  }

  recordStockMovement(input: {
    companyId: string;
    materialId: string;
    type: StockMovementType;
    quantity: number;
    unitPriceXAF?: number;
    updateCatalogPrice?: boolean;
    projectId?: string;
    operatorName?: string;
    recipientName?: string;
    notes?: string;
  }): { movement?: StockMovement; material?: MaterialItem; error?: string } {
    const material = this.state.materials.find((m) => m.id === input.materialId);
    if (!material) return { error: 'Matériau introuvable dans le catalogue.' };

    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { error: 'La quantité doit être strictement positive.' };
    }

    if (input.type === 'EXIT' && qty > material.currentStock) {
      return {
        error: `Stock insuffisant : seulement ${material.currentStock} ${material.unit} disponible(s) pour ${material.designation}.`,
      };
    }

    const project = input.projectId
      ? this.state.projects.find((p) => p.id === input.projectId)
      : undefined;

    if (input.type === 'EXIT' && !project) {
      return { error: 'Veuillez sélectionner le chantier bénéficiaire pour un bon de sortie.' };
    }

    const hasCustomPrice =
      input.unitPriceXAF !== undefined &&
      input.unitPriceXAF !== null &&
      !isNaN(Number(input.unitPriceXAF)) &&
      Number(input.unitPriceXAF) >= 0;

    const appliedUnitPrice = hasCustomPrice
      ? Math.round(Number(input.unitPriceXAF))
      : material.unitPriceXAF;

    // Calcul du nouveau stock
    if (input.type === 'ENTRY') {
      material.currentStock += qty;
    } else if (input.type === 'EXIT') {
      material.currentStock = Math.max(0, material.currentStock - qty);
    } else {
      // ADJUSTMENT : fixe ou ajuste à la quantité constatée
      material.currentStock = qty;
    }

    if (input.updateCatalogPrice && hasCustomPrice) {
      material.unitPriceXAF = appliedUnitPrice;
    }

    const now = new Date().toISOString();
    material.lastMovementAt = now;

    const totalValueXAF = Math.round(qty * appliedUnitPrice);

    // Imputation automatique au budget du chantier lors d'une sortie matériaux
    if (input.type === 'EXIT' && project) {
      project.budgetSpent += totalValueXAF;
    }

    const seq = this.state.stockMovements.length + 100;
    const prefix = input.type === 'ENTRY' ? 'BE' : input.type === 'EXIT' ? 'BS' : 'ADJ';
    const referenceDoc = `${prefix}-2026-${seq}`;

    const movement: StockMovement = {
      id: `mvt_${Date.now()}`,
      companyId: input.companyId,
      projectId: project?.id,
      projectName: project?.name,
      materialId: material.id,
      materialReference: material.reference,
      materialDesignation: material.designation,
      unit: material.unit,
      type: input.type,
      quantity: qty,
      unitPriceXAF: appliedUnitPrice,
      totalValueXAF,
      referenceDoc,
      operatorName: input.operatorName?.trim() || 'Christian Talla (Magasinier)',
      recipientName:
        input.recipientName?.trim() ||
        (input.type === 'ENTRY'
          ? material.supplierName
          : project?.managerName || 'Conducteur de travaux'),
      notes: input.notes?.trim() || '',
      createdAt: now,
    };

    this.state.stockMovements.unshift(movement);
    return { movement, material };
  }

  // ============================================================================
  // ÉTAPE 11 : MODULE 7 — BONS DE COMMANDE & CIRCUIT D'APPROBATION DG
  // ============================================================================

  getPurchaseOrders(companyId: string, projectId?: string, status?: string): PurchaseOrder[] {
    return this.state.purchaseOrders.filter((po) => {
      if (po.companyId !== companyId) return false;
      if (projectId && projectId !== 'ALL' && po.projectId !== projectId) return false;
      if (status && status !== 'ALL' && po.status !== status) return false;
      return true;
    });
  }

  getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.state.purchaseOrders.find((po) => po.id === id);
  }

  private recomputePurchaseOrderTotals(po: PurchaseOrder) {
    po.items.forEach((it) => {
      it.totalLineXAF = Math.round(it.quantity * it.unitPriceXAF);
    });
    po.subtotalXAF = po.items.reduce((sum, it) => sum + it.totalLineXAF, 0);
    po.tvaXAF = po.includeTVA ? Math.round(po.subtotalXAF * 0.1925) : 0;
    po.totalAmountXAF = po.subtotalXAF + po.tvaXAF;
    po.updatedAt = new Date().toISOString();
  }

  createPurchaseOrder(input: {
    companyId: string;
    projectId: string;
    supplierName: string;
    supplierContact?: string;
    supplierPhone?: string;
    requestedByName: string;
    requestedByRole: UserRole;
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    includeTVA?: boolean;
    submitImmediately?: boolean;
    notes?: string;
    items: {
      materialId?: string;
      designation: string;
      unit: string;
      quantity: number;
      unitPriceXAF: number;
    }[];
  }): { order?: PurchaseOrder; error?: string } {
    const project = this.state.projects.find((p) => p.id === input.projectId);
    if (!project) return { error: 'Chantier introuvable.' };

    if (!input.supplierName?.trim()) return { error: 'Nom du fournisseur obligatoire.' };
    if (!input.items || input.items.length === 0) {
      return { error: 'Ajoutez au moins une ligne de matériau au bon de commande.' };
    }

    const mappedItems: PurchaseOrderItem[] = input.items.map((it, idx) => {
      const qty = Math.max(0.01, Number(it.quantity) || 0);
      const pu = Math.max(0, Math.round(Number(it.unitPriceXAF) || 0));
      return {
        id: `poi_${Date.now()}_${idx}`,
        materialId: it.materialId,
        designation: it.designation.trim(),
        unit: it.unit.trim() || 'Unité',
        quantity: qty,
        unitPriceXAF: pu,
        totalLineXAF: Math.round(qty * pu),
      };
    });

    const companyCount = this.state.purchaseOrders.filter((p) => p.companyId === input.companyId).length;
    const cityCode = project.city.substring(0, 3).toUpperCase() || 'DLA';
    const orderNumber = `BC-2026-${cityCode}-${String(companyCount + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newOrder: PurchaseOrder = {
      id: `po_${Date.now()}`,
      companyId: input.companyId,
      orderNumber,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      supplierName: input.supplierName.trim(),
      supplierContact: input.supplierContact?.trim() || '',
      supplierPhone: input.supplierPhone?.trim() || '',
      requestedByName: input.requestedByName,
      requestedByRole: input.requestedByRole,
      expectedDeliveryDate:
        input.expectedDeliveryDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      paymentTerms: input.paymentTerms || 'Chèque à réception',
      includeTVA: Boolean(input.includeTVA),
      subtotalXAF: 0,
      tvaXAF: 0,
      totalAmountXAF: 0,
      status: input.submitImmediately ? 'PENDING_APPROVAL' : 'DRAFT',
      items: mappedItems,
      notes: input.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    this.recomputePurchaseOrderTotals(newOrder);
    this.state.purchaseOrders.unshift(newOrder);
    return { order: newOrder };
  }

  submitPurchaseOrder(id: string): PurchaseOrder | null {
    const po = this.state.purchaseOrders.find((p) => p.id === id);
    if (!po) return null;
    if (po.status === 'DRAFT' || po.status === 'REJECTED') {
      po.status = 'PENDING_APPROVAL';
      po.rejectionReason = undefined;
      po.updatedAt = new Date().toISOString();
    }
    return po;
  }

  approvePurchaseOrder(id: string, approverName: string): PurchaseOrder | null {
    const po = this.state.purchaseOrders.find((p) => p.id === id);
    if (!po) return null;
    po.status = 'APPROVED';
    po.approvedByName = approverName;
    po.approvedAt = new Date().toISOString();
    po.rejectionReason = undefined;
    po.updatedAt = new Date().toISOString();
    return po;
  }

  rejectPurchaseOrder(id: string, reason: string, reviewerName: string): PurchaseOrder | null {
    const po = this.state.purchaseOrders.find((p) => p.id === id);
    if (!po) return null;
    po.status = 'REJECTED';
    po.rejectionReason = reason.trim() || 'Refusé par la Direction Générale';
    po.approvedByName = reviewerName;
    po.updatedAt = new Date().toISOString();
    return po;
  }

  sendPurchaseOrderToSupplier(id: string): PurchaseOrder | null {
    const po = this.state.purchaseOrders.find((p) => p.id === id);
    if (!po || po.status !== 'APPROVED') return null;
    po.status = 'ORDERED';
    po.updatedAt = new Date().toISOString();
    return po;
  }

  updatePurchaseOrderPrices(
    id: string,
    lineUpdates: { id: string; unitPriceXAF: number }[]
  ): PurchaseOrder | null {
    const po = this.state.purchaseOrders.find((p) => p.id === id);
    if (!po || po.status === 'ORDERED' || po.status === 'DELIVERED') return null;

    lineUpdates.forEach((upd) => {
      const item = po.items.find((i) => i.id === upd.id);
      if (item) {
        item.unitPriceXAF = Math.max(0, Math.round(Number(upd.unitPriceXAF) || 0));
      }
    });

    this.recomputePurchaseOrderTotals(po);
    return po;
  }

  // ============================================================================
  // ÉTAPE 12 : MODULE 8 — BONS DE LIVRAISON & RÉCEPTION CHANTIER / DÉPÔT
  // ============================================================================

  getDeliveryNotes(companyId: string, projectId?: string, status?: string): DeliveryNote[] {
    return this.state.deliveryNotes.filter((dn) => {
      if (dn.companyId !== companyId) return false;
      if (projectId && projectId !== 'ALL' && dn.projectId !== projectId) return false;
      if (status && status !== 'ALL' && dn.status !== status) return false;
      return true;
    });
  }

  getDeliveryNoteById(id: string): DeliveryNote | undefined {
    return this.state.deliveryNotes.find((dn) => dn.id === id);
  }

  getDeliveredQuantitiesByPoItem(purchaseOrderId: string): Record<string, number> {
    const totals: Record<string, number> = {};
    this.state.deliveryNotes
      .filter((dn) => dn.purchaseOrderId === purchaseOrderId)
      .forEach((dn) => {
        dn.items.forEach((it) => {
          totals[it.purchaseOrderItemId] = (totals[it.purchaseOrderItemId] || 0) + it.deliveredQuantity;
        });
      });
    return totals;
  }

  getEligibleOrdersForDelivery(companyId: string) {
    return this.state.purchaseOrders
      .filter(
        (po) =>
          po.companyId === companyId &&
          (po.status === 'APPROVED' || po.status === 'ORDERED')
      )
      .map((po) => {
        const deliveredMap = this.getDeliveredQuantitiesByPoItem(po.id);
        const enrichedItems = po.items.map((item) => {
          const alreadyDelivered = deliveredMap[item.id] || 0;
          const remaining = Math.max(0, item.quantity - alreadyDelivered);
          return {
            ...item,
            alreadyDeliveredQuantity: alreadyDelivered,
            remainingQuantity: remaining,
          };
        });
        const totalRemainingUnits = enrichedItems.reduce((s, it) => s + it.remainingQuantity, 0);
        return {
          ...po,
          items: enrichedItems,
          totalRemainingUnits,
        };
      })
      .filter((po) => po.totalRemainingUnits > 0);
  }

  createDeliveryNote(input: {
    companyId: string;
    purchaseOrderId: string;
    supplierBlReference: string;
    destination: DeliveryDestination;
    receivedByName: string;
    receivedByRole: UserRole;
    driverName?: string;
    truckPlate?: string;
    deliveryDate?: string;
    observations?: string;
    items: {
      purchaseOrderItemId: string;
      deliveredQuantity: number;
      damagedOrRejectedQuantity?: number;
      conformityNote?: string;
    }[];
  }): { delivery?: DeliveryNote; stockMovementsCreated: number; error?: string } {
    const po = this.state.purchaseOrders.find(
      (p) => p.id === input.purchaseOrderId && p.companyId === input.companyId
    );
    if (!po) {
      return { error: 'Bon de commande introuvable pour cette entreprise.', stockMovementsCreated: 0 };
    }

    if (po.status !== 'APPROVED' && po.status !== 'ORDERED') {
      return {
        error: `Ce bon de commande (${po.orderNumber}) n'est pas éligible à la réception (statut actuel : ${po.status}).`,
        stockMovementsCreated: 0,
      };
    }

    if (!input.items || input.items.length === 0) {
      return { error: 'Veuillez renseigner les quantités réceptionnées.', stockMovementsCreated: 0 };
    }

    const prevMap = this.getDeliveredQuantitiesByPoItem(po.id);
    const dnItems: DeliveryNoteItem[] = [];
    let hasPositiveQty = false;
    let hasDispute = false;

    for (const poItem of po.items) {
      const submitted = input.items.find((x) => x.purchaseOrderItemId === poItem.id);
      const deliveredQty = Math.max(0, Number(submitted?.deliveredQuantity || 0));
      const damagedQty = Math.max(0, Number(submitted?.damagedOrRejectedQuantity || 0));
      const prevDelivered = prevMap[poItem.id] || 0;
      const remaining = Math.max(0, poItem.quantity - prevDelivered);

      if (deliveredQty > remaining) {
        return {
          error: `Quantité reçue (${deliveredQty}) supérieure au reliquat restant (${remaining} ${poItem.unit}) pour « ${poItem.designation} ».`,
          stockMovementsCreated: 0,
        };
      }

      if (deliveredQty > 0 || damagedQty > 0) {
        hasPositiveQty = true;
      }
      if (damagedQty > 0) {
        hasDispute = true;
      }

      dnItems.push({
        id: `dni_${Date.now()}_${dnItems.length + 1}`,
        purchaseOrderItemId: poItem.id,
        materialId: poItem.materialId,
        designation: poItem.designation,
        unit: poItem.unit,
        orderedQuantity: poItem.quantity,
        previouslyDeliveredQuantity: prevDelivered,
        deliveredQuantity: deliveredQty,
        damagedOrRejectedQuantity: damagedQty,
        unitPriceXAF: poItem.unitPriceXAF,
        totalValueXAF: Math.round(deliveredQty * poItem.unitPriceXAF),
        conformityNote: submitted?.conformityNote?.trim() || '',
      });
    }

    if (!hasPositiveQty) {
      return {
        error: 'Saisissez au moins une quantité réceptionnée ou avarie constatée.',
        stockMovementsCreated: 0,
      };
    }

    // Vérifier si le bon de commande est intégralement soldé après ce BL
    const allLinesFullyDelivered = dnItems.every(
      (it) => it.previouslyDeliveredQuantity + it.deliveredQuantity >= it.orderedQuantity
    );

    const status: DeliveryStatus = hasDispute
      ? 'DISPUTED'
      : allLinesFullyDelivered
        ? 'COMPLETED'
        : 'PARTIAL';

    const companyCount = this.state.deliveryNotes.filter((d) => d.companyId === input.companyId).length;
    const cityCode = po.projectCode.split('-')[2] || 'DLA';
    const deliveryNumber = `BL-2026-${cityCode}-${String(companyCount + 1).padStart(3, '0')}`;
    const totalValueXAF = dnItems.reduce((sum, it) => sum + it.totalValueXAF, 0);
    const now = new Date().toISOString();

    let stockMovementsCreated = 0;

    // Synchronisation automatique Stock Dépôt (Étape 10) ou Budget Chantier
    if (input.destination === 'DEPOT') {
      for (const item of dnItems) {
        if (item.materialId && item.deliveredQuantity > 0) {
          const mvResult = this.recordStockMovement({
            companyId: input.companyId,
            materialId: item.materialId,
            type: 'ENTRY',
            quantity: item.deliveredQuantity,
            unitPriceXAF: item.unitPriceXAF,
            projectId: po.projectId,
            operatorName: input.receivedByName,
            recipientName: po.supplierName,
            notes: `Entrée automatique BL ${deliveryNumber} / BC ${po.orderNumber}`,
          });
          if (mvResult.movement) {
            stockMovementsCreated++;
          }
        }
      }
    } else {
      // Livraison directe chantier : imputation directe sur le budget consommé du chantier
      const project = this.state.projects.find((p) => p.id === po.projectId);
      if (project) {
        project.budgetSpent += totalValueXAF;
      }
    }

    // Mise à jour du statut du Bon de Commande lié
    if (allLinesFullyDelivered) {
      po.status = 'DELIVERED';
    } else if (po.status === 'APPROVED') {
      po.status = 'ORDERED';
    }
    po.updatedAt = now;

    const newDelivery: DeliveryNote = {
      id: `dn_${Date.now()}`,
      companyId: input.companyId,
      deliveryNumber,
      supplierBlReference: input.supplierBlReference?.trim() || `F-${deliveryNumber}`,
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.orderNumber,
      projectId: po.projectId,
      projectCode: po.projectCode,
      projectName: po.projectName,
      supplierName: po.supplierName,
      destination: input.destination,
      receivedByName: input.receivedByName,
      receivedByRole: input.receivedByRole,
      driverName: input.driverName?.trim() || '',
      truckPlate: input.truckPlate?.trim().toUpperCase() || '',
      deliveryDate: input.deliveryDate || now.split('T')[0],
      status,
      totalValueXAF,
      stockSynced: input.destination === 'DEPOT' && stockMovementsCreated > 0,
      items: dnItems,
      observations: input.observations?.trim() || '',
      createdAt: now,
    };

    this.state.deliveryNotes.unshift(newDelivery);
    return { delivery: newDelivery, stockMovementsCreated };
  }

  resolveDeliveryDispute(id: string, resolvedNote: string): DeliveryNote | null {
    const dn = this.state.deliveryNotes.find((d) => d.id === id);
    if (!dn) return null;

    const po = this.state.purchaseOrders.find((p) => p.id === dn.purchaseOrderId);
    const deliveredMap = po ? this.getDeliveredQuantitiesByPoItem(po.id) : {};
    const isPoComplete = po
      ? po.items.every((it) => (deliveredMap[it.id] || 0) >= it.quantity)
      : false;

    dn.status = isPoComplete ? 'COMPLETED' : 'PARTIAL';
    dn.resolvedNote = resolvedNote.trim() || 'Litige clos avec le fournisseur (avoir / échange validé).';
    return dn;
  }

  // ============================================================================
  // ÉTAPE 13 : MODULE 9 — DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER
  // ============================================================================

  getExpenses(
    companyId: string,
    projectId?: string,
    category?: string,
    status?: string
  ): ExpenseRecord[] {
    return this.state.expenses.filter((exp) => {
      if (exp.companyId !== companyId) return false;
      if (projectId && projectId !== 'ALL' && exp.projectId !== projectId) return false;
      if (category && category !== 'ALL' && exp.category !== category) return false;
      if (status && status !== 'ALL' && exp.status !== status) return false;
      return true;
    });
  }

  getExpenseById(id: string): ExpenseRecord | undefined {
    return this.state.expenses.find((e) => e.id === id);
  }

  getBudgetOverview(companyId: string, projectId: string = 'ALL') {
    const allProjects = this.state.projects.filter((p) => p.companyId === companyId);
    const scopedProjects =
      projectId !== 'ALL' ? allProjects.filter((p) => p.id === projectId) : allProjects;

    const projectSummaries = scopedProjects.map((p) => {
      const rate = p.budgetTotal > 0 ? Math.round((p.budgetSpent / p.budgetTotal) * 100) : 0;
      const alertLevel: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED' =
        rate >= 100 ? 'EXCEEDED' : rate >= 85 ? 'CRITICAL' : rate >= 70 ? 'WARNING' : 'HEALTHY';
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        city: p.city,
        budgetTotal: p.budgetTotal,
        budgetSpent: p.budgetSpent,
        remaining: Math.max(0, p.budgetTotal - p.budgetSpent),
        overrunXAF: Math.max(0, p.budgetSpent - p.budgetTotal),
        rate,
        alertLevel,
      };
    });

    // Calcul des lignes budgétaires par poste (Prévu vs Réalisé réel agrégé)
    const scopedIds = new Set(scopedProjects.map((p) => p.id));
    const linesForScope = this.state.budgetLines.filter(
      (bl) => bl.companyId === companyId && scopedIds.has(bl.projectId)
    );

    const categories: ExpenseCategory[] = [
      'MATERIAUX',
      'MAIN_OEUVRE',
      'ENGINS_CARBURANT',
      'SOUS_TRAITANCE',
      'FRAIS_CHANTIER',
      'DIVERS',
    ];

    // Agrégation du réalisé par poste :
    // - MATERIAUX = Sorties stock (Étape 10) + Livraisons directes (Étape 12) + Dépenses MATERIAUX
    // - MAIN_OEUVRE = Paies payées (Étape 9) + Dépenses MAIN_OEUVRE
    // - Autres postes = Dépenses APPROVED ou PAID de la catégorie
    const stockExitsXAF = this.state.stockMovements
      .filter((m) => m.companyId === companyId && m.type === 'EXIT' && m.projectId && scopedIds.has(m.projectId))
      .reduce((s, m) => s + m.totalValueXAF, 0);

    const directDeliveriesXAF = this.state.deliveryNotes
      .filter((d) => d.companyId === companyId && d.destination === 'DIRECT_SITE' && scopedIds.has(d.projectId))
      .reduce((s, d) => s + d.totalValueXAF, 0);

    const paidPayrollXAF = this.state.payrollRecords
      .filter((p) => p.companyId === companyId && p.status === 'PAID' && scopedIds.has(p.projectId))
      .reduce((s, p) => s + p.netPayXAF, 0);

    const categoryRows = categories
      .map((cat) => {
        const matchingLines = linesForScope.filter((l) => l.category === cat);
        const allocatedXAF = matchingLines.reduce((s, l) => s + l.allocatedBudgetXAF, 0);

        const directExpensesXAF = this.state.expenses
          .filter(
            (e) =>
              e.companyId === companyId &&
              scopedIds.has(e.projectId) &&
              e.category === cat &&
              (e.status === 'PAID' || e.status === 'APPROVED')
          )
          .reduce((s, e) => s + e.amountXAF, 0);

        let spentXAF = directExpensesXAF;
        if (cat === 'MATERIAUX') {
          spentXAF += stockExitsXAF + directDeliveriesXAF;
        } else if (cat === 'MAIN_OEUVRE') {
          spentXAF += paidPayrollXAF;
        }

        // Complément historique initial déjà présent sur budgetSpent des projets seedés
        const rate = allocatedXAF > 0 ? Math.round((spentXAF / allocatedXAF) * 100) : spentXAF > 0 ? 100 : 0;

        return {
          lineId: matchingLines.length === 1 ? matchingLines[0].id : undefined,
          category: cat,
          categoryLabel: EXPENSE_CATEGORY_LABELS[cat],
          allocatedXAF,
          spentXAF,
          remainingXAF: allocatedXAF - spentXAF,
          rate,
        };
      })
      .filter((row) => row.allocatedXAF > 0 || row.spentXAF > 0);

    const totalBudgetXAF = projectSummaries.reduce((s, p) => s + p.budgetTotal, 0);
    const totalSpentXAF = projectSummaries.reduce((s, p) => s + p.budgetSpent, 0);
    const totalRemainingXAF = Math.max(0, totalBudgetXAF - totalSpentXAF);
    const globalRate = totalBudgetXAF > 0 ? Math.round((totalSpentXAF / totalBudgetXAF) * 100) : 0;

    return {
      projectSummaries,
      categoryRows,
      totals: {
        totalBudgetXAF,
        totalSpentXAF,
        totalRemainingXAF,
        globalRate,
      },
      sourcesBreakdown: {
        stockExitsXAF,
        directDeliveriesXAF,
        paidPayrollXAF,
        manualExpensesPaidOrApprovedXAF: this.state.expenses
          .filter(
            (e) =>
              e.companyId === companyId &&
              scopedIds.has(e.projectId) &&
              (e.status === 'PAID' || e.status === 'APPROVED')
          )
          .reduce((s, e) => s + e.amountXAF, 0),
      },
    };
  }

  createExpense(input: {
    companyId: string;
    projectId: string;
    category: ExpenseCategory;
    title: string;
    beneficiary: string;
    amountXAF: number;
    paymentMethod: PaymentMethod;
    invoiceRef?: string;
    expenseDate?: string;
    recordedByName: string;
    notes?: string;
  }): { expense?: ExpenseRecord; error?: string } {
    const project = this.state.projects.find(
      (p) => p.id === input.projectId && p.companyId === input.companyId
    );
    if (!project) return { error: 'Chantier introuvable pour cette entreprise.' };

    const amount = Math.round(Number(input.amountXAF));
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Veuillez saisir manuellement un montant strictement positif en FCFA.' };
    }

    if (!input.title?.trim() || !input.beneficiary?.trim()) {
      return { error: 'Libellé et bénéficiaire obligatoires.' };
    }

    const companyCount = this.state.expenses.filter((e) => e.companyId === input.companyId).length;
    const cityCode = project.code.split('-')[2] || 'DLA';
    const reference = `DEP-2026-${cityCode}-${String(companyCount + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newExpense: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      companyId: input.companyId,
      reference,
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      category: input.category,
      categoryLabel: EXPENSE_CATEGORY_LABELS[input.category] || 'Divers',
      title: input.title.trim(),
      beneficiary: input.beneficiary.trim(),
      amountXAF: amount,
      paymentMethod: input.paymentMethod || 'CASH',
      invoiceRef: input.invoiceRef?.trim() || '',
      expenseDate: input.expenseDate || now.split('T')[0],
      status: 'PENDING',
      recordedByName: input.recordedByName,
      notes: input.notes?.trim() || '',
      createdAt: now,
    };

    this.state.expenses.unshift(newExpense);
    return { expense: newExpense };
  }

  approveExpense(id: string, approverName: string): ExpenseRecord | null {
    const exp = this.state.expenses.find((e) => e.id === id);
    if (!exp || exp.status !== 'PENDING') return null;
    exp.status = 'APPROVED';
    exp.approvedByName = approverName;
    return exp;
  }

  rejectExpense(id: string, approverName: string, reason?: string): ExpenseRecord | null {
    const exp = this.state.expenses.find((e) => e.id === id);
    if (!exp || exp.status === 'PAID') return null;
    exp.status = 'REJECTED';
    exp.approvedByName = approverName;
    if (reason?.trim()) {
      exp.notes = `${exp.notes ? exp.notes + ' · ' : ''}Refus : ${reason.trim()}`;
    }
    return exp;
  }

  payExpense(
    id: string,
    paymentMethod: PaymentMethod,
    paymentReference?: string,
    payerName?: string
  ): ExpenseRecord | null {
    const exp = this.state.expenses.find((e) => e.id === id);
    if (!exp || exp.status === 'PAID' || exp.status === 'REJECTED') return null;

    exp.status = 'PAID';
    exp.paymentMethod = paymentMethod;
    exp.paymentReference = paymentReference?.trim() || this.generatePaymentRef(paymentMethod);
    if (!exp.approvedByName && payerName) {
      exp.approvedByName = payerName;
    }

    // Imputation réelle sur le budget consommé du chantier
    const project = this.state.projects.find((p) => p.id === exp.projectId);
    if (project) {
      project.budgetSpent += exp.amountXAF;
    }

    return exp;
  }

  updateBudgetLine(lineId: string, allocatedBudgetXAF: number): ProjectBudgetLine | null {
    const line = this.state.budgetLines.find((l) => l.id === lineId);
    if (!line) return null;
    line.allocatedBudgetXAF = Math.max(0, Math.round(Number(allocatedBudgetXAF) || 0));
    return line;
  }

  // ============================================================================
  // ÉTAPE 16 : MODULE 12 — NOTIFICATIONS & ALERTES MÉTIER BTP
  // ============================================================================

  private formatXafAscii(n: number): string {
    return Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private getActiveChannelsForCompany(prefs: NotificationPreferences, severity: NotificationSeverity): NotificationChannel[] {
    const ch: NotificationChannel[] = [];
    if (prefs.channels.inApp) ch.push('IN_APP');
    if (prefs.channels.whatsapp && (severity === 'CRITICAL' || severity === 'HIGH')) ch.push('WHATSAPP');
    if (prefs.channels.sms && severity === 'CRITICAL') ch.push('SMS');
    if (prefs.channels.email) ch.push('EMAIL');
    if (ch.length === 0) ch.push('IN_APP');
    return ch;
  }

  getNotificationPreferences(companyId: string): NotificationPreferences {
    let prefs = this.state.notificationPreferences.find((p) => p.companyId === companyId);
    if (!prefs) {
      const comp = this.getCompanyById(companyId);
      prefs = {
        companyId,
        enableCriticalStockAlerts: true,
        enableDgApprovalAlerts: true,
        enableDeliveryDisputeAlerts: true,
        enableBudgetThresholdAlerts: true,
        enablePayrollAlerts: true,
        channels: {
          inApp: true,
          whatsapp: true,
          sms: false,
          email: true,
        },
        whatsappNumber: '+237 690 00 00 00',
        digestEmail: comp ? `direction@${comp.slug}.cm` : 'direction@bati-pilot.cm',
      };
      this.state.notificationPreferences.push(prefs);
    }
    return prefs;
  }

  updateNotificationPreferences(
    companyId: string,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const prefs = this.getNotificationPreferences(companyId);
    if (typeof updates.enableCriticalStockAlerts === 'boolean') {
      prefs.enableCriticalStockAlerts = updates.enableCriticalStockAlerts;
    }
    if (typeof updates.enableDgApprovalAlerts === 'boolean') {
      prefs.enableDgApprovalAlerts = updates.enableDgApprovalAlerts;
    }
    if (typeof updates.enableDeliveryDisputeAlerts === 'boolean') {
      prefs.enableDeliveryDisputeAlerts = updates.enableDeliveryDisputeAlerts;
    }
    if (typeof updates.enableBudgetThresholdAlerts === 'boolean') {
      prefs.enableBudgetThresholdAlerts = updates.enableBudgetThresholdAlerts;
    }
    if (typeof updates.enablePayrollAlerts === 'boolean') {
      prefs.enablePayrollAlerts = updates.enablePayrollAlerts;
    }
    if (updates.channels) {
      prefs.channels = {
        inApp: updates.channels.inApp ?? prefs.channels.inApp,
        whatsapp: updates.channels.whatsapp ?? prefs.channels.whatsapp,
        sms: updates.channels.sms ?? prefs.channels.sms,
        email: updates.channels.email ?? prefs.channels.email,
      };
    }
    if (typeof updates.whatsappNumber === 'string') {
      prefs.whatsappNumber = updates.whatsappNumber.trim();
    }
    if (typeof updates.digestEmail === 'string') {
      prefs.digestEmail = updates.digestEmail.trim();
    }
    return prefs;
  }

  syncDynamicNotifications(companyId: string): BtpNotification[] {
    const prefs = this.getNotificationPreferences(companyId);
    const existingDynamicMap = new Map<string, BtpNotification>();
    this.state.notifications
      .filter((n) => n.companyId === companyId && n.isDynamic)
      .forEach((n) => existingDynamicMap.set(n.id, n));

    const generated: BtpNotification[] = [];
    const nowIso = new Date().toISOString();

    const mergeWithState = (candidate: Omit<BtpNotification, 'isRead' | 'isArchived' | 'createdAt'>): BtpNotification => {
      const prev = existingDynamicMap.get(candidate.id);
      return {
        ...candidate,
        isRead: prev ? prev.isRead : false,
        isArchived: prev ? prev.isArchived : false,
        createdAt: prev ? prev.createdAt : nowIso,
      };
    };

    // 1. Alertes Stocks Critiques / Rupture (Étape 10)
    if (prefs.enableCriticalStockAlerts) {
      this.state.materials
        .filter((m) => m.companyId === companyId && m.currentStock <= m.minimumStockAlert)
        .forEach((m) => {
          const isZero = m.currentStock <= 0;
          const severity: NotificationSeverity = isZero ? 'CRITICAL' : 'HIGH';
          generated.push(
            mergeWithState({
              id: `dyn_stock_${m.id}`,
              companyId,
              category: 'STOCK',
              severity,
              title: isZero
                ? `Rupture totale de stock : ${m.designation}`
                : `Stock critique (${m.currentStock} ${m.unit}) : ${m.designation}`,
              message: `Seuil d'alerte fixé à ${m.minimumStockAlert} ${m.unit} (${m.depotLocation}). Émettre un Bon de Commande ou un réapprovisionnement immédiat.`,
              targetRoles: ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER'],
              actionTargetStep: 'step10',
              actionLabel: 'Ouvrir Stocks (Étape 10)',
              channelsSent: this.getActiveChannelsForCompany(prefs, severity),
              isDynamic: true,
            })
          );
        });
    }

    // 2. Alertes Bons de Commande en attente de Visa DG (Étape 11)
    if (prefs.enableDgApprovalAlerts) {
      this.state.purchaseOrders
        .filter((po) => po.companyId === companyId && po.status === 'PENDING_APPROVAL')
        .forEach((po) => {
          const severity: NotificationSeverity = po.totalAmountXAF >= 2500000 ? 'CRITICAL' : 'HIGH';
          generated.push(
            mergeWithState({
              id: `dyn_po_${po.id}`,
              companyId,
              category: 'ACHATS_DG',
              severity,
              title: `Visa DG requis — ${po.orderNumber} (${this.formatXafAscii(po.totalAmountXAF)} FCFA)`,
              message: `Fournisseur : ${po.supplierName}. Demande soumise par ${po.requestedByName} pour livraison prévue le ${po.expectedDeliveryDate}.`,
              projectCode: po.projectCode,
              projectName: po.projectName,
              targetRoles: ['DIRECTOR', 'SITE_MANAGER', 'ACCOUNTANT'],
              actionTargetStep: 'step11',
              actionLabel: 'Valider BC (Étape 11)',
              channelsSent: this.getActiveChannelsForCompany(prefs, severity),
              isDynamic: true,
            })
          );
        });
    }

    // 3. Alertes Bons de Livraison avec Litige / Écart (Étape 12)
    if (prefs.enableDeliveryDisputeAlerts) {
      this.state.deliveryNotes
        .filter((dn) => dn.companyId === companyId && dn.status === 'DISPUTED')
        .forEach((dn) => {
          const severity: NotificationSeverity = 'CRITICAL';
          generated.push(
            mergeWithState({
              id: `dyn_dn_${dn.id}`,
              companyId,
              category: 'LIVRAISON_LITIGE',
              severity,
              title: `Litige Réception BL ${dn.deliveryNumber} — ${dn.supplierName}`,
              message: dn.observations
                ? `Anomalie signalée : ${dn.observations}. Arbitrage Magasinier / DG requis avant règlement.`
                : `Écart détecté lors du contrôle quantité à la livraison (${dn.receivedByName}).`,
              projectCode: dn.projectCode,
              projectName: dn.projectName,
              targetRoles: ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER'],
              actionTargetStep: 'step12',
              actionLabel: 'Régulariser BL (Étape 12)',
              channelsSent: this.getActiveChannelsForCompany(prefs, severity),
              isDynamic: true,
            })
          );
        });
    }

    // 4. Alertes Budgets Chantiers & Dépenses à décaisser (Étape 13)
    if (prefs.enableBudgetThresholdAlerts) {
      this.state.projects
        .filter((p) => p.companyId === companyId && p.budgetTotal > 0)
        .forEach((p) => {
          const rate = Math.round((p.budgetSpent / p.budgetTotal) * 100);
          if (rate >= 70) {
            const severity: NotificationSeverity = rate >= 85 ? 'CRITICAL' : 'MEDIUM';
            generated.push(
              mergeWithState({
                id: `dyn_budget_${p.id}`,
                companyId,
                category: 'BUDGET',
                severity,
                title:
                  rate >= 100
                    ? `Dépassement budgétaire (${rate}%) — ${p.code}`
                    : `Seuil de vigilance budgétaire (${rate}%) — ${p.name}`,
                message: `Réalisé : ${this.formatXafAscii(p.budgetSpent)} FCFA sur une enveloppe globale de ${this.formatXafAscii(p.budgetTotal)} FCFA.`,
                projectCode: p.code,
                projectName: p.name,
                targetRoles: ['DIRECTOR', 'ACCOUNTANT', 'SITE_MANAGER'],
                actionTargetStep: 'step13',
                actionLabel: 'Contrôler Budget (Étape 13)',
                channelsSent: this.getActiveChannelsForCompany(prefs, severity),
                isDynamic: true,
              })
            );
          }
        });

      this.state.expenses
        .filter((e) => e.companyId === companyId && (e.status === 'PENDING' || e.status === 'APPROVED'))
        .forEach((e) => {
          const severity: NotificationSeverity = e.amountXAF >= 1000000 ? 'HIGH' : 'MEDIUM';
          generated.push(
            mergeWithState({
              id: `dyn_exp_${e.id}`,
              companyId,
              category: 'BUDGET',
              severity,
              title:
                e.status === 'PENDING'
                  ? `Dépense à approuver (${this.formatXafAscii(e.amountXAF)} FCFA) — ${e.reference}`
                  : `Bon à payer en attente de décaissement (${this.formatXafAscii(e.amountXAF)} FCFA)`,
              message: `${e.title} (${e.beneficiary}). Saisie par ${e.recordedByName}.`,
              projectCode: e.projectCode,
              projectName: e.projectName,
              targetRoles: ['DIRECTOR', 'ACCOUNTANT'],
              actionTargetStep: 'step13',
              actionLabel: 'Traiter Dépense (Étape 13)',
              channelsSent: this.getActiveChannelsForCompany(prefs, severity),
              isDynamic: true,
            })
          );
        });
    }

    // 5. Alertes Paies en attente de validation / paiement (Étape 9)
    if (prefs.enablePayrollAlerts) {
      const unpaidByProject = new Map<string, PayrollRecord[]>();
      this.state.payrollRecords
        .filter((pr) => pr.companyId === companyId && pr.status !== 'PAID')
        .forEach((pr) => {
          const list = unpaidByProject.get(pr.projectId) || [];
          list.push(pr);
          unpaidByProject.set(pr.projectId, list);
        });

      unpaidByProject.forEach((list, projId) => {
        const proj = this.state.projects.find((p) => p.id === projId);
        const totalNet = list.reduce((s, item) => s + item.netPayXAF, 0);
        const hasApproved = list.some((item) => item.status === 'APPROVED');
        const severity: NotificationSeverity = hasApproved ? 'HIGH' : 'MEDIUM';
        generated.push(
          mergeWithState({
            id: `dyn_payroll_${projId}`,
            companyId,
            category: 'RH_PAIE',
            severity,
            title: `${list.length} fiche(s) de paie en attente — ${this.formatXafAscii(totalNet)} FCFA`,
            message: hasApproved
              ? `Bulletins approuvés prêts pour versement Orange Money / MTN MoMo / Espèces sur le chantier.`
              : `Bulletins calculés en attente de visa de paiement pour les ouvriers du chantier.`,
            projectCode: proj?.code,
            projectName: proj?.name,
            targetRoles: ['DIRECTOR', 'ACCOUNTANT', 'SITE_MANAGER'],
            actionTargetStep: 'step9',
            actionLabel: 'Ouvrir Paie (Étape 9)',
            channelsSent: this.getActiveChannelsForCompany(prefs, severity),
            isDynamic: true,
          })
        );
      });
    }

    // Remplacer uniquement les notifications dynamiques de l'entreprise tout en conservant les manuelles
    this.state.notifications = [
      ...this.state.notifications.filter((n) => !(n.companyId === companyId && n.isDynamic)),
      ...generated,
    ];

    return this.state.notifications.filter((n) => n.companyId === companyId);
  }

  getNotificationsOverview(companyId: string, userRole?: UserRole, onlyMyRole: boolean = false) {
    const prefs = this.getNotificationPreferences(companyId);
    const synced = this.syncDynamicNotifications(companyId).filter((n) => !n.isArchived);

    const severityWeight: Record<NotificationSeverity, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      INFO: 1,
    };

    const roleFiltered =
      onlyMyRole && userRole
        ? synced.filter((n) => n.targetRoles.includes(userRole) || userRole === 'SUPER_ADMIN')
        : synced;

    const sorted = [...roleFiltered].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      const diffSev = severityWeight[b.severity] - severityWeight[a.severity];
      if (diffSev !== 0) return diffSev;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const unreadCount = roleFiltered.filter((n) => !n.isRead).length;
    const criticalCount = roleFiltered.filter((n) => n.severity === 'CRITICAL').length;
    const highCount = roleFiltered.filter((n) => n.severity === 'HIGH').length;
    const dynamicActionCount = roleFiltered.filter((n) => n.isDynamic).length;

    const categoryCounts: Record<NotificationCategory, number> = {
      STOCK: roleFiltered.filter((n) => n.category === 'STOCK').length,
      ACHATS_DG: roleFiltered.filter((n) => n.category === 'ACHATS_DG').length,
      LIVRAISON_LITIGE: roleFiltered.filter((n) => n.category === 'LIVRAISON_LITIGE').length,
      BUDGET: roleFiltered.filter((n) => n.category === 'BUDGET').length,
      RH_PAIE: roleFiltered.filter((n) => n.category === 'RH_PAIE').length,
      SYSTEME: roleFiltered.filter((n) => n.category === 'SYSTEME').length,
    };

    const activeChannelsCount = Object.values(prefs.channels).filter(Boolean).length;

    return {
      notifications: sorted,
      preferences: prefs,
      stats: {
        totalActive: roleFiltered.length,
        unreadCount,
        criticalCount,
        highCount,
        dynamicActionCount,
        activeChannelsCount,
        categoryCounts,
      },
    };
  }

  toggleNotificationRead(id: string, companyId: string, forceRead?: boolean): BtpNotification | null {
    const notif = this.state.notifications.find((n) => n.id === id && n.companyId === companyId);
    if (!notif) return null;
    notif.isRead = typeof forceRead === 'boolean' ? forceRead : !notif.isRead;
    return notif;
  }

  markAllNotificationsRead(companyId: string): number {
    let updated = 0;
    this.state.notifications.forEach((n) => {
      if (n.companyId === companyId && !n.isArchived && !n.isRead) {
        n.isRead = true;
        updated += 1;
      }
    });
    return updated;
  }

  archiveNotification(id: string, companyId: string): BtpNotification | null {
    const notif = this.state.notifications.find((n) => n.id === id && n.companyId === companyId);
    if (!notif) return null;
    notif.isArchived = true;
    notif.isRead = true;
    return notif;
  }

  broadcastNotification(
    companyId: string,
    input: {
      category: NotificationCategory;
      severity: NotificationSeverity;
      title: string;
      message: string;
      projectId?: string;
      targetRoles: UserRole[];
      channelsSent: NotificationChannel[];
      actionTargetStep?: BtpNotification['actionTargetStep'];
      authorName: string;
    }
  ): { notification?: BtpNotification; error?: string } {
    if (!input.title.trim() || !input.message.trim()) {
      return { error: 'Le titre et le message de l’alerte sont obligatoires.' };
    }
    if (!input.targetRoles || input.targetRoles.length === 0) {
      return { error: 'Sélectionnez au moins un rôle destinataire.' };
    }

    const project =
      input.projectId && input.projectId !== 'ALL'
        ? this.state.projects.find((p) => p.id === input.projectId && p.companyId === companyId)
        : undefined;

    const channels: NotificationChannel[] =
      input.channelsSent && input.channelsSent.length > 0 ? input.channelsSent : ['IN_APP'];

    const newNotif: BtpNotification = {
      id: `notif_${Date.now()}`,
      companyId,
      category: input.category || 'SYSTEME',
      severity: input.severity || 'HIGH',
      title: input.title.trim(),
      message: `${input.message.trim()} (Diffusé par ${input.authorName})`,
      projectCode: project?.code,
      projectName: project?.name,
      targetRoles: input.targetRoles,
      actionTargetStep: input.actionTargetStep,
      actionLabel: input.actionTargetStep ? 'Ouvrir le module' : undefined,
      channelsSent: channels,
      isRead: false,
      isArchived: false,
      isDynamic: false,
      createdAt: new Date().toISOString(),
    };

    this.state.notifications.unshift(newNotif);
    return { notification: newNotif };
  }

  // ============================================================================
  // ÉTAPE 17 : MODE HORS-LIGNE / PWA CHANTIER — BOOTSTRAP & SYNCHRONISATION
  // ============================================================================

  getPwaFieldBootstrap(companyId: string) {
    const projects = this.state.projects
      .filter((p) => p.companyId === companyId)
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        city: p.city,
        progressPercentage: p.progressPercentage,
      }));

    const projectIds = new Set(projects.map((p) => p.id));

    const workers = this.state.workers
      .filter((w) => w.companyId === companyId && w.isActive)
      .map((w) => {
        const parts = w.fullName.trim().split(/\s+/);
        const firstName = parts[0] || w.fullName;
        const lastName = parts.slice(1).join(' ');
        return {
          id: w.id,
          projectId: w.projectId,
          matricule: w.matricule,
          firstName,
          lastName,
          specialty: w.specialtyLabel || w.specialty,
        };
      });

    const tasks = this.state.tasks
      .filter((t) => projectIds.has(t.projectId))
      .map((t) => ({
        id: t.id,
        projectId: t.projectId,
        lotName: t.lotName,
        title: t.title,
        progressPercentage: t.progressPercentage,
        status: t.status,
      }));

    return {
      generatedAt: new Date().toISOString(),
      projects,
      workers,
      tasks,
    };
  }

  processOfflineSyncQueue(
    companyId: string,
    items: OfflineQueueItem[],
    authorName: string
  ): { receipts: OfflineSyncReceipt[]; syncedCount: number; failedCount: number } {
    const receipts: OfflineSyncReceipt[] = [];
    let syncedCount = 0;
    let failedCount = 0;
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    for (const item of items) {
      try {
        const project = this.state.projects.find(
          (p) => p.id === item.projectId && p.companyId === companyId
        );
        if (!project) {
          failedCount += 1;
          receipts.push({
            id: item.id,
            status: 'FAILED',
            message: 'Chantier introuvable ou hors périmètre entreprise.',
            syncedAt: nowIso,
          });
          continue;
        }

        if (item.actionType === 'DAILY_LOG') {
          const p = item.payload || {};
          this.addDailyLog({
            projectId: project.id,
            date: p.date || todayDate,
            authorName: `${authorName} (Synchro Hors-Ligne)`,
            weather: p.weather || 'SUNNY',
            workersPresent: Math.max(0, Number(p.workersPresent) || 0),
            workDone: String(p.workDone || '').trim() || 'Saisie terrain hors-ligne',
            incidentsOrAlerts: p.incidentsOrAlerts ? String(p.incidentsOrAlerts).trim() : undefined,
          });
          syncedCount += 1;
          receipts.push({
            id: item.id,
            status: 'SYNCED',
            message: `Journal quotidien intégré sur ${project.code}.`,
            syncedAt: nowIso,
          });
        } else if (item.actionType === 'ATTENDANCE') {
          const p = item.payload || {};
          const att = this.upsertAttendance({
            companyId,
            projectId: project.id,
            workerId: String(p.workerId || ''),
            date: p.date || todayDate,
            status: p.status || 'PRESENT',
            overtimeHours: Math.max(0, Number(p.overtimeHours) || 0),
            notes: p.notes ? `${String(p.notes)} (Hors-Ligne)` : 'Pointage terrain hors-ligne',
          });
          if (!att) {
            failedCount += 1;
            receipts.push({
              id: item.id,
              status: 'FAILED',
              message: 'Ouvrier introuvable pour ce pointage.',
              syncedAt: nowIso,
            });
          } else {
            const workerObj = this.state.workers.find((w) => w.id === String(p.workerId || ''));
            syncedCount += 1;
            receipts.push({
              id: item.id,
              status: 'SYNCED',
              message: `Pointage de ${workerObj?.fullName || 'l’ouvrier'} enregistré sur ${project.code}.`,
              syncedAt: nowIso,
            });
          }
        } else if (item.actionType === 'TASK_PROGRESS') {
          const p = item.payload || {};
          const pct = Math.min(100, Math.max(0, Math.round(Number(p.progressPercentage) || 0)));
          const updated = this.updateTask(String(p.taskId || ''), {
            progressPercentage: pct,
          });
          if (!updated) {
            failedCount += 1;
            receipts.push({
              id: item.id,
              status: 'FAILED',
              message: 'Lot / Tâche introuvable lors de la synchronisation.',
              syncedAt: nowIso,
            });
          } else {
            syncedCount += 1;
            receipts.push({
              id: item.id,
              status: 'SYNCED',
              message: `Avancement « ${updated.title} » mis à jour à ${updated.progressPercentage} %.`,
              syncedAt: nowIso,
            });
          }
        } else {
          failedCount += 1;
          receipts.push({
            id: item.id,
            status: 'FAILED',
            message: 'Type d’action hors-ligne non reconnu.',
            syncedAt: nowIso,
          });
        }
      } catch (err: any) {
        failedCount += 1;
        receipts.push({
          id: item.id,
          status: 'FAILED',
          message: err?.message || 'Erreur inattendue de synchronisation.',
          syncedAt: nowIso,
        });
      }
    }

    return { receipts, syncedCount, failedCount };
  }

  // ============================================================================
  // ÉTAPE 18 : MODULE 14 — ABONNEMENTS SAAS & FACTURATION MULTI-TENANT
  // ============================================================================

  getSaasPlans(): SaaSPlanCatalog[] {
    return SAAS_PLANS;
  }

  getInvoiceById(invoiceId: string): SaaSInvoice | undefined {
    return this.state.saasInvoices.find((inv) => inv.id === invoiceId);
  }

  getSubscriptionOverview(companyId: string, role: UserRole) {
    const company = this.getCompanyById(companyId) || this.state.companies[0];
    const companyProjects = this.state.projects.filter(
      (p) => p.companyId === company.id && p.status !== 'CANCELLED'
    );
    const companyUsers = this.state.users.filter((u) => u.companyId === company.id && u.isActive);
    const companyWorkers = this.state.workers.filter((w) => w.companyId === company.id && w.isActive);

    const companyInvoices = this.state.saasInvoices
      .filter((inv) => inv.companyId === company.id)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

    const currentPlanSpec =
      SAAS_PLANS.find((p) => p.id === company.plan) || SAAS_PLANS[1];

    const transactions = this.state.paymentTransactions
      .filter((tx) => tx.companyId === company.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const baseOverview = {
      company,
      usage: {
        activeProjectsCount: companyProjects.length,
        maxProjects: company.maxProjects,
        activeUsersCount: companyUsers.length,
        maxUsers: company.maxUsers,
        activeWorkersCount: companyWorkers.length,
      },
      currentPlanSpec,
      plans: SAAS_PLANS,
      invoices: companyInvoices,
      transactions,
      paymentGateway: getPaymentGatewayStatus(),
    };

    if (role !== 'SUPER_ADMIN') {
      return {
        ...baseOverview,
        platformSummary: null,
      };
    }

    const tenants = this.state.companies.map((comp) => {
      const projCount = this.state.projects.filter(
        (p) => p.companyId === comp.id && p.status !== 'CANCELLED'
      ).length;
      const usrCount = this.state.users.filter((u) => u.companyId === comp.id && u.isActive).length;
      const planSpec = SAAS_PLANS.find((p) => p.id === comp.plan) || SAAS_PLANS[0];
      const tenantInvs = this.state.saasInvoices
        .filter((inv) => inv.companyId === comp.id)
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
      const mrrContributionXAF = comp.status === 'ACTIVE' ? planSpec.monthlyPriceXAF : 0;

      return {
        company: comp,
        activeProjectsCount: projCount,
        activeUsersCount: usrCount,
        mrrContributionXAF,
        lastInvoice: tenantInvs[0] || null,
      };
    });

    const mrrXAF = tenants.reduce((acc, t) => acc + t.mrrContributionXAF, 0);
    const collectedThisYearXAF = this.state.saasInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((acc, i) => acc + i.amountTTCXAF, 0);
    const pendingCollectionXAF = this.state.saasInvoices
      .filter((i) => i.status !== 'PAID')
      .reduce((acc, i) => acc + i.amountTTCXAF, 0);

    return {
      ...baseOverview,
      platformSummary: {
        totalTenants: this.state.companies.length,
        activeTenants: this.state.companies.filter((c) => c.status === 'ACTIVE').length,
        trialTenants: this.state.companies.filter((c) => c.status === 'TRIAL').length,
        suspendedTenants: this.state.companies.filter((c) => c.status === 'SUSPENDED').length,
        mrrXAF,
        arrXAF: mrrXAF * 12,
        collectedThisYearXAF,
        pendingCollectionXAF,
        tenants,
        allInvoices: [...this.state.saasInvoices].sort((a, b) =>
          b.issuedAt.localeCompare(a.issuedAt)
        ),
      },
    };
  }

  createPendingPlanInvoice(input: {
    companyId: string;
    targetPlan: SubscriptionPlan;
    billingCycle: BillingCycle;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    initiatorName: string;
  }): { success: boolean; error?: string; invoice?: SaaSInvoice } {
    const company = this.getCompanyById(input.companyId);
    if (!company) {
      return { success: false, error: 'Entreprise introuvable.' };
    }

    const planSpec = SAAS_PLANS.find((p) => p.id === input.targetPlan);
    if (!planSpec) {
      return { success: false, error: 'Formule SaaS inconnue.' };
    }

    const activeProjects = this.state.projects.filter(
      (p) => p.companyId === company.id && p.status !== 'CANCELLED'
    ).length;
    const activeUsers = this.state.users.filter(
      (u) => u.companyId === company.id && u.isActive
    ).length;

    if (activeProjects > planSpec.maxProjects) {
      return {
        success: false,
        error: `Rétrogradation impossible : vous avez ${activeProjects} chantiers actifs alors que la formule ${planSpec.id} est limitée à ${planSpec.maxProjects}.`,
      };
    }

    if (activeUsers > planSpec.maxUsers) {
      return {
        success: false,
        error: `Rétrogradation impossible : vous avez ${activeUsers} utilisateurs actifs alors que la formule ${planSpec.id} est limitée à ${planSpec.maxUsers}.`,
      };
    }

    const amountHTXAF =
      input.billingCycle === 'ANNUAL' ? planSpec.annualPriceXAF : planSpec.monthlyPriceXAF;
    const tvaXAF = Math.round(amountHTXAF * 0.1925);
    const amountTTCXAF = amountHTXAF + tvaXAF;

    const now = new Date();
    const issuedAt = now.toISOString();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const seq = String(this.state.saasInvoices.length + 1).padStart(3, '0');

    const newInvoice: SaaSInvoice = {
      id: `inv_bp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      invoiceNumber: `FAC-BP-2026-${seq}`,
      companyId: company.id,
      companyName: company.name,
      plan: planSpec.id,
      billingCycle: input.billingCycle,
      periodLabel:
        input.billingCycle === 'ANNUAL'
          ? 'Abonnement Annuel (12 mois · 2 mois offerts)'
          : `Abonnement Mensuel (${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`,
      amountHTXAF,
      tvaXAF,
      amountTTCXAF,
      status: 'PENDING',
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference?.trim() || undefined,
      issuedAt,
      dueDate,
      notes: `Demande ${planSpec.name} par ${input.initiatorName} — en attente de règlement confirmé`,
    };

    this.state.saasInvoices.unshift(newInvoice);

    return {
      success: true,
      invoice: newInvoice,
    };
  }

  createPaymentTransaction(input: {
    txId: string;
    invoiceId: string;
    companyId: string;
    provider: PaymentGatewayProvider;
    paymentMethod: PaymentMethod;
    phoneNumber?: string;
    amountXAF: number;
    externalReference?: string;
    paymentUrl?: string;
    ussdCode?: string;
    operator?: string;
    status: PaymentTransactionStatus;
  }): PaymentTransaction {
    const nowIso = new Date().toISOString();
    const tx: PaymentTransaction = {
      id: input.txId,
      invoiceId: input.invoiceId,
      companyId: input.companyId,
      provider: input.provider,
      paymentMethod: input.paymentMethod,
      phoneNumber: input.phoneNumber,
      amountXAF: input.amountXAF,
      status: input.status,
      externalReference: input.externalReference,
      paymentUrl: input.paymentUrl,
      ussdCode: input.ussdCode,
      operator: input.operator,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.state.paymentTransactions.unshift(tx);
    return tx;
  }

  getPaymentTransactionById(txId: string): PaymentTransaction | undefined {
    return this.state.paymentTransactions.find((t) => t.id === txId);
  }

  getPaymentTransactionByExternalRef(extRef: string): PaymentTransaction | undefined {
    return this.state.paymentTransactions.find((t) => t.externalReference === extRef);
  }

  updatePaymentTransactionResult(
    txId: string,
    result: {
      status: PaymentTransactionStatus;
      operatorReference?: string;
      errorMessage?: string;
    }
  ): { transaction?: PaymentTransaction; invoice?: SaaSInvoice; company?: Company } {
    const tx = this.getPaymentTransactionById(txId);
    if (!tx) return {};

    tx.status = result.status;
    tx.updatedAt = new Date().toISOString();
    if (result.errorMessage) tx.errorMessage = result.errorMessage;

    if (result.status !== 'SUCCESSFUL') {
      return { transaction: tx };
    }

    const inv = this.getInvoiceById(tx.invoiceId);
    if (inv) {
      inv.status = 'PAID';
      inv.paymentMethod = tx.paymentMethod;
      inv.paymentReference = result.operatorReference || tx.externalReference || tx.id;
      inv.paidAt = new Date().toISOString();

      const updatedComp = this.updateCompanyPlan(inv.companyId, inv.plan);
      if (updatedComp) {
        this.updateCompanyStatus(updatedComp.id, 'ACTIVE');
      }
      return {
        transaction: tx,
        invoice: inv,
        company: updatedComp || this.getCompanyById(inv.companyId),
      };
    }

    return { transaction: tx };
  }

  generateRenewalInvoice(
    companyId: string,
    billingCycle: BillingCycle
  ): { success: boolean; error?: string; invoice?: SaaSInvoice } {
    const company = this.getCompanyById(companyId);
    if (!company) return { success: false, error: 'Entreprise introuvable.' };

    const planSpec = SAAS_PLANS.find((p) => p.id === company.plan) || SAAS_PLANS[1];
    const amountHTXAF =
      billingCycle === 'ANNUAL' ? planSpec.annualPriceXAF : planSpec.monthlyPriceXAF;
    const tvaXAF = Math.round(amountHTXAF * 0.1925);
    const amountTTCXAF = amountHTXAF + tvaXAF;

    const now = new Date();
    const seq = String(this.state.saasInvoices.length + 1).padStart(3, '0');
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const inv: SaaSInvoice = {
      id: `inv_bp_${Date.now()}`,
      invoiceNumber: `FAC-BP-2026-${seq}`,
      companyId: company.id,
      companyName: company.name,
      plan: company.plan,
      billingCycle,
      periodLabel:
        billingCycle === 'ANNUAL'
          ? 'Renouvellement Annuel (12 mois)'
          : `Renouvellement Mensuel (${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`,
      amountHTXAF,
      tvaXAF,
      amountTTCXAF,
      status: 'PENDING',
      issuedAt: now.toISOString(),
      dueDate,
      notes: `Échéance de renouvellement forfait ${planSpec.name}`,
    };

    this.state.saasInvoices.unshift(inv);
    return { success: true, invoice: inv };
  }

  confirmBankTransferInvoice(
    invoiceId: string,
    bankReference: string,
    adminName: string
  ): { success: boolean; error?: string; invoice?: SaaSInvoice; company?: Company } {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) return { success: false, error: 'Facture SaaS introuvable.' };
    if (!bankReference || bankReference.trim().length < 4) {
      return {
        success: false,
        error: 'Saisissez la référence exacte du bordereau de virement bancaire reçu.',
      };
    }

    const nowIso = new Date().toISOString();
    inv.status = 'PAID';
    inv.paymentMethod = 'BANK_TRANSFER';
    inv.paymentReference = bankReference.trim();
    inv.paidAt = nowIso;
    inv.notes = `${inv.notes || ''} · Encaissement virement vérifié par ${adminName}`.trim();

    const updatedComp = this.updateCompanyPlan(inv.companyId, inv.plan);
    if (updatedComp) {
      this.updateCompanyStatus(updatedComp.id, 'ACTIVE');
    }

    return {
      success: true,
      invoice: inv,
      company: updatedComp || this.getCompanyById(inv.companyId),
    };
  }

  // =========================================================================
  // ÉTAPE 14 — MODULE 10 : ANNUAIRE & PERFORMANCE FOURNISSEURS BTP
  // =========================================================================

  private matchesSupplierName(recordSupplierName: string, targetSupplierName: string): boolean {
    const normalize = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/\bsarl\b|\bsa\b|\bsasu\b|\bcameroun\b|\bdouala\b|\byaounde\b/g, '')
        .trim();

    const a = normalize(recordSupplierName);
    const b = normalize(targetSupplierName);
    if (!a || !b) return false;
    return a.includes(b) || b.includes(a);
  }

  private computeSupplierMetrics(companyId: string, supplier: Supplier): SupplierPerformanceMetrics {
    const orders = this.state.purchaseOrders.filter(
      (po) => po.companyId === companyId && this.matchesSupplierName(po.supplierName, supplier.name)
    );
    const deliveries = this.state.deliveryNotes.filter(
      (dn) => dn.companyId === companyId && this.matchesSupplierName(dn.supplierName, supplier.name)
    );
    const supplierExpenses = this.state.expenses.filter(
      (ex) =>
        ex.companyId === companyId &&
        ex.beneficiary &&
        this.matchesSupplierName(ex.beneficiary, supplier.name)
    );

    const activeOrders = orders.filter((po) => po.status !== 'REJECTED');
    const totalOrderedTTCXAF = activeOrders.reduce((s, po) => s + po.totalAmountXAF, 0);

    const conformDeliveriesCount = deliveries.filter(
      (d) => d.status === 'COMPLETED' || d.status === 'PARTIAL'
    ).length;
    const disputeDeliveriesCount = deliveries.filter((d) => d.status === 'DISPUTED').length;
    const conformityRatePct =
      deliveries.length > 0
        ? Math.round((conformDeliveriesCount / deliveries.length) * 100)
        : null;

    const committedOrdersXAF = orders
      .filter((po) => ['APPROVED', 'ORDERED', 'DELIVERED'].includes(po.status))
      .reduce((s, po) => s + po.totalAmountXAF, 0);
    const paidExpensesXAF = supplierExpenses
      .filter((ex) => ex.status === 'PAID')
      .reduce((s, ex) => s + ex.amountXAF, 0);
    const outstandingPayableXAF = Math.max(0, committedOrdersXAF - paidExpensesXAF);

    const sortedDates = orders
      .map((o) => o.createdAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      ordersCount: activeOrders.length,
      totalOrderedTTCXAF,
      deliveriesCount: deliveries.length,
      conformDeliveriesCount,
      disputeDeliveriesCount,
      conformityRatePct,
      paidExpensesXAF,
      outstandingPayableXAF,
      lastOrderDate: sortedDates[0],
    };
  }

  getSuppliers(companyId: string): Supplier[] {
    return this.state.suppliers.filter((s) => s.companyId === companyId);
  }

  getSuppliersWithPerformance(companyId: string): {
    suppliers: SupplierWithPerformance[];
    summary: {
      totalSuppliers: number;
      preferredCount: number;
      underReviewOrBlacklistedCount: number;
      avgConformityPct: number;
      totalOrderedXAF: number;
      totalOutstandingXAF: number;
      activeDisputesCount: number;
    };
  } {
    const list = this.getSuppliers(companyId).map((sup) => ({
      ...sup,
      metrics: this.computeSupplierMetrics(companyId, sup),
    }));

    const withDeliveries = list.filter(
      (s) => s.metrics.deliveriesCount > 0 && s.metrics.conformityRatePct !== null
    );
    const avgConformityPct =
      withDeliveries.length > 0
        ? Math.round(
            withDeliveries.reduce((acc, s) => acc + (s.metrics.conformityRatePct ?? 0), 0) /
              withDeliveries.length
          )
        : 100;

    return {
      suppliers: list,
      summary: {
        totalSuppliers: list.length,
        preferredCount: list.filter((s) => s.status === 'PREFERRED').length,
        underReviewOrBlacklistedCount: list.filter(
          (s) => s.status === 'UNDER_REVIEW' || s.status === 'BLACKLISTED'
        ).length,
        avgConformityPct,
        totalOrderedXAF: list.reduce((acc, s) => acc + s.metrics.totalOrderedTTCXAF, 0),
        totalOutstandingXAF: list.reduce((acc, s) => acc + s.metrics.outstandingPayableXAF, 0),
        activeDisputesCount: list.reduce((acc, s) => acc + s.metrics.disputeDeliveriesCount, 0),
      },
    };
  }

  getSupplierDossier(companyId: string, supplierId: string) {
    const supplier = this.state.suppliers.find(
      (s) => s.id === supplierId && s.companyId === companyId
    );
    if (!supplier) return null;

    const metrics = this.computeSupplierMetrics(companyId, supplier);
    const orders = this.state.purchaseOrders
      .filter(
        (po) => po.companyId === companyId && this.matchesSupplierName(po.supplierName, supplier.name)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const deliveries = this.state.deliveryNotes
      .filter(
        (dn) => dn.companyId === companyId && this.matchesSupplierName(dn.supplierName, supplier.name)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const expenses = this.state.expenses
      .filter(
        (ex) =>
          ex.companyId === companyId &&
          ex.beneficiary &&
          this.matchesSupplierName(ex.beneficiary, supplier.name)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      supplier: { ...supplier, metrics },
      orders,
      deliveries,
      expenses,
    };
  }

  createSupplier(input: {
    companyId: string;
    name: string;
    category: SupplierCategory;
    contactPerson: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
    niu: string;
    rccm?: string;
    paymentTerms: SupplierPaymentTerms;
    specialties: string;
    rating?: number;
    notes?: string;
  }): { success: boolean; supplier?: Supplier; error?: string } {
    if (!input.name?.trim()) return { success: false, error: 'Raison sociale du fournisseur requise.' };
    if (!input.niu?.trim()) return { success: false, error: 'Numéro Identifiant Unique (NIU) requis.' };
    if (!input.phone?.trim()) return { success: false, error: 'Téléphone commercial requis.' };

    const newSupplier: Supplier = {
      id: `sup_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      companyId: input.companyId,
      name: input.name.trim(),
      category: input.category || 'QUINCAILLERIE_MEP',
      contactPerson: input.contactPerson?.trim() || 'Service Commercial',
      phone: input.phone.trim(),
      email: input.email?.trim() || '',
      city: input.city?.trim() || 'Douala',
      address: input.address?.trim() || 'Cameroun',
      niu: input.niu.trim().toUpperCase(),
      rccm: input.rccm?.trim().toUpperCase() || 'Non renseigné',
      paymentTerms: input.paymentTerms || 'NET_30',
      specialties: input.specialties?.trim() || 'Matériaux de construction BTP',
      status: 'ACTIVE',
      rating: Math.min(5, Math.max(1, Number(input.rating) || 4)),
      notes: input.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    this.state.suppliers.unshift(newSupplier);
    return { success: true, supplier: newSupplier };
  }

  updateSupplier(
    companyId: string,
    supplierId: string,
    patch: Partial<Omit<Supplier, 'id' | 'companyId' | 'createdAt'>>
  ): { success: boolean; supplier?: Supplier; error?: string } {
    const idx = this.state.suppliers.findIndex(
      (s) => s.id === supplierId && s.companyId === companyId
    );
    if (idx === -1) return { success: false, error: 'Fournisseur introuvable.' };

    const updated: Supplier = {
      ...this.state.suppliers[idx],
      ...patch,
      name: patch.name !== undefined ? patch.name.trim() : this.state.suppliers[idx].name,
      niu: patch.niu !== undefined ? patch.niu.trim().toUpperCase() : this.state.suppliers[idx].niu,
      rccm:
        patch.rccm !== undefined ? patch.rccm.trim().toUpperCase() : this.state.suppliers[idx].rccm,
    };
    this.state.suppliers[idx] = updated;
    return { success: true, supplier: updated };
  }

  updateSupplierStatus(
    companyId: string,
    supplierId: string,
    status: SupplierStatus,
    notes?: string
  ): { success: boolean; supplier?: Supplier; error?: string } {
    const sup = this.state.suppliers.find(
      (s) => s.id === supplierId && s.companyId === companyId
    );
    if (!sup) return { success: false, error: 'Fournisseur introuvable.' };
    sup.status = status;
    if (notes !== undefined && notes.trim()) {
      sup.notes = notes.trim();
    }
    return { success: true, supplier: sup };
  }

  // =========================================================================
  // ÉTAPE 15 — MODULE 11 : RAPPORTS DIRECTION & CENTRE DOCUMENTAIRE BTP
  // =========================================================================

  getExecutiveMonthlyReportData(companyId: string, projectId = 'ALL') {
    const company = this.getCompanyById(companyId);
    const allProjects = this.getProjects(companyId);
    const projects =
      projectId && projectId !== 'ALL'
        ? allProjects.filter((p) => p.id === projectId)
        : allProjects;

    const orders = this.state.purchaseOrders.filter(
      (po) => po.companyId === companyId && (projectId === 'ALL' || po.projectId === projectId)
    );
    const deliveries = this.state.deliveryNotes.filter(
      (dn) => dn.companyId === companyId && (projectId === 'ALL' || dn.projectId === projectId)
    );
    const expenses = this.state.expenses.filter(
      (ex) =>
        ex.companyId === companyId &&
        ex.status !== 'REJECTED' &&
        (projectId === 'ALL' || ex.projectId === projectId)
    );
    const payrolls = this.state.payrollRecords.filter(
      (pr) => pr.companyId === companyId && (projectId === 'ALL' || pr.projectId === projectId)
    );
    const materials = this.getMaterials(companyId);
    const supplierOverview = this.getSuppliersWithPerformance(companyId);

    const totalBudgetAllocatedXAF = projects.reduce((s, p) => s + p.budgetTotal, 0);
    const totalBudgetSpentXAF = projects.reduce((s, p) => s + p.budgetSpent, 0);
    const avgProgressPct =
      projects.length > 0
        ? Math.round(projects.reduce((s, p) => s + p.progressPercentage, 0) / projects.length)
        : 0;

    const totalOrdersTTCXAF = orders
      .filter((o) => o.status !== 'REJECTED')
      .reduce((s, o) => s + o.totalAmountXAF, 0);
    const totalPayrollPaidXAF = payrolls
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + p.netPayXAF, 0);
    const totalExpensesPaidXAF = expenses
      .filter((e) => e.status === 'PAID')
      .reduce((s, e) => s + e.amountXAF, 0);
    const stockValuationXAF = materials.reduce(
      (s, m) => s + m.currentStock * m.unitPriceXAF,
      0
    );
    const criticalStockCount = materials.filter(
      (m) => m.currentStock <= m.minimumStockAlert
    ).length;
    const disputeDeliveriesCount = deliveries.filter((d) => d.status === 'DISPUTED').length;

    return {
      company,
      projectScopeLabel:
        projectId === 'ALL'
          ? `Tous les chantiers (${projects.length})`
          : projects[0]?.name || 'Chantier',
      projects,
      orders,
      deliveries,
      expenses,
      payrolls,
      supplierOverview,
      metrics: {
        activeProjectsCount: projects.filter((p) => p.status === 'IN_PROGRESS').length,
        totalProjectsCount: projects.length,
        avgProgressPct,
        totalBudgetAllocatedXAF,
        totalBudgetSpentXAF,
        budgetExecutionPct:
          totalBudgetAllocatedXAF > 0
            ? Math.round((totalBudgetSpentXAF / totalBudgetAllocatedXAF) * 100)
            : 0,
        totalOrdersCount: orders.length,
        totalOrdersTTCXAF,
        totalDeliveriesCount: deliveries.length,
        disputeDeliveriesCount,
        totalPayrollPaidXAF,
        totalExpensesPaidXAF,
        stockValuationXAF,
        criticalStockCount,
        suppliersCount: supplierOverview.summary.totalSuppliers,
        supplierConformityPct: supplierOverview.summary.avgConformityPct,
      },
    };
  }

  getReportsAndDocumentsOverview(companyId: string, projectId = 'ALL') {
    const reportData = this.getExecutiveMonthlyReportData(companyId, projectId);
    const vaultDocuments = this.state.vaultDocuments
      .filter(
        (d) => d.companyId === companyId && (projectId === 'ALL' || d.projectId === projectId)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const systemDocuments: SystemGeneratedDocument[] = [];

    reportData.orders.forEach((po) => {
      systemDocuments.push({
        id: `sys_po_${po.id}`,
        category: 'BON_COMMANDE',
        categoryLabel: 'Bon de Commande',
        reference: po.orderNumber,
        title: `${po.orderNumber} — ${po.supplierName}`,
        projectOrEntity: po.projectName,
        amountXAF: po.totalAmountXAF,
        date: po.createdAt,
        statusLabel: po.status,
        downloadUrl: `/api/purchase-orders/${po.id}/pdf`,
      });
    });

    reportData.deliveries.forEach((dn) => {
      systemDocuments.push({
        id: `sys_dn_${dn.id}`,
        category: 'BON_LIVRAISON',
        categoryLabel: 'Bon de Livraison',
        reference: dn.deliveryNumber,
        title: `${dn.deliveryNumber} — ${dn.supplierName}`,
        projectOrEntity: dn.projectName,
        amountXAF: dn.totalValueXAF,
        date: dn.deliveryDate,
        statusLabel: dn.status,
        downloadUrl: `/api/deliveries/${dn.id}/pdf`,
      });
    });

    const companyProjects = this.getProjects(companyId);
    const projectMap = new Map(companyProjects.map((p) => [p.id, `${p.code} — ${p.name}`]));

    reportData.payrolls.forEach((pr) => {
      systemDocuments.push({
        id: `sys_pay_${pr.id}`,
        category: 'PAIE_OUVRIER',
        categoryLabel: 'Bulletin de Paie',
        reference: pr.paymentReference || pr.id.toUpperCase(),
        title: `Bulletin ${pr.workerName} (${pr.periodLabel})`,
        projectOrEntity: projectMap.get(pr.projectId) || pr.projectId,
        amountXAF: pr.netPayXAF,
        date: pr.paidAt || pr.createdAt,
        statusLabel: pr.status,
        downloadUrl: `/api/payroll/${pr.id}/payslip-pdf`,
      });
    });

    this.getSuppliers(companyId).forEach((sup) => {
      systemDocuments.push({
        id: `sys_sup_${sup.id}`,
        category: 'FICHE_FOURNISSEUR',
        categoryLabel: 'Fiche Fournisseur',
        reference: sup.niu,
        title: `Évaluation & Encours — ${sup.name}`,
        projectOrEntity: sup.city,
        date: sup.createdAt,
        statusLabel: sup.status,
        downloadUrl: `/api/suppliers/${sup.id}/pdf?companyId=${encodeURIComponent(companyId)}`,
      });
    });

    this.state.saasInvoices
      .filter((inv) => inv.companyId === companyId)
      .forEach((inv) => {
        systemDocuments.push({
          id: `sys_inv_${inv.id}`,
          category: 'FACTURE_SAAS',
          categoryLabel: 'Facture SaaS',
          reference: inv.invoiceNumber,
          title: `${inv.invoiceNumber} — Forfait ${inv.plan}`,
          projectOrEntity: inv.periodLabel,
          amountXAF: inv.amountTTCXAF,
          date: inv.issuedAt,
          statusLabel: inv.status,
          downloadUrl: `/api/subscriptions/invoices/${inv.id}/pdf`,
        });
      });

    systemDocuments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      projects: this.getProjects(companyId).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        city: p.city,
      })),
      executiveSummary: reportData.metrics,
      vaultDocuments,
      systemDocuments,
    };
  }

  getVaultDocumentById(companyId: string, docId: string): VaultDocumentRecord | undefined {
    return this.state.vaultDocuments.find((d) => d.id === docId && d.companyId === companyId);
  }

  addVaultDocument(input: {
    companyId: string;
    projectId?: string;
    title: string;
    reference: string;
    category: VaultDocumentCategory;
    documentDate: string;
    uploadedByName: string;
    uploadedByRole: UserRole;
    fileName: string;
    mimeType?: string;
    fileSizeKB?: number;
    dataBase64?: string;
    notes?: string;
  }): { success: boolean; document?: VaultDocumentRecord; error?: string } {
    if (!input.title?.trim()) return { success: false, error: 'Titre de la pièce requis.' };
    if (!input.reference?.trim()) return { success: false, error: 'Référence documentaire requise.' };

    const project = input.projectId ? this.getProjectById(input.projectId) : undefined;
    const record: VaultDocumentRecord = {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      companyId: input.companyId,
      projectId: project?.id,
      projectName: project ? `${project.code} — ${project.name}` : 'Siège Social / Transverse',
      title: input.title.trim(),
      reference: input.reference.trim().toUpperCase(),
      category: input.category || 'MARCHE_OS',
      documentDate: input.documentDate || new Date().toISOString().split('T')[0],
      uploadedByName: input.uploadedByName || 'Direction',
      uploadedByRole: input.uploadedByRole,
      fileName: input.fileName?.trim() || `${input.reference.trim()}.pdf`,
      mimeType: input.mimeType || 'application/pdf',
      fileSizeKB: Math.max(12, Number(input.fileSizeKB) || 145),
      dataBase64: input.dataBase64,
      notes: input.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    this.state.vaultDocuments.unshift(record);
    return { success: true, document: record };
  }

  deleteVaultDocument(companyId: string, docId: string): boolean {
    const idx = this.state.vaultDocuments.findIndex(
      (d) => d.id === docId && d.companyId === companyId
    );
    if (idx === -1) return false;
    this.state.vaultDocuments.splice(idx, 1);
    return true;
  }

  getAccountingCsvRows(companyId: string, projectId = 'ALL'): string {
    const reportData = this.getExecutiveMonthlyReportData(companyId, projectId);
    const header = [
      'Type Piece',
      'Reference',
      'Date',
      'Chantier',
      'Tiers / Beneficiaire',
      'Categorie',
      'Montant FCFA',
      'Mode Reglement',
      'Statut',
    ].join(';');

    const escapeCsv = (v: any) =>
      `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

    const rows: string[] = [];

    reportData.expenses.forEach((ex) => {
      rows.push(
        [
          'DEPENSE',
          ex.reference,
          ex.expenseDate,
          ex.projectName,
          ex.beneficiary,
          ex.categoryLabel,
          ex.amountXAF,
          ex.paymentMethod,
          ex.status,
        ]
          .map(escapeCsv)
          .join(';')
      );
    });

    reportData.orders.forEach((po) => {
      rows.push(
        [
          'BON_COMMANDE',
          po.orderNumber,
          po.createdAt.split('T')[0],
          po.projectName,
          po.supplierName,
          'Achats Materiaux TTC',
          po.totalAmountXAF,
          po.paymentTerms,
          po.status,
        ]
          .map(escapeCsv)
          .join(';')
      );
    });

    const projectMap = new Map(reportData.projects.map((p) => [p.id, `${p.code} — ${p.name}`]));

    reportData.payrolls.forEach((pr) => {
      rows.push(
        [
          'PAIE_OUVRIER',
          pr.paymentReference || pr.id.toUpperCase(),
          (pr.paidAt || pr.createdAt).split('T')[0],
          projectMap.get(pr.projectId) || pr.projectId,
          pr.workerName,
          `Paie ${pr.periodLabel}`,
          pr.netPayXAF,
          pr.paymentMethod || 'NON_DEFINI',
          pr.status,
        ]
          .map(escapeCsv)
          .join(';')
      );
    });

    return `\uFEFF${header}\n${rows.join('\n')}`;
  }
}

export const SAAS_PLANS: SaaSPlanCatalog[] = [
  {
    id: 'STARTER',
    name: 'Starter Chantier',
    targetAudience: 'Petits entrepreneurs & artisans BTP démarrant leur structuration',
    monthlyPriceXAF: 15000,
    annualPriceXAF: 150000,
    maxProjects: 2,
    maxUsers: 5,
    features: [
      'Jusqu’à 2 chantiers actifs simultanés',
      '5 comptes utilisateurs (DG, Chef chantier, Ouvriers)',
      'Suivi avancement, pointages & journaux quotidiens',
      'Mode Hors-Ligne PWA terrain inclus',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro PME BTP',
    targetAudience: 'PME de BTP gérant plusieurs chantiers à Douala, Yaoundé et régions',
    monthlyPriceXAF: 25000,
    annualPriceXAF: 250000,
    maxProjects: 10,
    maxUsers: 20,
    recommended: true,
    features: [
      'Jusqu’à 10 chantiers actifs simultanés',
      '20 utilisateurs avec RBAC complet (Magasinier, Comptable...)',
      'Stocks Dépôt, Bons de Commande (P.U. & Visa DG) et Livraisons',
      'Paie Mobile Money (OM/MoMo), Budgets & Alertes critiques',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Multi-Sites',
    targetAudience: 'Grands groupes BTP, génie civil et maîtrises d’œuvre multi-agences',
    monthlyPriceXAF: 40000,
    annualPriceXAF: 400000,
    maxProjects: 999,
    maxUsers: 999,
    features: [
      'Chantiers et utilisateurs ILLIMITÉS',
      'Consolidation budgétaire multi-agences & exports PDF direction',
      'Alertes multi-canaux WhatsApp / SMS dédiées',
      'Accompagnement déploiement terrain & SLA prioritaire',
    ],
  },
];

export const initialSaasInvoices: SaaSInvoice[] = [
  {
    id: 'inv_bp_01',
    invoiceNumber: 'FAC-BP-2026-001',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL (Bâtiment & Travaux Publics)',
    plan: 'PRO',
    billingCycle: 'MONTHLY',
    periodLabel: 'Abonnement Mensuel (Octobre 2026)',
    amountHTXAF: 95000,
    tvaXAF: 18288,
    amountTTCXAF: 113288,
    status: 'PAID',
    paymentMethod: 'ORANGE_MONEY',
    paymentReference: 'OM-2026-884120',
    issuedAt: '2026-10-01T08:30:00Z',
    dueDate: '2026-10-08',
    paidAt: '2026-10-01T09:12:00Z',
    notes: 'Règlement mensuel Pro PME BTP',
  },
  {
    id: 'inv_bp_02',
    invoiceNumber: 'FAC-BP-2026-002',
    companyId: 'comp_socabat_01',
    companyName: 'SOCABAT SARL (Bâtiment & Travaux Publics)',
    plan: 'PRO',
    billingCycle: 'MONTHLY',
    periodLabel: 'Abonnement Mensuel (Novembre 2026)',
    amountHTXAF: 95000,
    tvaXAF: 18288,
    amountTTCXAF: 113288,
    status: 'PAID',
    paymentMethod: 'MTN_MOMO',
    paymentReference: 'MOMO-2026-991042',
    issuedAt: '2026-11-01T08:00:00Z',
    dueDate: '2026-11-08',
    paidAt: '2026-11-01T10:05:00Z',
    notes: 'Renouvellement automatique validé par Direction',
  },
  {
    id: 'inv_bp_03',
    invoiceNumber: 'FAC-BP-2026-003',
    companyId: 'comp_sahel_02',
    companyName: 'SAHEL INFRASTRUCTURES & GÉNIE CIVIL',
    plan: 'STARTER',
    billingCycle: 'MONTHLY',
    periodLabel: 'Activation post-essai (Novembre 2026)',
    amountHTXAF: 35000,
    tvaXAF: 6738,
    amountTTCXAF: 41738,
    status: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    issuedAt: '2026-11-15T09:00:00Z',
    dueDate: '2026-11-22',
    notes: 'Fin de période d’essai 14 jours — virement bancaire en attente de validation',
  },
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup_01',
    companyId: 'comp_socabat_01',
    name: 'CIMENCAM (Ciments du Cameroun)',
    category: 'CIMENT_LIANTS',
    contactPerson: 'Service Grands Comptes',
    phone: '+237 233 42 15 20',
    email: 'grandscomptes@cimencam.cm',
    city: 'Douala',
    address: 'Zone Industrielle Bassa, BP 1323 Douala',
    niu: 'M016300004812P',
    rccm: 'RC/DLA/1963/B/104',
    paymentTerms: 'NET_30',
    specialties: 'Ciment CPJ 35 / CEM II 42.5, Multibat, Liants hydrauliques',
    status: 'PREFERRED',
    rating: 4.9,
    notes: 'Fournisseur stratégique béton armé — livraisons prioritaires Akwa & Laquintinie.',
    createdAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'sup_02',
    companyId: 'comp_socabat_01',
    name: 'GROUPE FOKOU (Quincaillerie Lourde)',
    category: 'ACIERS_FERRAILLAGE',
    contactPerson: 'Jean-Pierre Ndzie',
    phone: '+237 699 10 20 30',
    email: 'ventes@fokou.cm',
    city: 'Douala',
    address: 'Zone Industrielle Bonabéri, Douala',
    niu: 'M049200018244K',
    rccm: 'RC/DLA/1992/B/518',
    paymentTerms: 'NET_30',
    specialties: 'Fers à béton HA 8 à HA 16, treillis soudés, tôles bacs, profilés',
    status: 'PREFERRED',
    rating: 4.8,
    notes: 'Remise volume 4% sur commandes aciers supérieures à 3M FCFA.',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'sup_03',
    companyId: 'comp_socabat_01',
    name: 'SOREPCO Cameroun',
    category: 'QUINCAILLERIE_MEP',
    contactPerson: 'Clarisse Tchounkeu',
    phone: '+237 677 44 55 66',
    email: 'commandes@sorepco.cm',
    city: 'Douala',
    address: 'Boulevard de la Liberté, Akwa, Douala',
    niu: 'M070500029104A',
    rccm: 'RC/DLA/2005/B/812',
    paymentTerms: 'NET_15',
    specialties: 'Plomberie PVC pression, électricité bâtiment, outillage, carrelage',
    status: 'UNDER_REVIEW',
    rating: 3.7,
    notes: 'Sous surveillance suite à écart quantité/litige sur livraison câbles & PVC.',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'sup_04',
    companyId: 'comp_socabat_01',
    name: 'Carrière Razel Logbaba',
    category: 'AGREGATS_CARRIERE',
    contactPerson: 'Dispatch Agrégats',
    phone: '+237 695 11 22 44',
    email: 'dispatch.logbaba@razel-cam.cm',
    city: 'Douala',
    address: 'Carrière Logbaba, Route de Japoma, Douala',
    niu: 'M029800051120E',
    rccm: 'RC/DLA/1998/B/302',
    paymentTerms: 'CASH_ON_DELIVERY',
    specialties: 'Gravier concassé 5/15, 15/25, tout-venant, moellons de carrière',
    status: 'ACTIVE',
    rating: 4.5,
    notes: 'Rotations camions bennes 20m³ vers chantiers Douala.',
    createdAt: '2026-02-18T08:30:00Z',
  },
  {
    id: 'sup_05',
    companyId: 'comp_socabat_01',
    name: 'Dragages Sanaga SARL',
    category: 'AGREGATS_CARRIERE',
    contactPerson: 'Emmanuel Mbarga',
    phone: '+237 690 77 31 18',
    email: 'sable@dragages-sanaga.cm',
    city: 'Édéa / Douala',
    address: 'Quai Sanaga, Route d’Édéa',
    niu: 'M111412093841C',
    rccm: 'RC/DLA/2014/B/1940',
    paymentTerms: 'CASH_ON_DELIVERY',
    specialties: 'Sable fin Sanaga lavé pour bétonnage et enduits de façade',
    status: 'ACTIVE',
    rating: 4.4,
    createdAt: '2026-03-04T08:00:00Z',
  },
  {
    id: 'sup_06',
    companyId: 'comp_socabat_01',
    name: 'TOTAL Énergies Cameroun',
    category: 'CARBURANT_ENGINS',
    contactPerson: 'Pôle Cartes BTP & Vrac',
    phone: '+237 233 43 09 00',
    email: 'pro.btp@totalenergies.cm',
    city: 'Douala',
    address: 'Bonanjo, Avenue du Général de Gaulle, Douala',
    niu: 'M054700001920R',
    rccm: 'RC/DLA/1950/B/012',
    paymentTerms: 'NET_30',
    specialties: 'Gasoil engins de chantier, lubrifiants groupes électrogènes',
    status: 'PREFERRED',
    rating: 4.7,
    createdAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'sup_07',
    companyId: 'comp_sahel_02',
    name: 'BETON-YAO SARL',
    category: 'BETON_PREFA',
    contactPerson: 'Direction Commerciale Yaoundé',
    phone: '+237 677 90 12 33',
    email: 'commandes@beton-yao.cm',
    city: 'Yaoundé',
    address: 'Zone Industrielle Ahala, Yaoundé',
    niu: 'M061712640981N',
    rccm: 'RC/YAO/2017/B/742',
    paymentTerms: 'ADVANCE_50',
    specialties: 'Béton prêt à l’emploi B25/B30, bordures T2, pavés autobloquants',
    status: 'PREFERRED',
    rating: 4.7,
    createdAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'sup_08',
    companyId: 'comp_sahel_02',
    name: 'DANGOTE Cement Cameroun',
    category: 'CIMENT_LIANTS',
    contactPerson: 'Agence Centre Yaoundé',
    phone: '+237 694 22 00 88',
    email: 'sales.yaounde@dangote.cm',
    city: 'Yaoundé / Douala',
    address: 'Quai du Wouri & Dépôt Nsam Yaoundé',
    niu: 'M091100038472T',
    rccm: 'RC/DLA/2011/B/3310',
    paymentTerms: 'NET_15',
    specialties: 'Ciment 3X 42.5R haute résistance pour travaux VRD & ouvrages d’art',
    status: 'ACTIVE',
    rating: 4.6,
    createdAt: '2026-10-18T10:00:00Z',
  },
];

export const initialVaultDocuments: VaultDocumentRecord[] = [
  {
    id: 'doc_soc_01',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    projectName: 'PRJ-2026-01 — Immeuble R+5 Akwa Centre',
    title: 'Marché de Travaux Signé & Ordre de Service N°01',
    reference: 'OS-AKW-2026-001',
    category: 'MARCHE_OS',
    documentDate: '2026-02-10',
    uploadedByName: 'Jean-Marc Etoundi',
    uploadedByRole: 'DIRECTOR',
    fileName: 'Marche_Travaux_OS_Akwa_R5.pdf',
    mimeType: 'application/pdf',
    fileSizeKB: 1840,
    notes: 'Document contractuel signé avec le Maître d’Ouvrage SCI Akwa Palace.',
    createdAt: '2026-02-10T09:15:00Z',
  },
  {
    id: 'doc_soc_02',
    companyId: 'comp_socabat_01',
    projectId: 'proj_akwa_01',
    projectName: 'PRJ-2026-01 — Immeuble R+5 Akwa Centre',
    title: 'PV Essais Compression Béton 28 jours — Dalle R+2 (Labogénie)',
    reference: 'LAB-DLA-2026-418',
    category: 'CONTROLE_LABOGENIE',
    documentDate: '2026-10-22',
    uploadedByName: 'Paul Mbappé',
    uploadedByRole: 'SITE_MANAGER',
    fileName: 'PV_Labogenie_Dalle_R2_Akwa.pdf',
    mimeType: 'application/pdf',
    fileSizeKB: 620,
    notes: 'Résistance mesurée 27,4 MPa >= 25 MPa requis (Conforme).',
    createdAt: '2026-10-22T15:30:00Z',
  },
  {
    id: 'doc_soc_03',
    companyId: 'comp_socabat_01',
    projectId: 'proj_laquintinie_02',
    projectName: 'PRJ-2026-02 — Extension Pavillon Hôpital Laquintinie',
    title: 'Plans d’Exécution Béton Armé — Fondations & Longrines (Indice B)',
    reference: 'PLN-LAQ-BA-02B',
    category: 'TECHNIQUE_PLANS',
    documentDate: '2026-09-14',
    uploadedByName: 'Paul Mbappé',
    uploadedByRole: 'SITE_MANAGER',
    fileName: 'Plans_BA_Fondations_Laquintinie_IndB.pdf',
    mimeType: 'application/pdf',
    fileSizeKB: 3420,
    notes: 'Visa bureau de contrôle APAVE Cameroun inclus.',
    createdAt: '2026-09-14T11:00:00Z',
  },
  {
    id: 'doc_soc_04',
    companyId: 'comp_socabat_01',
    projectName: 'Siège Social / Transverse',
    title: 'Attestation pour Soumission CNPS & Attestation Non-Redevance DGI',
    reference: 'CNPS-DLA-2026-T4',
    category: 'ADMINISTRATIF_CNPS',
    documentDate: '2026-11-02',
    uploadedByName: 'Brigitte Ngo Bikai',
    uploadedByRole: 'ACCOUNTANT',
    fileName: 'Attestation_CNPS_ANR_SOCABAT_T4_2026.pdf',
    mimeType: 'application/pdf',
    fileSizeKB: 410,
    notes: 'Valide jusqu’au 31/01/2027 pour appels d’offres publics.',
    createdAt: '2026-11-02T10:15:00Z',
  },
  {
    id: 'doc_sahel_01',
    companyId: 'comp_sahel_02',
    projectId: 'proj_bastos_03',
    projectName: 'PRJ-YAO-01 — Aménagement Voie Pavée Bastos',
    title: 'Procès-Verbal Implantation & Nivellement Topographique',
    reference: 'PV-TOPO-YAO-09',
    category: 'TECHNIQUE_PLANS',
    documentDate: '2026-10-20',
    uploadedByName: 'Direction Sahel Infra',
    uploadedByRole: 'DIRECTOR',
    fileName: 'PV_Implantation_Bastos_Yaounde.pdf',
    mimeType: 'application/pdf',
    fileSizeKB: 980,
    notes: 'Validation tracé voirie + regards eaux pluviales.',
    createdAt: '2026-10-20T14:00:00Z',
  },
];

export const db = new DatabaseManager();
