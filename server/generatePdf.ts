import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export function generateDocumentationPdf(): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const drawHeaderFooter = (pageNumber: number, totalPages: number = 17) => {
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('BATI-PILOT — Documentation Officielle & Technique du SaaS BTP', margin, 10);
    doc.text(`Page ${pageNumber} / ${totalPages} · Cameroun · FCFA (XAF)`, pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // ==========================================================================
  // --- PAGE 1 : PRÉSENTATION, ÉTAPE 1 (ARCHITECTURE) & ÉTAPE 2 (BDD 30 TABLES)
  // ==========================================================================
  drawHeaderFooter(1);

  // Bannière d'en-tête (Bleu nuit & Orange sécurité)
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(margin, y, contentWidth, 34, 'F');

  doc.setTextColor(249, 115, 22); // #F97316
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BATI-PILOT', margin + 6, y + 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('« Maîtrisez vos chantiers, contrôlez vos dépenses. »', margin + 6, y + 20);

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Guide Technique Officiel & Schémas Fonctionnels (Étapes 1 à 18 · Version Production)', margin + 6, y + 27);

  y += 40;

  // Fiche signalétique projet
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Marché cible :', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Entreprises BTP & Génie Civil en Afrique francophone (Douala, Yaoundé, Cameroun)', margin + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Paramètres :', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Devise : FCFA (XAF) · Fuseau : Africa/Douala · Architecture Multi-Tenant hermétique', margin + 28, y + 12);

  y += 24;

  // --- SECTION 1 : ÉTAPE 1 (ARCHITECTURE & MULTI-RÔLES) ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. ÉTAPE 1 : ARCHITECTURE MULTI-TENANT & RÔLES MÉTIERS', margin, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep1 =
    'Chaque entreprise cliente dispose d\'un identifiant unique (companyId) cloisonnant strictement ses données. ' +
    'Six rôles métiers BTP sont définis : Super Admin (Plateforme), Directeur Général (DG), Chef de chantier, ' +
    'Magasinier Dépôt, Responsable Paie/Comptable et Ouvrier journalier.';
  const splitS1 = doc.splitTextToSize(textStep1, contentWidth);
  doc.text(splitS1, margin, y);
  y += splitS1.length * 4 + 3;

  // Schéma visuel d'isolation Multi-Tenant
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('[TENANT 1 : SOCABAT Douala]        [TENANT 2 : SAHEL Yaoundé]        [TENANT 3 : BTP Kribi]', margin + 4, y + 6);
  doc.text(' ├── Chantiers Akwa & Laquintinie    ├── Voie Pavée Bastos             ├── Projets Port', margin + 4, y + 11);
  doc.text(' └── Données, Stocks & Salaires       └── Données, Stocks & Salaires    └── Données privées', margin + 4, y + 16);
  y += 24;

  // --- SECTION 2 : ÉTAPE 2 (BASE DE DONNÉES 30 TABLES) ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. ÉTAPE 2 : SCHÉMA RELATIONNEL NORMALISÉ (30 TABLES BTP)', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const textStep2 =
    'La base de données est modélisée avec 30 tables relationnelles (compatibles PostgreSQL/MySQL) réparties en 6 modules :\n' +
    '• Multi-Tenant : companies, subscriptions, users, permissions\n' +
    '• Chantiers & Suivi : projects, project_members, project_tasks, project_reports, project_photos\n' +
    '• RH, Pointage & Salaires : workers, attendance_records, payrolls, payroll_payments\n' +
    '• Matériaux & Stocks : materials, material_categories, warehouses, stock_movements\n' +
    '• Achats & Approvisionnement : suppliers, purchase_orders, purchase_order_items, deliveries, delivery_items\n' +
    '• Finances & Audit : expenses, expense_categories, budgets, notifications, audit_logs, schema_migrations';
  const splitS2 = doc.splitTextToSize(textStep2, contentWidth);
  doc.text(splitS2, margin, y);
  y += splitS2.length * 3.8 + 4;

  // Schéma relationnel ASCII des flux de données
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('companies ──(1:N)──> projects ──(1:N)──> project_reports & tasks (Avancement)', margin + 4, y + 6);
  doc.text('companies ──(1:N)──> workers  ──(1:N)──> attendance_records ──(1:N)──> payrolls (Salaires FCFA)', margin + 4, y + 11);
  doc.text('companies ──(1:N)──> materials──(1:N)──> stock_movements & purchase_orders (Achats BTP)', margin + 4, y + 16);

  // ==========================================================================
  // --- PAGE 2 : ÉTAPE 3 (MULTI-ENTREPRISES & ONBOARDING COLLABORATEURS)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(2);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ÉTAPE 3 : GESTION MULTI-ENTREPRISES & ONBOARDING COLLABORATEURS', margin, y);
  y += 6;

  // Grille des Formules commerciales
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('A. Formules Commerciales et Quotas de Ressources :', margin, y);
  y += 5;

  const plans = [
    { name: 'STARTER', limit: '2 Chantiers actifs · 5 Utilisateurs', desc: 'Idéal pour petits entrepreneurs et artisans BTP démarrant leur structuration.' },
    { name: 'PRO (Recommandé)', limit: '10 Chantiers actifs · 20 Utilisateurs', desc: 'Pour PME de BTP gérant plusieurs chantiers simultanés à Douala et Yaoundé.' },
    { name: 'ENTERPRISE', limit: 'Chantiers et Utilisateurs ILLIMITÉS', desc: 'Grandes entreprises de BTP, rapports personnalisés et support prioritaire.' },
  ];

  plans.forEach((p) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 11, 1, 1, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 65, 12);
    doc.text(p.name, margin + 4, y + 5);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(p.limit, margin + 35, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(p.desc, margin + 35, y + 9);

    y += 13;
  });

  y += 3;

  // Réponse aux questions de l'utilisateur sur l'invitation d'un collaborateur
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('B. Processus d\'Invitation & Accès des Collaborateurs :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237); // Fond doux orange
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 38, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Comment un collaborateur est-il invité, connecté et administré ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtOnboarding =
    '1. Mot de passe temporaire aléatoire ou personnalisé : Lors de l\'ajout, le système génère un mot de passe aléatoire (10 car., régénérable ou modifiable par le Directeur).\n' +
    '2. Fiche prête à partager & WhatsApp (wa.me) : Une carte récapitulative affiche le lien modifiable, l\'email et le mot de passe avec copie en 1 clic et envoi direct via WhatsApp.\n' +
    '3. Connexion directe sans contrainte : Le collaborateur accède immédiatement à son entreprise (sans changement obligatoire du mot de passe à la 1re connexion).\n' +
    '4. Suppression & Isolation stricte : Seuls le Directeur et le Chef de chantier peuvent supprimer un collaborateur ; le Super Admin est isolé et invisible côté client.';
  const splitOnb = doc.splitTextToSize(txtOnboarding, contentWidth - 8);
  doc.text(splitOnb, margin + 4, y + 12);
  y += 42;

  // Explication isolation & sécurité
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Gouvernance Super Admin / Clients & Partage du Lien :', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtEmailDev =
    '• Les comptes clients ne voient jamais la liste des autres entreprises ni le compte Super Administrateur dans leur équipe.\n' +
    '• En mode prévisualisation, le lien d\'invitation convertit automatiquement l\'URL privée en lien partagé et reste éditable pour votre domaine final.\n' +
    '• Un Chef de chantier peut consulter et supprimer les collaborateurs opérationnels, sans accès aux paramètres fiscaux ni à la suppression du DG.';
  const splitEmailDev = doc.splitTextToSize(txtEmailDev, contentWidth - 8);
  doc.text(splitEmailDev, margin + 4, y + 11.5);
  y += 29;

  // Schéma du flux de connexion
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('[1. Directeur invite + Mdp] -> [2. Copie / Partage WhatsApp] -> [3. Collaborateur se connecte]', margin + 4, y + 6);
  doc.text('                                                                           ↓', margin + 4, y + 10);
  doc.text('[5. Suppression possible par DG / Chef de Chantier] <-- [4. Espace Entreprise isole]', margin + 4, y + 15);

  // ==========================================================================
  // --- PAGE 3 : ÉTAPE 4 (GESTION DES RÔLES & PERMISSIONS FINES - EXPLICATION CLAIRE)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(3);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. ÉTAPE 4 : GESTION DES RÔLES & MATRICE INTERACTIVE DE PERMISSIONS', margin, y);
  y += 6;

  // EXPLICATION PÉDAGOGIQUE DU RÔLE DE LA MATRICE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('C\'est quoi la « Matrice Interactive des Rôles » et quel est son rôle ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtMatrixRole =
    'Dans une entreprise de BTP, le Directeur ne peut pas être présent sur tous les chantiers à la fois. ' +
    'La Matrice des Rôles agit comme le « Règlement Intérieur Numérique » et le « Tableau des Pouvoirs » de l\'entreprise :\n\n' +
    '1. Elle définit qui a le droit de faire quoi : qui peut signer un bon de commande de 3 millions FCFA, qui peut sortir du ciment du magasin, qui peut pointer les journaliers le matin.\n' +
    '2. Elle est « Interactive » : En tant que Directeur, vous pouvez cocher ou décocher une case en 1 clic pour accorder ou retirer un droit précis à un rôle sans toucher au code.\n' +
    '3. Elle protège l\'entreprise contre les fraudes et les malversations sur les chantiers.';
  const splitMatRole = doc.splitTextToSize(txtMatrixRole, contentWidth - 8);
  doc.text(splitMatRole, margin + 4, y + 13);
  y += 42;

  // SCHÉMA DU CIRCUIT D'APPROBATION BTP (SEGREGATION OF DUTIES)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Circuit d\'Approbation et de Séparation des Pouvoirs BTP :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [CHEF DE CHANTIER]                  [DIRECTEUR GÉNÉRAL (DG)]', margin + 4, y + 6);
  doc.text('  Déclare le besoin de 500 sacs ────> Seul habilité à VALIDER financièrement', margin + 4, y + 11);
  doc.text('                                            ↓ (Bon de commande validé)', margin + 4, y + 16);
  doc.text('  [COMPTABLE PAIE]                    [MAGASINIER DÉPÔT]', margin + 4, y + 20);
  doc.text('  Règle la facture du fournisseur <── Réceptionne & vérifie l\'absence de casses', margin + 4, y + 24);
  y += 30;

  // SCHÉMA DU MOTEUR RBAC (FONCTIONNEMENT TECHNIQUE DU CONTRÔLE D'ACCÈS)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma Fonctionnel du Moteur RBAC (Contrôle d\'Accès Dynamique) :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('   [Utilisateur connecté : Chef de chantier Paul]', margin + 4, y + 6);
  doc.text('                        ↓ clique sur "Valider bon de commande"', margin + 4, y + 10);
  doc.text('        [Intercepteur API : Vérifie la Matrice de l\'Entreprise]', margin + 4, y + 14);
  doc.text('             ├── Si droit absent ──> ✕ BLOCAGE : "Seul le DG peut engager l\'entreprise"', margin + 4, y + 19);
  doc.text('             └── Si droit présent ──> ✓ SUCCÈS : Opération enregistrée avec journal d\'audit', margin + 4, y + 23);
  y += 28;

  // ==========================================================================
  // --- PAGE 4 : ÉTAPE 5 (MODULE 1 : TABLEAU DE BORD EXÉCUTIF & MÉTRIQUES BTP)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(4);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('5. ÉTAPE 5 : MODULE 1 — TABLEAU DE BORD EXÉCUTIF & MÉTRIQUES BTP (FCFA)', margin, y);
  y += 6;

  // Description pédagogique du Tableau de bord
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rôle et Fonctionnement du Tableau de Bord Exécutif BATI-PILOT :', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtDash =
    'Le Tableau de Bord Exécutif est le poste de commandement du Directeur Général et des conducteurs de travaux. ' +
    'Il agrège instantanément les données des chantiers (saisies par les chefs de chantier, magasiniers et pointeurs) en 4 indicateurs vitaux :\n' +
    '1. Avancement Physique & Délais : Taux d\'avancement réel (%) comparé aux dates de livraison contractuelles.\n' +
    '2. Dépenses réelles vs Budget alloué (FCFA) : Alerte immédiate si un chantier dépasse les seuils d\'engagement.\n' +
    '3. Masse salariale journalière : Contrôle du pointage effectif du jour (ouvriers payés au jour le jour).\n' +
    '4. Visas de la Direction : Bons de commande en attente d\'approbation et alertes de rupture de stock.';
  const splitDash = doc.splitTextToSize(txtDash, contentWidth - 8);
  doc.text(splitDash, margin + 4, y + 13);
  y += 38;

  // SCHÉMA DU FLUX DÉCISIONNEL BTP DU TABLEAU DE BORD
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma Visuel du Flux Décisionnel & d\'Agrégation des Données :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [SOURCES TERRAIN (Mobile / Tablettes)]', margin + 4, y + 6);
  doc.text('   ├── Pointage du matin (Ouvriers présents) ──────┐', margin + 4, y + 10);
  doc.text('   ├── Sorties de stock (Ciment, Aciers, Sable) ───┼──> [MOTEUR BATI-PILOT]', margin + 4, y + 14);
  doc.text('   ├── Besoins de réapprovisionnement ─────────────┤    (Calculs en FCFA)', margin + 4, y + 18);
  doc.text('   └── Rapports hebdomadaires d\'avancement ───────┘            │', margin + 4, y + 22);
  doc.text('                                                                ▼', margin + 4, y + 25);
  doc.text('  [TABLEAU DE BORD EXÉCUTIF] ──> Visas DG en 1 clic + Alertes Stock + Pilotage Budgétaire', margin + 4, y + 28);
  y += 34;

  // STRUCTURE DES COÛTS & RATIOS BTP CAMEROUN
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Ratios Standards & Structure des Dépenses BTP (Afrique Centrale / Cameroun) :', margin, y);
  y += 5;

  const costBreakdown = [
    { cat: 'Liants & Ciments (CIMENCAM)', share: '32% des dépenses', note: 'Gros œuvre, bétonnage, semelles et dalles' },
    { cat: 'Aciers & Ferraillage (FOKOU)', share: '26% des dépenses', note: 'Fers torsadés HA 8, 10, 12, 14, 16 pour structures armées' },
    { cat: 'Main d\'œuvre journalière & Maçons', share: '22% des dépenses', note: 'Paiements quotidiens ou hebdomadaires des tâcherons' },
    { cat: 'Granulats (Sable Sanaga & Graviers)', share: '12% des dépenses', note: 'Livraisons par camions bennes 20m³ de carrières locales' },
    { cat: 'Carburant engins & Logistique', share: '8% des dépenses', note: 'Groupes électrogènes, grues mobiles et transporteurs' },
  ];

  costBreakdown.forEach((cb) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 65, 12);
    doc.text(cb.cat, margin + 4, y + 4.5);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(cb.share, margin + 70, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(cb.note, margin + 70, y + 8);

    y += 12;
  });

  y += 3;

  // ==========================================================================
  // --- PAGE 5 : ÉTAPE 6 (MODULE 2 : GESTION COMPLÈTE DES CHANTIERS & PROJETS)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('6. ÉTAPE 6 : MODULE 2 — GESTION COMPLÈTE DES CHANTIERS & PROJETS BTP', margin, y);
  y += 6;

  // Description pédagogique du Module Chantiers
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fonctionnalités Clés du Module de Gestion des Chantiers :', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtProj =
    'Le Module Chantiers est le cœur opérationnel de l\'entreprise de BTP. Il gère l\'intégralité du cycle de vie des ouvrages :\n' +
    '1. Création & Quotas SaaS : Ouverture d\'un chantier avec contrôle automatique des quotas selon la formule souscrite (Starter: 2, Pro: 10, Enterprise: illimité).\n' +
    '2. Géolocalisation Territoriale (GPS) : Cartographie précise des implantations (Douala, Yaoundé, Kribi, Bafoussam) et bases-vies.\n' +
    '3. Fiche 360° du Chantier : Suivi budgétaire individualisé en FCFA, affectation du conducteur de travaux et des effectifs journaliers.\n' +
    '4. Journal de Bord (Main Courante BTP) : Consignation quotidienne obligatoire des conditions météo, travaux réalisés, consommations et visites de contrôle.';
  const splitProj = doc.splitTextToSize(txtProj, contentWidth - 8);
  doc.text(splitProj, margin + 4, y + 13);
  y += 38;

  // SCHÉMA DU CYCLE DE VIE 360° D'UN CHANTIER BTP
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Cycle de Vie & Suivi 360° d\'un Chantier BTP :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [1. INITIALISATION]        [2. EXÉCUTION TERRAIN]       [3. LIVRAISON & CLÔTURE]', margin + 4, y + 6);
  doc.text('   • Signature du Marché      • Journal de bord quotidien   • Levée des réserves', margin + 4, y + 10);
  doc.text('   • Ordre de Service (OS)    • Pointage ouvriers (Matin)   • Réception provisoire', margin + 4, y + 14);
  doc.text('   • Affectation Conducteur   • Bons de commande & stocks   • Décompte Général Définitif', margin + 4, y + 18);
  doc.text('   • Budget alloué en FCFA    • Suivi % d\'avancement réel   • Réception définitive', margin + 4, y + 22);
  doc.text('             │                          │                             │', margin + 4, y + 25);
  doc.text('             └──────────────────────────┴─────────────────────────────┘──> [HISTORIQUE AUDIT]', margin + 4, y + 28);
  y += 34;

  // LE RÔLE DU JOURNAL DE BORD (MAIN COURANTE BTP)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Le Rôle Juridique & Technique du Journal de Bord Quotidien :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pourquoi le journal de bord est-il capital pour l\'entrepreneur de BTP ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtLegalLog =
    '• Preuve en cas de litige : En cas de retard de livraison, le relevé météo certifié (ex: averses torrentielles à Douala) justifie le report contractuel des délais auprès du client.\n' +
    '• Traçabilité des matériaux : Il atteste des sacs de ciment et barres de fer réellement coulés dans chaque dalle.\n' +
    '• Visites officielles : Les passages du bureau de contrôle (Labogénie), de la commune ou de l\'architecte y sont horodatés.';
  const splitLegalLog = doc.splitTextToSize(txtLegalLog, contentWidth - 8);
  doc.text(splitLegalLog, margin + 4, y + 12);
  y += 32;

  // ==========================================================================
  // --- PAGE 6 : ÉTAPE 7 (MODULE 3 : SUIVI AVANCEMENT, LOTS BTP & PHOTOS)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('7. ÉTAPE 7 : MODULE 3 — SUIVI DE L\'AVANCEMENT PHYSIQUE, LOTS & PHOTOS CHANTIER', margin, y);
  y += 6;

  // Explication pédagogique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 35, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pourquoi découper un chantier en Lots Techniques Pondérés ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtStep7 =
    'Un conducteur de travaux ne doit pas estimer l\'avancement d\'un immeuble « à l\'œil nu ». BATI-PILOT découpe chaque chantier en Lots BTP avec une pondération mathématique :\n' +
    '1. Lots & Planning Gantt : Chaque corps d\'état (Terrassement 20%, Gros Œuvre 35%, Maçonnerie 20%, Électricité 15%, Finitions 10%) possède ses dates et son responsable.\n' +
    '2. Recalcul Pondéré Automatique : Dès qu\'un chef met à jour un lot (ex: Gros œuvre passe à 60%), le taux global du chantier et du Tableau de bord est recalculé automatiquement.\n' +
    '3. Preuves Photos Avant / Pendant / Après : Chaque étape est documentée par des clichés horodatés prouvant l\'avancement réel au client et à la Direction Générale.';
  const splitS7 = doc.splitTextToSize(txtStep7, contentWidth - 8);
  doc.text(splitS7, margin + 4, y + 13);
  y += 39;

  // SCHÉMA DU CALCUL PONDÉRÉ & GANTT
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Calcul Automatique d\'Avancement Pondéré :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Lot 1 : Fondations]   Poids 20%  x  100% achevé  =  20.0 pts', margin + 4, y + 6);
  doc.text('  [Lot 2 : Gros Œuvre]   Poids 35%  x   55% achevé  =  19.2 pts', margin + 4, y + 11);
  doc.text('  [Lot 3 : Maçonnerie]   Poids 20%  x   15% achevé  =   3.0 pts  (⚠ En retard)', margin + 4, y + 16);
  doc.text('  [Lot 4 : Réseaux MEP]  Poids 15%  x    0% achevé  =   0.0 pts', margin + 4, y + 21);
  doc.text('  [Lot 5 : Finitions]    Poids 10%  x    0% achevé  =   0.0 pts', margin + 4, y + 25);
  doc.text('  ──────────────────────────────────────────────────────────────> TOTAL CHANTIER = 42%', margin + 4, y + 29);
  y += 36;

  // SCHÉMA GALERIE PHOTOS & CONTRÔLES LABOGÉNIE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Circuit de Preuve Photographique & Validation des Jalons :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(154, 52, 18);
  doc.text('  [Photo AVANT] ──> [Photo PENDANT (Ferraillage/Coulage)] ──> [Photo APRÈS (Réception)]', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const txtPhotoNote =
    'Les photos importées depuis le smartphone du chef de chantier servent de justificatif officiel pour débloquer les décomptes clients (acomptes sur situations de travaux) et contrôler la conformité à distance depuis le siège.';
  doc.text(doc.splitTextToSize(txtPhotoNote, contentWidth - 8), margin + 4, y + 14);
  y += 30;

  // Encadré transition vers Page 7
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 7 : Étape 8 — Module 4 (Gestion du Personnel & Pointage Quotidien des Ouvriers)', margin + 5, y + 9);

  // ==========================================================================
  // --- PAGE 7 : ÉTAPE 8 (MODULE 4 : PERSONNEL & POINTAGE QUOTIDIEN)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(7);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('8. ÉTAPE 8 : MODULE 4 — GESTION DU PERSONNEL & POINTAGE QUOTIDIEN', margin, y);
  y += 6;

  // Explication pédagogique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 35, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Comment le pointage numérique supprime les « ouvriers fantômes » sur chantier ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtStep8 =
    'Sur les chantiers BTP, la main d\'œuvre journalière représente 22% des coûts. Sans registre nominatif strict, les écarts de caisse et présences fictives explosent :\n' +
    '1. Répertoire Nominatif par Chantier : Chaque maçon, ferrailleur, coffreur ou manœuvre est immatriculé (SOC-001...) avec son taux journalier FCFA ; seuls le DG et le Chef de chantier peuvent supprimer un ouvrier.\n' +
    '2. Appel du Matin & Statuts Fins : Le chef de chantier pointe chaque matin en 1 clic (Présent, Demi-journée, Retard, Absent) + Heures supplémentaires (+25%).\n' +
    '3. Clôture & Export Paie : La feuille validée calcule le cumul sur 7 jours et s\'exporte en CSV pour alimenter directement le module Paie & Salaires.';
  const splitS8 = doc.splitTextToSize(txtStep8, contentWidth - 8);
  doc.text(splitS8, margin + 4, y + 13);
  y += 39;

  // SCHÉMA 1 : CIRCUIT D'APPEL DU MATIN & VALIDATION PAIE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Circuit Quotidien de Pointage & Contrôle Paie :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [07h30 : Appel Chef de Chantier] ──> [Statut : Présent / Demi-J / Retard / Absent]', margin + 4, y + 6);
  doc.text('                                                     ↓ (+ Heures Supp éventuelles)', margin + 4, y + 11);
  doc.text('  [Feuille Hebdo 7 Jours & CSV]   <── [17h30 : Clôture & Visa Feuille du Jour]', margin + 4, y + 17);
  doc.text('  (Transmis à la Comptabilité pour règlement des quinzaines / salaires en FCFA)', margin + 4, y + 22);
  y += 30;

  // SCHÉMA 2 : FORMULE DE CALCUL AUTOMATIQUE EN FCFA
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Règle de Calcul Automatique des Gains Journaliers (FCFA) :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(154, 52, 18);
  doc.text('  • Journée complète (Présent / Retard) : 100% du taux journalier (ex: 7 500 FCFA)', margin + 4, y + 7);
  doc.text('  • Demi-journée                        :  50% du taux journalier (ex: 3 750 FCFA)', margin + 4, y + 13);
  doc.text('  • Heures supplémentaires              :  + (Taux / 8h) x 1.25 x Nb Heures Supp', margin + 4, y + 19);
  doc.text('  • Absent                              :   0 FCFA (déduit automatiquement du cumul)', margin + 4, y + 25);
  y += 34;

  // Encadré transition vers Page 8
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 8 : Étape 9 — Module 5 (Paie & Salaires des Ouvriers en FCFA & Mobile Money)', margin + 5, y + 9);

  // ==========================================================================
  // --- PAGE 8 : ÉTAPE 9 (MODULE 5 : PAIE & SALAIRES DES OUVRIERS EN FCFA)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(8);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('9. ÉTAPE 9 : MODULE 5 — PAIE & SALAIRES DES OUVRIERS (FCFA & MOBILE MONEY)', margin, y);
  y += 6;

  // Explication pédagogique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 35, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Du pointage terrain au règlement Mobile Money sans erreur de caisse :', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtStep9 =
    'Le Module Paie transforme directement les feuilles de présence validées (Étape 8) en bulletins de salaire prêts au décaissement :\n' +
    '1. Synchronisation Automatique : Les jours travaillés et heures supplémentaires (+25%) alimentent le salaire brut de chaque ouvrier en FCFA.\n' +
    '2. Gestion des Avances & Primes : Les acomptes perçus en cours de quinzaine sont déduits automatiquement pour obtenir le Net à payer exact.\n' +
    '3. Paiement & Budget Chantier : Chaque salaire validé DG est payé par Orange Money, MTN MoMo, Caisse ou Virement avec reçu PDF et imputation au budget du chantier.';
  const splitS9 = doc.splitTextToSize(txtStep9, contentWidth - 8);
  doc.text(splitS9, margin + 4, y + 13);
  y += 39;

  // SCHÉMA 1 : FORMULE DE CALCUL DU BULLETIN DE QUINZAINE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma de Calcul du Net à Payer Ouvrier (FCFA) :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Pointage 7j] ──> (Base Jours x Taux) + (H.Supp x +25%) + (Primes Chantier)', margin + 4, y + 6);
  doc.text('                                         = SALAIRE BRUT (FCFA)', margin + 4, y + 11);
  doc.text('                                         - AVANCES / ACOMPTES PERÇUS', margin + 4, y + 16);
  doc.text('                                         = NET À PAYER (Bulletin PDF officiel)', margin + 4, y + 21);
  y += 30;

  // SCHÉMA 2 : CIRCUIT DE VALIDATION ET DÉCAISSEMENT MOBILE MONEY
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Circuit d\'Approbation DG, Mobile Money (OM/MoMo) & Imputation Budgétaire :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(154, 52, 18);
  doc.text('  [Brouillon Comptable] ──> [Visa DG : Bon à Payer] ──> [Règlement OM / MoMo / Cash]', margin + 4, y + 7);
  doc.text('                                                                 │', margin + 4, y + 12);
  doc.text('  [Budget Chantier mis à jour] <── [Réf. Transaction + Bulletin PDF signé]', margin + 4, y + 18);
  y += 30;

  // Encadré transition vers Page 9
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 9 : Étape 10 — Module 6 (Gestion des Stocks de Matériaux & Dépôt BTP)', margin + 5, y + 9);

  // ==========================================================================
  // --- PAGE 9 : ÉTAPE 10 (MODULE 6 : STOCKS DE MATÉRIAUX & DÉPÔT BTP)
  // ==========================================================================
  doc.addPage();
  y = margin;
  drawHeaderFooter(9);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('10. ÉTAPE 10 : MODULE 6 — GESTION DES STOCKS DE MATÉRIAUX & DÉPÔT BTP', margin, y);
  y += 6;

  // Explication pédagogique
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 35, 1.5, 1.5, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pourquoi verrouiller chaque sac de ciment et barre de fer entre Dépôt et Chantier ?', margin + 4, y + 6);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  const txtStep10 =
    'Les matériaux (ciment, acier HA, granulats, gasoil) représentent jusqu\'à 60% du coût d\'un chantier. BATI-PILOT élimine les coulages incontrôlés :\n' +
    '1. Catalogue Valorisé & Saisie Manuelle du P.U. : Le Directeur ou le Chef de chantier saisit librement le Prix Unitaire réel auquel chaque matériau est acheté ou sorti.\n' +
    '2. Entrées, Sorties & Contrôle de Disponibilité : Un Bon de Sortie (BS) bloque toute quantité supérieure au stock réel et génère un justificatif PDF signé.\n' +
    '3. Imputation Budgétaire Automatique : Dès qu\'un matériau sort du dépôt pour un chantier (ex: Akwa R+5), son coût (Qté x P.U. saisi) s\'impute au budget du projet.';
  const splitS10 = doc.splitTextToSize(txtStep10, contentWidth - 8);
  doc.text(splitS10, margin + 4, y + 13);
  y += 39;

  // SCHÉMA 1 : FLUX ENTRÉES / SORTIES DÉPÔT & IMPUTATION CHANTIER
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Circuit Dépôt Central — Bons de Sortie & Imputation Chantier :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Livraison CIMENCAM / FOKOU] ──> [Bon d\'Entree (BE)] ──> (+ Stock Depot & Valorisation)', margin + 4, y + 6);
  doc.text('                                                                    │', margin + 4, y + 11);
  doc.text('  [Budget Consomme Chantier] <── [Bon de Sortie (BS) PDF] <── (- Stock si dispo >= Qte)', margin + 4, y + 17);
  doc.text('  (+ Qte x P.U. FCFA sur projet)     (Signe Magasinier & Conducteur)', margin + 4, y + 23);
  y += 32;

  // SCHÉMA 2 : RÈGLE D'ALERTE RUPTURE & VALORISATION
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Règle de Surveillance Automatique des Seuils d\'Alerte (Zéro Rupture) :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(154, 52, 18);
  doc.text('  • Stock <= Seuil Minimum        : [CRITIQUE]  -> Alerte rouge + Reappro 1-clic', margin + 4, y + 7);
  doc.text('  • Seuil < Stock <= 1.35 x Seuil : [VIGILANCE] -> Prevoir commande fournisseur', margin + 4, y + 14);
  doc.text('  • Stock >  1.35 x Seuil         : [SECURISE]  -> Inventaire PDF & Suivi normal', margin + 4, y + 21);
  y += 30;

  // Transition Page 9 -> Page 10
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 10 : Étape 11 — Module 7 (Bons de Commande & Circuit d\'Approbation DG)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 10 : ÉTAPE 11 (MODULE 7 — BONS DE COMMANDE & VISA DG)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(10);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('11. ÉTAPE 11 : MODULE 7 — BONS DE COMMANDE & CIRCUIT D\'APPROBATION DG', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep11 =
    'Le Module 7 encadre les achats matériaux (BC-2026-...) avant engagement financier auprès des fournisseurs ' +
    '(CIMENCAM, FOKOU, QUIFEROU, DANGOTE). Conformément à la règle métier stricte, le Prix Unitaire (P.U.) en FCFA ' +
    'n\'est jamais rempli automatiquement : seul le Directeur Général ou le Chef de chantier saisit et ajuste manuellement ' +
    'le P.U. négocié sur chaque ligne de commande. Chaque bon suit un circuit d\'approbation rigoureux avec Visa DG obligatoire, ' +
    'option TVA 19,25% (Régime Réel Cameroun) et génération du Bon de Commande PDF officiel.';
  const splitS11 = doc.splitTextToSize(textStep11, contentWidth);
  doc.text(splitS11, margin, y);
  y += splitS11.length * 4 + 5;

  // Encadré fonctionnalités clés Module 7
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 11 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Création BC multi-lignes par chantier & fournisseur avec saisie manuelle obligatoire du P.U. (FCFA).', margin + 4, y + 14);
  doc.text('• Ajustement manuel des P.U. négociés avant envoi fournisseur (réservé DG, Chef de chantier, Super Admin).', margin + 4, y + 20);
  doc.text('• Circuit de validation : Brouillon -> Attente Visa DG -> Approuvé DG / Refusé (motif) -> Transmis.', margin + 4, y + 26);
  doc.text('• Calcul fiscal transparent : Total HT + TVA optionnelle 19,25% = Net à Commander TTC (FCFA).', margin + 4, y + 32);
  doc.text('• Édition du Bon de Commande PDF officiel (RC, NIU, tableau des articles, cadres signatures Demandeur & DG).', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : WORKFLOW D'APPROBATION DG
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Circuit de Validation — Demande d\'Achat jusqu\'au Bon de Commande :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Chef / DG : Saisie Lignes & P.U. Manuel] ──> [Attente Visa DG] ──> [Approuve DG]', margin + 4, y + 7);
  doc.text('                  │                                     │                    │', margin + 4, y + 13);
  doc.text('            (Brouillon)                           [Refuse DG]         [Transmis Fournisseur]', margin + 4, y + 19);
  doc.text('                                                  (Avec motif)        (+ Bon de Commande PDF)', margin + 4, y + 25);
  y += 35;

  // SCHÉMA 2 : CALCUL FINANCIER & CONTRÔLE P.U. MANUEL
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Règle de Calcul Financier & Contrôle du P.U. Manuel :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(154, 52, 18);
  doc.text('  • P.U. (FCFA)   : Saisie manuelle stricte (DG / Chef de chantier uniquement, 0 auto-remplissage)', margin + 4, y + 7);
  doc.text('  • Total HT      : Somme(Quantite x P.U. saisi) sur l\'ensemble des lignes du bon', margin + 4, y + 14);
  doc.text('  • Net TTC       : Total HT + (19.25% TVA si regime reel active) -> Engage apres Visa DG', margin + 4, y + 21);
  y += 33;

  // Transition Page 10 -> Page 11
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 11 : Étape 12 — Module 8 (Bons de Livraison & Réception Chantier/Dépôt)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 11 : ÉTAPE 12 (MODULE 8 — BONS DE LIVRAISON & RÉCEPTION STOCK)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(11);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('12. ÉTAPE 12 : MODULE 8 — BONS DE LIVRAISON & RÉCEPTION CHANTIER / DÉPÔT', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep12 =
    'Le Module 8 assure la traçabilité physique des livraisons fournisseurs (BL-2026-...) rattachées aux Bons de Commande ' +
    'approuvés par le DG. Le magasinier ou conducteur contrôle les quantités reçues conformes face au reliquat commandé, ' +
    'signale les avaries ou colis refusés, et déclenche automatiquement soit une Entrée en Stock Dépôt (Module 6), soit une ' +
    'imputation directe sur le budget consommé du chantier en cas de livraison directe sur site.';
  const splitS12 = doc.splitTextToSize(textStep12, contentWidth);
  doc.text(splitS12, margin, y);
  y += splitS12.length * 4 + 5;

  // Encadré fonctionnalités clés Module 8
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 12 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Contrôle physique à réception : N° BL fournisseur, nom chauffeur, immatriculation camion et date.', margin + 4, y + 14);
  doc.text('• Gestion multi-rotations : suivi précis du reliquat par ligne (Commandé - Déjà reçu = Reliquat).', margin + 4, y + 20);
  doc.text('• Synchronisation Dépôt / Chantier : entrée stock auto (BE-2026) ou imputation directe budget chantier.', margin + 4, y + 26);
  doc.text('• Signalement & clôture des litiges fournisseurs : saisie des quantités endommagées/refusées avec réserves.', margin + 4, y + 32);
  doc.text('• Édition du Bon de Livraison PDF officiel avec 3 cadres de signature (Chauffeur, Magasinier, Visa DG).', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : FLUX RÉCEPTION & SYNCHRONISATION STOCK / BUDGET
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma du Flux de Réception — Du Camion Fournisseur au Stock ou Chantier :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(30, 41, 59);
  doc.text('  [BC Approuve / Transmis] ──> [Controle BL & Quantites] ──> (Destination = DEPOT)  ──> (+ Stock Auto Module 6)', margin + 4, y + 7);
  doc.text('                                        │', margin + 4, y + 13);
  doc.text('                                  [Avarie > 0 ?]           ──> (Livraison DIRECTE) ──> (+ Budget Consomme Projet)', margin + 4, y + 19);
  doc.text('                                  (Statut LITIGE)              (Cloture auto BC si reliquat = 0)', margin + 4, y + 25);
  y += 35;

  // SCHÉMA 2 : RÈGLE DE CLÔTURE DES RELIQUATS & STATUTS BL
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Règle de Calcul des Statuts & Clôture Automatique des Commandes :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(154, 52, 18);
  doc.text('  • Avaries / Refus > 0                 : [LITIGE]   -> Reserves transporteur + Cloture avoir requise', margin + 4, y + 7);
  doc.text('  • Cumul Recu < Quantite Commandee     : [PARTIEL]  -> Reliquat ouvert pour prochaine rotation camion', margin + 4, y + 14);
  doc.text('  • Cumul Recu >= Quantite (0 avarie)   : [COMPLET]  -> Passe automatiquement le BC au statut LIVRE', margin + 4, y + 21);
  y += 33;

  // Transition Page 11 -> Page 12
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 12 : Étape 13 — Module 9 (Dépenses & Suivi Budgétaire Chantier)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 12 : ÉTAPE 13 (MODULE 9 — DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(12);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('13. ÉTAPE 13 : MODULE 9 — DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep13 =
    'Le Module 9 centralise le contrôle financier de chaque chantier en comparant en temps réel les enveloppes ' +
    'budgétaires prévues par poste (Matériaux, Main d\'œuvre, Engins & Carburant, Sous-traitance, Frais Généraux) ' +
    'face aux dépenses réellement consommées. Chaque dépense saisie manuellement suit le circuit de validation ' +
    '(En attente -> Bon à payer -> Décaissement Orange Money / MTN MoMo / Caisse / Virement) avant imputation automatique.';
  const splitS13 = doc.splitTextToSize(textStep13, contentWidth);
  doc.text(splitS13, margin, y);
  y += splitS13.length * 4 + 5;

  // Encadré fonctionnalités clés Module 9
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 13 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Journal des dépenses multi-chantiers avec saisie manuelle stricte des montants FCFA & pièces.', margin + 4, y + 14);
  doc.text('• Circuit comptable & DG : En attente -> Approuver (Bon à payer) -> Décaisser & Imputer au budget.', margin + 4, y + 20);
  doc.text('• Comparatif dynamique Prévu vs Réalisé par poste (Matériaux, Main d\'œuvre, Engins, Sous-traitance).', margin + 4, y + 26);
  doc.text('• Ajustement des enveloppes budgétaires par poste réservé au Directeur Général et au Comptable.', margin + 4, y + 32);
  doc.text('• Rapport Budgétaire PDF consolidé avec synthèse par chantier, ventilation par poste et visa DG.', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : MOTEUR D'AGRÉGATION BUDGÉTAIRE TEMPS RÉEL
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma d\'Agrégation Financière — Consolidation Automatique du Réalisé Chantier :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Sorties Stock (Etape 10)]  ──┐', margin + 4, y + 6.5);
  doc.text('  [Livraisons Directes (12)]  ──┼──> [Poste MATERIAUX]  ──┐', margin + 4, y + 12.5);
  doc.text('  [Paies Ouvriers (Etape 9)]  ──┴──> [Poste MAIN OEUVRE]──┼──> [Budget Realise Chantier FCFA]', margin + 4, y + 18.5);
  doc.text('  [Depenses Payees (Etape 13)] ────> [Engins/Sous-trait.]┘    (Comparatif Prevu vs Realise)', margin + 4, y + 25);
  y += 37;

  // SCHÉMA 2 : SEUILS D'ALERTE DE DÉPASSEMENT BUDGÉTAIRE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Règle de Vigilance & Alertes de Consommation Budgétaire :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(154, 52, 18);
  doc.text('  • Consommation < 70%        : [MAITRISE]   -> Execution conforme au budget previsionnel', margin + 4, y + 7);
  doc.text('  • 70% <= Consommation < 85% : [VIGILANCE]  -> Bandeau d\'alerte et suivi des engages', margin + 4, y + 14);
  doc.text('  • Consommation >= 85% / 100%: [CRITIQUE]   -> Risque de depassement + arbitrage DG requis', margin + 4, y + 21);
  y += 33;

  // Transition Page 12 -> Page 13
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 13 : Étape 14 — Module 10 (Annuaire, Performance & Conformité Fournisseurs)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 13 : ÉTAPE 14 (MODULE 10 — ANNUAIRE & PERFORMANCE FOURNISSEURS)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(13);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('14. ÉTAPE 14 : MODULE 10 — ANNUAIRE & PERFORMANCE FOURNISSEURS', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep14 =
    'Le Module 10 structure le référentiel des fournisseurs BTP (cimentiers, aciéries, quincailleries, carrières, loueurs ' +
    'd\'engins) avec leurs identifiants fiscaux camerounais (NIU, RCCM), conditions de règlement (Comptant, Net 15/30/45j) ' +
    'et calcule automatiquement leur fiabilité réelle à partir des Bons de Commande, Bons de Livraison et Dépenses payées.';
  const splitS14 = doc.splitTextToSize(textStep14, contentWidth);
  doc.text(splitS14, margin, y);
  y += splitS14.length * 4 + 5;

  // Encadré fonctionnalités clés Module 10
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 14 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Fiches fournisseurs complètes : NIU, RCCM, catégorie BTP, contacts, délai de paiement et note qualité.', margin + 4, y + 14);
  doc.text('• Volume TTC : cumul automatique en FCFA de tous les Bons de Commande (hors commandes rejetées).', margin + 4, y + 20);
  doc.text('• Encours FCFA : reste à payer calculé en temps réel (Commandes engagées moins Dépenses payées).', margin + 4, y + 26);
  doc.text('• Conformité BL (%) : ratio exact (BL conformes / Total BL) — affiche "N/A (0 BL)" tant qu\'aucun BL n\'existe.', margin + 4, y + 32);
  doc.text('• Dossier Fournisseur détaillé & Export PDF officiel + gestion des statuts (Préféré, Surveillance, Liste noire).', margin + 4, y + 38);
  y += 51;

  // SCHÉMA 1 : CALCUL DES INDICATEURS FOURNISSEURS
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 1 — Moteur de Scoring & Suivi Financier Fournisseur :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Bons de Commande != REJECTED] ---------> [Volume TTC (Chiffre confie FCFA)]', margin + 4, y + 7);
  doc.text('  [BC Valides/Livres - Depenses PAID] ----> [Encours Restant a Payer (FCFA)]', margin + 4, y + 14);
  doc.text('  [BL Conformes / Total BL (si > 0)] -----> [Taux Conformite BL %] (sinon N/A)', margin + 4, y + 21);
  doc.text('  [BL en Litige (DISPUTED)] --------------> [Alerte & Arbitrage Dossier Fournisseur PDF]', margin + 4, y + 28);
  y += 40;

  // SCHÉMA 2 : STATUTS & GOUVERNANCE ACHATS
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 2 — Gouvernance des Statuts Fournisseurs (DG / Comptable / Chef) :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(154, 52, 18);
  doc.text('  • [PREFERE / ACTIF]   : Fournisseur homologue prioritaire pour les demandes de prix', margin + 4, y + 7);
  doc.text('  • [SOUS SURVEILLANCE] : Ecarts ou retards BL repetes — validation DG renforcee', margin + 4, y + 14);
  doc.text('  • [LISTE NOIRE]       : Bloque en commande pour non-conformite grave ou litige non resolu', margin + 4, y + 21);
  y += 33;

  // Transition Page 13 -> Page 14
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 14 : Étape 15 — Module 11 (Rapports Direction & Coffre-Fort Pièces Justificatives)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 14 : ÉTAPE 15 (MODULE 11 — RAPPORTS & COFFRE-FORT JUSTIFICATIF)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(14);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('15. ÉTAPE 15 : MODULE 11 — RAPPORTS DIRECTION & COFFRE-FORT JUSTIFICATIF', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep15 =
    'Le Module 11 regroupe le Centre Documentaire Exécutif et le Coffre-Fort des Pièces Justificatives. Il consolide ' +
    'l\'ensemble des données opérationnelles et financières en rapports mensuels PDF/Word prêts pour la Direction, tout en ' +
    'archivant par chantier les contrats, plans, PV Labogénie, factures originales et pièces fiscales/CNPS.';
  const splitS15 = doc.splitTextToSize(textStep15, contentWidth);
  doc.text(splitS15, margin, y);
  y += splitS15.length * 4 + 5;

  // Encadré fonctionnalités clés Module 11
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 15 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Rapport Exécutif Mensuel consolidé : exports officiels PDF Direction et Word (.docx) filtrés par chantier.', margin + 4, y + 14);
  doc.text('• Export CSV Comptable unifié : journal des achats, paies et dépenses prêt pour la comptabilité OHADA.', margin + 4, y + 20);
  doc.text('• Coffre-Fort Pièces Justificatives : dépôt de scans/PDF (<= 4 Mo) classés en 5 dossiers métiers BTP.', margin + 4, y + 26);
  doc.text('• Sécurité documentaire : dépôt ouvert au terrain (DG, Chef, Magasinier, Comptable) ; suppression DG/Comptable.', margin + 4, y + 32);
  doc.text('• Index des Documents Générés par le Système : accès direct à tous les PDF BC, BL, Paie et Factures.', margin + 4, y + 38);
  y += 51;

  // SCHÉMA 1 : LES 5 DOSSIERS DU COFFRE-FORT
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 1 — Organisation du Coffre-Fort Pièces Justificatives (5 Dossiers BTP) :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(30, 41, 59);
  doc.text('  1. Marches & Ordres de Service   -> Contrats signes, OS de demarrage, avenants', margin + 4, y + 6.5);
  doc.text('  2. Plans Beton Arme & Topo       -> Plans d\'execution, ferraillage, leves terrain', margin + 4, y + 12.5);
  doc.text('  3. PV Labogenie & Qualite        -> Essais ecrasement beton, geotechnique', margin + 4, y + 18.5);
  doc.text('  4. Factures & Bordereaux Fourn.  -> Scans factures originales et preuves reglement', margin + 4, y + 24.5);
  doc.text('  5. CNPS, DGI & Assurances        -> Attestations fiscales, CNPS, polices chantier', margin + 4, y + 30.5);
  y += 39;

  // SCHÉMA 2 : SYNTHÈSE EXÉCUTIVE & EXPORTS
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 2 — Chaîne d\'Exports Direction & Audit Comptable :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(154, 52, 18);
  doc.text('  [Chantiers + Budgets + Paie + Stocks + Fournisseurs] -> [Rapport Executif PDF / DOCX]', margin + 4, y + 7);
  doc.text('  [Ecritures Payees & Commandes] ----------------------> [Export CSV Comptable OHADA]', margin + 4, y + 14);
  doc.text('  [Archives Coffre-Fort par Chantier] -----------------> [Telechargement Original / Fiche PDF]', margin + 4, y + 21);
  y += 33;

  // Transition Page 14 -> Page 15
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 15 : Étape 16 — Module 12 (Centre de Notifications & Alertes Métier BTP)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 15 : ÉTAPE 16 (MODULE 12 — NOTIFICATIONS & ALERTES MÉTIER BTP)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(15);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('16. ÉTAPE 16 : MODULE 12 — NOTIFICATIONS & ALERTES MÉTIER BTP', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep16 =
    'Le Module 12 déploie un moteur d\'alertes temps réel connecté à tous les modules actifs du SaaS : seuils de stocks critiques, ' +
    'bons de commande en attente de Visa DG, litiges à la réception BL, dépassements budgétaires chantiers et fiches de ' +
    'paie à décaisser, complété par une console de diffusion manuelle terrain.';
  const splitS16 = doc.splitTextToSize(textStep16, contentWidth);
  doc.text(splitS16, margin, y);
  y += splitS16.length * 4 + 5;

  // Encadré fonctionnalités clés Module 12
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 16 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Capteurs temps réel inter-modules (Stocks Etape 10, Visa DG 11, Litiges BL 12, Budgets 13, Paie 9).', margin + 4, y + 14);
  doc.text('• Liens d\'action directe vers le module cible pour solder l\'anomalie en un clic (navigation contextuelle).', margin + 4, y + 20);
  doc.text('• Console de diffusion manuelle terrain (Sécurité/EPI, toupie béton, consignes) avec ciblage par rôles.', margin + 4, y + 26);
  doc.text('• Filtrage multi-critères (Critique, Importante, Non lues, Catégorie, Filtrage strict selon le rôle actif).', margin + 4, y + 32);
  doc.text('• Paramétrage des canaux d\'escalade par entreprise (In-App, WhatsApp Business, SMS Terrain, Email Digest).', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : MOTEUR D'AGRÉGATION TEMPS RÉEL
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 1 — Moteur de Détection & Synchronisation Temps Réel Multi-Modules :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Stocks <= Seuil (10)] ----+', margin + 4, y + 6.5);
  doc.text('  [BC Attente Visa DG (11)] -+--> [syncDynamicNotifications()] --> [Calcul Gravite & Roles]', margin + 4, y + 12.5);
  doc.text('  [BL Litiges / Ecarts (12)]-+         |                                 |', margin + 4, y + 18.5);
  doc.text('  [Budget >= 70% / Dep. (13)]+         +--> Conservation Lu/Archive      v', margin + 4, y + 24.5);
  doc.text('  [Diffusions Terrain] ------+              & Suppression si resolu   [Centre Actionnable]', margin + 4, y + 30.5);
  y += 39;

  // SCHÉMA 2 : ESCALADE MULTICANAL PAR GRAVITÉ
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 2 — Matrice d\'Escalade Multicanal (In-App / WhatsApp / SMS / Email) :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(154, 52, 18);
  doc.text('  • [CRITIQUE]  (Rupture, Litige BL, Depassement) -> IN_APP + WHATSAPP + SMS + EMAIL', margin + 4, y + 7);
  doc.text('  • [IMPORTANTE](Visa DG >= 1M, Paie pretes)       -> IN_APP + WHATSAPP + EMAIL', margin + 4, y + 14);
  doc.text('  • [VIGILANCE / INFO] (Seuils 70%, Briefings EPI) -> IN_APP + EMAIL DIGEST', margin + 4, y + 21);
  y += 33;

  // Transition Page 15 -> Page 16
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 16 : Étape 17 — Module 13 (Mode Hors-Ligne / PWA Chantier)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 16 : ÉTAPE 17 (MODULE 13 — MODE HORS-LIGNE / PWA CHANTIER)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(16);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('17. ÉTAPE 17 : MODULE 13 — MODE HORS-LIGNE / PWA CHANTIER', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep17 =
    'Le Module 13 transforme BATI-PILOT en une Progressive Web App (PWA) installable sur Android, iOS et PC, ' +
    'dotee d\'un Service Worker (Workbox) et d\'une file d\'attente locale persistante. En zone blanche sans reseau 4G, ' +
    'le Chef de chantier continue ses saisies (journal, pointage ouvriers, avancement lots) puis la synchronisation ' +
    's\'effectue automatiquement des le retour de la connexion reseau vers le serveur.';
  const splitS17 = doc.splitTextToSize(textStep17, contentWidth);
  doc.text(splitS17, margin, y);
  y += splitS17.length * 4 + 5;

  // Encadré fonctionnalités clés Module 13
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 17 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Manifeste Web App complet (/manifest.webmanifest), icones 192/512/maskable et Apple Touch PNG 180px.', margin + 4, y + 14);
  doc.text('• Service Worker Workbox avec pre-cache applicatif et cache reseau API NetworkFirst (hors telechargements).', margin + 4, y + 20);
  doc.text('• Bouton "Installer App" dans le menu lateral gauche (sous Abonnements SaaS) + guide Safari iOS / Chrome.', margin + 4, y + 26);
  doc.text('• Bascule "Mode Hors-Ligne Manuel / Retablir Connexion" + saisie terrain resiliente en zone blanche.', margin + 4, y + 32);
  doc.text('• Synchronisation automatique des le retour 4G/Wi-Fi via POST /api/pwa/sync avec controle RBAC.', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : ARCHITECTURE DE RÉSILIENCE HORS-LIGNE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 1 — Flux Terrain Hors-Ligne & Synchronisation Différée :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Zone Blanche Chantier] ---> [Cache Pack Terrain] + [File Locale (PENDING)]', margin + 4, y + 6.5);
  doc.text('         (Sans 4G)                   |  Saisie Journal / Pointage / Lots BTP', margin + 4, y + 12.5);
  doc.text('                                     v', margin + 4, y + 18.5);
  doc.text('  [Retour Reseau 4G/Wi-Fi] --> [POST /api/pwa/sync] --> [Persistance Serveur + Recus SYNCED]', margin + 4, y + 24.5);
  doc.text('                                                     --> [Mise a jour Budget / Chantiers]', margin + 4, y + 30.5);
  y += 39;

  // SCHÉMA 2 : STRATÉGIE CACHE WORKBOX & INSTALLATION MOBILE
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 2 — Routage Service Worker & Installation Multi-Appareils :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(154, 52, 18);
  doc.text('  • Assets JS / CSS / HTML / Icones : [Pre-Cache Service Worker] -> Chargement instantane hors-ligne', margin + 4, y + 7);
  doc.text('  • Requetes GET /api/* (hors PDF)  : [NetworkFirst 4s -> Cache API] -> Donnees toujours visibles', margin + 4, y + 14);
  doc.text('  • Exports PDF/DOCX/ZIP (/api/down): [Exclus du Fallback SW] -> Telechargement direct integre', margin + 4, y + 21);
  y += 33;

  // Transition Page 16 -> Page 17
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Suite en Page 17 : Étape 18 — Module 14 (Abonnements SaaS & Facturation Multi-Tenant)', margin + 5, y + 8.5);

  // ==========================================================================
  // --- PAGE 17 : ÉTAPE 18 (MODULE 14 — ABONNEMENTS SAAS & FACTURATION)
  // ==========================================================================
  doc.addPage();
  drawHeaderFooter(17);
  y = margin;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('18. ÉTAPE 18 : MODULE 14 — ABONNEMENTS SAAS & FACTURATION MULTI-TENANT', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const textStep18 =
    'Le Module 14 cloture la plateforme BATI-PILOT avec la gestion commerciale multi-tenant : tarification FCFA en 3 paliers ' +
    '(Starter, Pro, Enterprise), suivi temps reel des quotas de chantiers actifs et d\'utilisateurs, encaissement Mobile Money ' +
    '(Orange Money / MTN MoMo / Virement) avec TVA Cameroun 19,25 %, factures PDF A4 officielles et console MRR/ARR Super Admin.';
  const splitS18 = doc.splitTextToSize(textStep18, contentWidth);
  doc.text(splitS18, margin, y);
  y += splitS18.length * 4 + 5;

  // Encadré fonctionnalités clés Module 14
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fonctionnalités livrées à l\'Étape 18 :', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text('• Grille tarifaire FCFA (Starter 35 000, Pro 95 000, Enterprise 240 000 HT/mois · Annuel -2 mois).', margin + 4, y + 14);
  doc.text('• Jauges quotas temps reel (chantiers actifs & comptes equipe) avec blocage retrogradation si depassement.', margin + 4, y + 20);
  doc.text('• Reglement reel Orange Money / MTN MoMo via passerelle CamPay (Push USSD) ou CinetPay Checkout + Webhooks.', margin + 4, y + 26);
  doc.text('• Export Facture SaaS PDF A4 officielle avec HT, TVA Cameroun 19,25 %, Net TTC et reference operateur.', margin + 4, y + 32);
  doc.text('• Console Super Admin Multi-Tenant : calcul MRR/ARR, rapprochement virement bancaire et activation clients.', margin + 4, y + 38);
  y += 49;

  // SCHÉMA 1 : FLUX DE SOUSCRIPTION & CONTRÔLE DE QUOTAS
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 1 — Flux Encaissement Réel (CamPay/CinetPay), Webhooks & Quotas :', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(30, 41, 59);
  doc.text('  [DG / Comptable] ---> [POST /api/subscriptions/payments/initiate + No +237 6XXXXXXXX]', margin + 4, y + 6.5);
  doc.text('                               |  Passerelle CamPay (USSD) ou CinetPay (Checkout v2)', margin + 4, y + 12.5);
  doc.text('                               v', margin + 4, y + 18.5);
  doc.text('  [Webhook / Check Serveur] -> [Confirmation SUCCESSFUL] -> [Facture PAID + Tenant ACTIVE]', margin + 4, y + 24.5);
  doc.text('  [Virement Bancaire]       -> [Facture PENDING] -> [Validation Super Admin + Export PDF A4]', margin + 4, y + 30.5);
  y += 39;

  // SCHÉMA 2 : MATRICE TARIFAIRE & QUOTAS MULTI-TENANT
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Schéma 2 — Matrice Commerciale Multi-Tenant & Gouvernance Plateforme :', margin, y);
  y += 5;

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(154, 52, 18);
  doc.text('  • STARTER    :  35 000 FCFA HT/mois -> Max 2 chantiers  ·  5 utilisateurs · PWA incluse', margin + 4, y + 7);
  doc.text('  • PRO        :  95 000 FCFA HT/mois -> Max 10 chantiers · 20 utilisateurs · RBAC & Paie OM/MoMo', margin + 4, y + 14);
  doc.text('  • ENTERPRISE : 240 000 FCFA HT/mois -> Chantiers & Utilisateurs ILLIMITES · SLA Prioritaire', margin + 4, y + 21);
  y += 33;

  // Encadré Synthèse Finale du Projet
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PLATEFORME BATI-PILOT COMPLETÉE (ÉTAPES 1 À 18 — VERSION PRODUCTION)', margin + 6, y + 7);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Interface epuree, isolation Super Admin/Clients, suppression equipe/ouvriers DG & Chef, PWA & Billing.', margin + 6, y + 13);

  // Sauvegarde du fichier sur le disque
  const outputPath = path.resolve(process.cwd(), 'BATI-PILOT_Documentation_Etapes_1_a_18.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  // Conserver aussi le nom générique
  fs.writeFileSync(path.resolve(process.cwd(), 'BATI-PILOT_Documentation_Officielle.pdf'), Buffer.from(pdfBytes));

  return outputPath;
}
