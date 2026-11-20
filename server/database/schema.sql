-- ============================================================================
-- BATI-PILOT — SCHÉMA RELATIONNEL DE LA BASE DE DONNÉES (DDL)
-- Système SaaS BTP Multi-Tenant pour l'Afrique Francophone (Cameroun, XAF)
-- Compatible PostgreSQL / MySQL / SQLite
-- ============================================================================

-- Table de suivi des migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 1. MULTI-TENANT & GESTION SAAS
-- ============================================================================

-- Entreprises clientes (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    legal_number VARCHAR(100), -- N° RC / Registre de Commerce & NIU Contribuable
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL, -- Ex: Douala, Yaoundé, Bafoussam
    country VARCHAR(100) DEFAULT 'Cameroun',
    currency VARCHAR(10) DEFAULT 'XAF', -- FCFA
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    logo_url TEXT,
    plan VARCHAR(20) DEFAULT 'PRO' CHECK (plan IN ('STARTER', 'PRO', 'ENTERPRISE')),
    max_projects INT DEFAULT 10,
    max_users INT DEFAULT 20,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'SUSPENDED')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Formules d'abonnements SaaS
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('STARTER', 'PRO', 'ENTERPRISE')),
    price_xaf DECIMAL(15, 2) NOT NULL, -- Prix mensuel en FCFA
    billing_period VARCHAR(20) DEFAULT 'MONTHLY' CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED')),
    payment_method VARCHAR(50), -- Ex: Mobile Money (MTN MoMo, Orange Money), Virement bancaire
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);

-- ============================================================================
-- 2. UTILISATEURS & CONTRÔLE D'ACCÈS RBAC
-- ============================================================================

-- Utilisateurs avec rôles métiers BTP
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'WORKER')),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    specialty VARCHAR(150), -- Ex: Ingénieur Génie Civil, Conducteur de Travaux
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Définition des permissions par rôle
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    role VARCHAR(30) NOT NULL,
    resource VARCHAR(50) NOT NULL, -- projects, workers, stock, expenses, reports
    action VARCHAR(20) NOT NULL,   -- create, read, update, delete, approve
    description VARCHAR(255),
    CONSTRAINT uq_role_permission UNIQUE (role, resource, action)
);

-- ============================================================================
-- 3. CHANTIERS & AVANCEMENT DES TRAVAUX
-- ============================================================================

-- Chantiers
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- Ex: CH-2026-DLA-01
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    description TEXT,
    start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    actual_end_date DATE,
    budget_total_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    budget_spent_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    manager_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL, -- Chef de chantier responsable
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('PREPARATION', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'CANCELLED')),
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_project_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);

-- Affectation des membres d'équipe aux chantiers
CREATE TABLE IF NOT EXISTS project_members (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_on_site VARCHAR(100) NOT NULL, -- Ex: Chef de chantier, Conducteur de travaux
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_members_proj ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_members_user ON project_members(user_id);

-- Tâches de chantier et planning
CREATE TABLE IF NOT EXISTS project_tasks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'DELAYED')),
    assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);

