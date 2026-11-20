/**
 * BATI-PILOT — Types et Modèles de Données
 * SaaS BTP pour l'Afrique francophone (Cameroun, devise XAF, fuseau Africa/Douala)
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'DIRECTOR'
  | 'SITE_MANAGER'
  | 'STOREKEEPER'
  | 'ACCOUNTANT'
  | 'WORKER';

export type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Company {
  id: string;
  name: string;
  slug: string;
  legalNumber?: string; // N° RC / Contribuable
  address: string;
  city: string; // Ex: Douala, Yaoundé, Bafoussam, Garoua
  country: string; // Cameroun
  currency: string; // XAF (FCFA)
  timezone: string; // Africa/Douala
  phone: string;
  email: string;
  logoUrl?: string;
  plan: SubscriptionPlan;
  maxProjects: number;
  maxUsers: number;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  trialEndsAt?: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  companyName?: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialty?: string; // Ex: Ingénieur Génie Civil, Conducteur de travaux, Chef maçon
  avatarUrl?: string;
  assignedProjectIds: string[]; // Chantiers assignés
  isActive: boolean;
  createdAt: string;
}

export interface RolePermission {
  canViewAllProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canViewBudgets: boolean;
  canEditBudgets: boolean;
  canRecordDailyProgress: boolean;
  canRecordAttendance: boolean;
  canValidateAttendance: boolean;
  canManagePayroll: boolean;
  canManageStock: boolean;
  canCreatePurchaseOrder: boolean;
  canApprovePurchaseOrder: boolean;
  canRecordDelivery: boolean;
  canRecordExpense: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageCompanySubscription: boolean;
  canManagePlatform: boolean; // Super Admin only
}

export interface Project {
  id: string;
  companyId: string;
  code: string; // Ex: CH-2026-DLA-01
  name: string;
  clientName: string;
  clientPhone?: string;
  location: string;
  city: string;
  lat?: number;
  lng?: number;
  description: string;
  startDate: string;
  expectedEndDate: string;
  budgetTotal: number; // en FCFA
  budgetSpent: number; // en FCFA
  managerId: string; // Chef de chantier référent
  managerName?: string;
  status: 'PREPARATION' | 'IN_PROGRESS' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  workersCount: number;
  createdAt: string;
}

export interface ProjectDailyLog {
  id: string;
  projectId: string;
  date: string;
  authorName: string;
  weather: 'SUNNY' | 'RAINY' | 'CLOUDY' | 'STORMY';
  workersPresent: number;
  workDone: string;
  incidentsOrAlerts?: string;
  materialsUsed?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  lotName: string; // Ex: Lot 2 : Gros Œuvre & Béton Armé
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progressPercentage: number;
  weight: number; // Pondération dans l'avancement global (%)
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  assignedToName: string;
  isMilestone?: boolean;
  createdAt: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  taskId?: string;
  uploaderName: string;
  photoUrl: string;
  caption: string;
  photoType: 'BEFORE' | 'DURING' | 'AFTER' | 'INCIDENT';
  takenDate: string;
  createdAt: string;
}

export type WorkerSpecialty =
  | 'CHEF_EQUIPE'
  | 'MACON'
  | 'FERRAILLEUR'
  | 'COFFREUR'
  | 'MANOEUVRE'
  | 'ELECTRICIEN'
  | 'PLOMBIER'
  | 'CARRELEUR';

export type WorkerContractType = 'JOURNALIER' | 'TACHERON' | 'MENSUEL';

export interface Worker {
  id: string;
  companyId: string;
  projectId: string;
  matricule: string;
  fullName: string;
  phone: string;
  specialty: WorkerSpecialty;
  specialtyLabel: string;
  contractType: WorkerContractType;
  dailyRateXAF: number;
  cniNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'LATE' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  companyId: string;
  projectId: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  hoursWorked: number;
  overtimeHours: number;
  amountEarnedXAF: number;
  isValidated: boolean;
  validatedBy?: string;
  notes?: string;
  updatedAt: string;
}

export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH' | 'BANK_TRANSFER';

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export interface PayrollAdvance {
  id: string;
  companyId: string;
  projectId: string;
  workerId: string;
  workerName: string;
  amountXAF: number;
  date: string;
  reason: string;
  paymentMethod: PaymentMethod;
  deductedInPayrollId?: string;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  companyId: string;
  projectId: string;
  workerId: string;
  workerMatricule: string;
  workerName: string;
  specialtyLabel: string;
  phone: string;
  periodLabel: string;
  daysWorked: number;
  dailyRateXAF: number;
  basePayXAF: number;
  overtimeHours: number;
  overtimePayXAF: number;
  bonusXAF: number;
  advancesDeductedXAF: number;
  grossPayXAF: number;
  netPayXAF: number;
  status: PayrollStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
  createdAt: string;
}

export type MaterialCategory =
  | 'LIANTS'
  | 'ACIERS'
  | 'GRANULATS'
  | 'MACONNERIE'
  | 'PLOMBERIE_ELEC'
  | 'BOIS_COFFRAGE'
  | 'CARBURANT';

export type StockMovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT';

export interface MaterialItem {
  id: string;
  companyId: string;
  reference: string;
  designation: string;
  category: MaterialCategory;
  categoryLabel: string;
  unit: string;
  depotLocation: string;
  currentStock: number;
  minimumStockAlert: number;
  unitPriceXAF: number;
  supplierName: string;
  lastMovementAt: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  materialId: string;
  materialReference: string;
  materialDesignation: string;
  unit: string;
  type: StockMovementType;
  quantity: number;
  unitPriceXAF: number;
  totalValueXAF: number;
  referenceDoc: string;
  operatorName: string;
  recipientName: string;
  notes?: string;
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ORDERED'
  | 'DELIVERED'
  | 'REJECTED';

export interface PurchaseOrderItem {
  id: string;
  materialId?: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPriceXAF: number;
  totalLineXAF: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  supplierName: string;
  supplierContact?: string;
  supplierPhone?: string;
  requestedByName: string;
  requestedByRole: UserRole;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  includeTVA: boolean;
  subtotalXAF: number;
  tvaXAF: number;
  totalAmountXAF: number;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 'PARTIAL' | 'COMPLETED' | 'DISPUTED';

export type DeliveryDestination = 'DEPOT' | 'DIRECT_SITE';

export interface DeliveryNoteItem {
  id: string;
  purchaseOrderItemId: string;
  materialId?: string;
  designation: string;
  unit: string;
  orderedQuantity: number;
  previouslyDeliveredQuantity: number;
  deliveredQuantity: number;
  damagedOrRejectedQuantity: number;
  unitPriceXAF: number;
  totalValueXAF: number;
  conformityNote?: string;
}

export interface DeliveryNote {
  id: string;
  companyId: string;
  deliveryNumber: string;
  supplierBlReference: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  supplierName: string;
  destination: DeliveryDestination;
  receivedByName: string;
  receivedByRole: UserRole;
  driverName?: string;
  truckPlate?: string;
  deliveryDate: string;
  status: DeliveryStatus;
  totalValueXAF: number;
  stockSynced: boolean;
  items: DeliveryNoteItem[];
  observations?: string;
  resolvedNote?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'MATERIAUX'
  | 'MAIN_OEUVRE'
  | 'ENGINS_CARBURANT'
  | 'SOUS_TRAITANCE'
  | 'FRAIS_CHANTIER'
  | 'DIVERS';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface ExpenseRecord {
  id: string;
  companyId: string;
  reference: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  category: ExpenseCategory;
  categoryLabel: string;
  title: string;
  beneficiary: string;
  amountXAF: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  invoiceRef?: string;
  expenseDate: string;
  status: ExpenseStatus;
  recordedByName: string;
  approvedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectBudgetLine {
  id: string;
  companyId: string;
  projectId: string;
  category: ExpenseCategory;
  categoryLabel: string;
  allocatedBudgetXAF: number;
}

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'SMS' | 'EMAIL';

export type NotificationCategory =
  | 'STOCK'
  | 'ACHATS_DG'
  | 'LIVRAISON_LITIGE'
  | 'BUDGET'
  | 'RH_PAIE'
  | 'SYSTEME';

export interface BtpNotification {
  id: string;
  companyId: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  projectCode?: string;
  projectName?: string;
  targetRoles: UserRole[];
  actionTargetStep?: 'step6' | 'step8' | 'step9' | 'step10' | 'step11' | 'step12' | 'step13';
  actionLabel?: string;
  channelsSent: NotificationChannel[];
  isRead: boolean;
  isArchived: boolean;
  isDynamic?: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  companyId: string;
  enableCriticalStockAlerts: boolean;
  enableDgApprovalAlerts: boolean;
  enableDeliveryDisputeAlerts: boolean;
  enableBudgetThresholdAlerts: boolean;
  enablePayrollAlerts: boolean;
  channels: {
    inApp: boolean;
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  whatsappNumber: string;
  digestEmail: string;
}

export type OfflineActionType = 'DAILY_LOG' | 'ATTENDANCE' | 'TASK_PROGRESS';

export type OfflineSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface OfflineQueueItem {
  id: string;
  companyId: string;
  actionType: OfflineActionType;
  projectId: string;
  projectCode: string;
  projectName: string;
  summary: string;
  payload: Record<string, any>;
  status: OfflineSyncStatus;
  createdAt: string;
  syncedAt?: string;
  errorMessage?: string;
}

export interface OfflineSyncReceipt {
  id: string;
  status: 'SYNCED' | 'FAILED';
  message: string;
  syncedAt: string;
}

export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export type SaaSInvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface SaaSPlanCatalog {
  id: SubscriptionPlan;
  name: string;
  targetAudience: string;
  monthlyPriceXAF: number;
  annualPriceXAF: number;
  maxProjects: number;
  maxUsers: number;
  recommended?: boolean;
  features: string[];
}

export interface SaaSInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  periodLabel: string;
  amountHTXAF: number;
  tvaXAF: number;
  amountTTCXAF: number;
  status: SaaSInvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
}

export type PaymentGatewayProvider = 'CAMPAY' | 'CINETPAY' | 'NONE';

export type PaymentTransactionStatus =
  | 'INITIATED'
  | 'PENDING_CONFIRMATION'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'EXPIRED';

export interface PaymentGatewayStatus {
  configured: boolean;
  activeProvider: PaymentGatewayProvider;
  providers: {
    campayConfigured: boolean;
    cinetpayConfigured: boolean;
  };
  supportedMethods: string[];
  webhookUrls: {
    campay: string;
    cinetpay: string;
  };
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  companyId: string;
  provider: PaymentGatewayProvider;
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
  amountXAF: number;
  status: PaymentTransactionStatus;
  externalReference?: string;
  paymentUrl?: string;
  ussdCode?: string;
  operator?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  company: Company;
}

export interface ApiStepLog {
  step: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  description: string;
}

export type SupplierCategory =
  | 'CIMENT_LIANTS'
  | 'ACIERS_FERRAILLAGE'
  | 'AGREGATS_CARRIERE'
  | 'QUINCAILLERIE_MEP'
  | 'BOIS_COFFRAGE'
  | 'CARBURANT_ENGINS'
  | 'BETON_PREFA';

export type SupplierPaymentTerms =
  | 'CASH_ON_DELIVERY'
  | 'ADVANCE_50'
  | 'NET_15'
  | 'NET_30'
  | 'NET_45';

export type SupplierStatus =
  | 'PREFERRED'
  | 'ACTIVE'
  | 'UNDER_REVIEW'
  | 'BLACKLISTED';

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  category: SupplierCategory;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  niu: string;
  rccm: string;
  paymentTerms: SupplierPaymentTerms;
  specialties: string;
  status: SupplierStatus;
  rating: number;
  notes?: string;
  createdAt: string;
}

export interface SupplierPerformanceMetrics {
  ordersCount: number;
  totalOrderedTTCXAF: number;
  deliveriesCount: number;
  conformDeliveriesCount: number;
  disputeDeliveriesCount: number;
  conformityRatePct: number | null;
  paidExpensesXAF: number;
  outstandingPayableXAF: number;
  lastOrderDate?: string;
}

export interface SupplierWithPerformance extends Supplier {
  metrics: SupplierPerformanceMetrics;
}

export type VaultDocumentCategory =
  | 'MARCHE_OS'
  | 'TECHNIQUE_PLANS'
  | 'CONTROLE_LABOGENIE'
  | 'FACTURE_FOURNISSEUR'
  | 'ADMINISTRATIF_CNPS';

export interface VaultDocumentRecord {
  id: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  reference: string;
  category: VaultDocumentCategory;
  documentDate: string;
  uploadedByName: string;
  uploadedByRole: UserRole;
  fileName: string;
  mimeType: string;
  fileSizeKB: number;
  dataBase64?: string;
  notes?: string;
  createdAt: string;
}

export interface SystemGeneratedDocument {
  id: string;
  category: 'BON_COMMANDE' | 'BON_LIVRAISON' | 'PAIE_OUVRIER' | 'FICHE_FOURNISSEUR' | 'FACTURE_SAAS';
  categoryLabel: string;
  reference: string;
  title: string;
  projectOrEntity: string;
  amountXAF?: number;
  date: string;
  statusLabel: string;
  downloadUrl: string;
}