-- Rapports journaliers de chantier (remplis par le chef de chantier)
CREATE TABLE IF NOT EXISTS project_reports (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id),
    report_date DATE NOT NULL,
    weather VARCHAR(50), -- Ex: Ensoleillé, Forte pluie (saison des pluies), Nuageux
    workers_present_count INT DEFAULT 0,
    work_completed TEXT NOT NULL,
    work_in_progress TEXT,
    issues_and_delays TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_report_date UNIQUE (project_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON project_reports(report_date);

-- Photos de chantier (avant / pendant / après)
CREATE TABLE IF NOT EXISTS project_photos (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    report_id VARCHAR(64) REFERENCES project_reports(id) ON DELETE SET NULL,
    uploader_id VARCHAR(64) NOT NULL REFERENCES users(id),
    photo_url TEXT NOT NULL,
    caption VARCHAR(255),
    photo_type VARCHAR(20) DEFAULT 'DURING' CHECK (photo_type IN ('BEFORE', 'DURING', 'AFTER', 'INCIDENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. OUVRIERS, POINTAGE QUOTIDIEN & PAIE
-- ============================================================================

-- Ouvriers et journaliers de chantier
CREATE TABLE IF NOT EXISTS workers (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    matricule VARCHAR(50) NOT NULL, -- Ex: OUV-2026-001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    cni_number VARCHAR(50), -- Carte Nationale d'Identité
    specialty VARCHAR(100) NOT NULL, -- Maçon, Ferrailleur, Coffreur, Plombier, Électricien, Manœuvre
    hired_date DATE NOT NULL,
    remuneration_type VARCHAR(20) DEFAULT 'DAILY' CHECK (remuneration_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'TASK_BASED')),
    daily_rate_xaf DECIMAL(12, 2) NOT NULL, -- Ex: 5 000 FCFA / jour
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_worker_matricule UNIQUE (company_id, matricule)
);

CREATE INDEX IF NOT EXISTS idx_workers_company ON workers(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- Registre de pointage quotidien (avec détection de double pointage)
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worker_id VARCHAR(64) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    recorder_id VARCHAR(64) NOT NULL REFERENCES users(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'OVERTIME')),
    time_in TIME,
    time_out TIME,
    hours_worked DECIMAL(4, 2) DEFAULT 8.0,
    photo_proof_url TEXT,
    notes TEXT,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_worker_daily_attendance UNIQUE (worker_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON attendance_records(project_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance_records(worker_id);

-- Fiches de paie périodiques des ouvriers
CREATE TABLE IF NOT EXISTS payrolls (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_id VARCHAR(64) NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    days_worked DECIMAL(5, 2) NOT NULL DEFAULT 0,
    gross_amount_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Salaire brut calculé
    advances_deducted_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Acomptes déduits
    bonuses_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Primes
    deductions_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Retenues
    net_payable_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Montant net dû
    amount_paid_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    balance_remaining_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID')),
    generated_by VARCHAR(64) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payrolls_worker ON payrolls(worker_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON payrolls(period_start, period_end);

-- Historique traçable des paiements et acomptes
CREATE TABLE IF NOT EXISTS payroll_payments (
    id VARCHAR(64) PRIMARY KEY,
    payroll_id VARCHAR(64) NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    reference_code VARCHAR(100) NOT NULL UNIQUE, -- Réf paiement unique
    amount_xaf DECIMAL(15, 2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('ADVANCE', 'SALARY_BALANCE', 'BONUS')),
    payment_method VARCHAR(50) NOT NULL, -- Espèces, MTN Mobile Money, Orange Money, Virement
    receipt_url TEXT,
    paid_by VARCHAR(64) NOT NULL REFERENCES users(id),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. MATÉRIAUX, DÉPÔTS & GESTION DE STOCKS
-- ============================================================================

-- Catégories de matériaux BTP
CREATE TABLE IF NOT EXISTS material_categories (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ex: Liants (Ciment), Aciers & Ferraillage, Granulats (Sable/Gravier), Maçonnerie (Parpaings)
    description TEXT
);

-- Magasins et Dépôts (Dépôt Central ou Magasin de chantier)
CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL, -- NULL si Dépôt Central
    name VARCHAR(150) NOT NULL, -- Ex: Dépôt Central Bassa, Magasin Chantier Akwa
    location VARCHAR(255) NOT NULL,
    manager_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Catalogue des matériaux
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id VARCHAR(64) REFERENCES material_categories(id) ON DELETE SET NULL,
    reference VARCHAR(50) NOT NULL, -- Ex: MAT-CIM-42.5
    designation VARCHAR(255) NOT NULL, -- Ex: Ciment CPJ 42.5 CIMENCAM
    unit VARCHAR(30) NOT NULL, -- Sac 50kg, Barre 12m, Mètre cube (m³), Pièce, Litre, Tonne
    current_stock DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock_alert DECIMAL(12, 2) NOT NULL DEFAULT 10,
    unit_price_xaf DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Prix unitaire moyen FCFA
    default_supplier_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_material_ref UNIQUE (company_id, reference)
);

CREATE INDEX IF NOT EXISTS idx_materials_company ON materials(company_id);

-- Registre immuable des mouvements de stock (non supprimable)
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    material_id VARCHAR(64) NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('ENTRY', 'EXIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN', 'ADJUSTMENT')),
    quantity DECIMAL(12, 2) NOT NULL,
    stock_before DECIMAL(12, 2) NOT NULL,
    stock_after DECIMAL(12, 2) NOT NULL,
    unit_price_xaf DECIMAL(12, 2) DEFAULT 0,
    total_cost_xaf DECIMAL(15, 2) DEFAULT 0,
    beneficiary VARCHAR(150), -- Ex: Chef Maçon Joseph Kamga
    reason TEXT NOT NULL, -- Ex: Coulage dalle niveau R+2
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_mov_material ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_date ON stock_movements(created_at);

-- ============================================================================
-- 6. FOURNISSEURS, COMMANDES & BONS DE LIVRAISON
-- ============================================================================

-- Fournisseurs BTP
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Ex: FOKOU Bonabéri, SOREPCO Akwa, CIMENCAM
    contact_person VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address VARCHAR(255) NOT NULL,
    specialties TEXT, -- Ex: Quincaillerie lourde, Ciment, Fer, Bois
    rating DECIMAL(2, 1) DEFAULT 4.5, -- Note sur 5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);

-- Bons de commande (avec circuit de validation DG)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL, -- Ex: BC-2026-0042
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    requested_by VARCHAR(64) NOT NULL REFERENCES users(id),
    approved_by VARCHAR(64) REFERENCES users(id), -- Directeur ayant validé
    approval_date TIMESTAMP WITH TIME ZONE,
    subtotal_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_amount_xaf DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(25) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_company_order_number UNIQUE (company_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_company ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON purchase_orders(status);

-- Lignes de bon de commande
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id VARCHAR(64) NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_ordered DECIMAL(12, 2) NOT NULL,
    quantity_received DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unit_price_xaf DECIMAL(12, 2) NOT NULL,
    total_price_xaf DECIMAL(15, 2) NOT NULL
);

-- Bons de livraison et réceptions (constat des manquants et casses)
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    delivery_number VARCHAR(50) NOT NULL, -- Ex: BL-2026-0019
    order_id VARCHAR(64) REFERENCES purchase_orders(id) ON DELETE SET NULL,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id),
    receiver_id VARCHAR(64) NOT NULL REFERENCES users(id), -- Magasinier ou chef de chantier
    delivery_date DATE NOT NULL,
    supplier_bl_reference VARCHAR(100), -- N° du bon de livraison papier du fournisseur
    photo_proof_url TEXT,
    receiver_signature TEXT,
    status VARCHAR(20) DEFAULT 'COMPLETE' CHECK (status IN ('COMPLETE', 'PARTIAL', 'DISPUTED')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id VARCHAR(64) PRIMARY KEY,
    delivery_id VARCHAR(64) NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    material_id VARCHAR(64) NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_delivered DECIMAL(12, 2) NOT NULL,
    quantity_damaged DECIMAL(12, 2) NOT NULL DEFAULT 0,
    unit_price_xaf DECIMAL(12, 2) NOT NULL,
    notes TEXT
);

-- ============================================================================
-- 7. DÉPENSES & SUIVI BUDGÉTAIRE
-- ============================================================================

-- Catégories de dépenses de chantier
CREATE TABLE IF NOT EXISTS expense_categories (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL -- Matériaux, Salaires, Transport, Carburant, Location engins, Restauration
);

-- Dépenses engagées
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id VARCHAR(64) REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount_xaf DECIMAL(15, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- Espèces, Chèque, Virement, Mobile Money
    beneficiary VARCHAR(150) NOT NULL,
    invoice_proof_url TEXT,
    recorded_by VARCHAR(64) NOT NULL REFERENCES users(id),
    is_approved BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- ============================================================================
-- 8. NOTIFICATIONS & JOURNAL D'AUDIT SÉCURITÉ
-- ============================================================================

-- Notifications internes
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(30) NOT NULL, -- APPROVAL, STOCK_ALERT, BUDGET_ALERT, ATTENDANCE
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- Journal d'audit immuable (traçabilité de toutes les opérations sensibles)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- Ex: USER_LOGIN, PROJECT_CREATE, STOCK_EXIT, ORDER_APPROVED
    entity_name VARCHAR(50) NOT NULL, -- projects, stock_movements, payrolls
    entity_id VARCHAR(64),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_company_date ON audit_logs(company_id, created_at);
