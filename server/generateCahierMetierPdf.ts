import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export function generateCahierMetierPdf(): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const totalPages = 9;

  const drawHeaderFooter = (pageNumber: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  const addSectionTitle = (num: string, title: string, yPos: number): number => {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, yPos, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setFillColor(249, 115, 22);
    doc.rect(margin, yPos, 2.5, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${num}. ${title}`, margin + 5.5, yPos + 6.2);
    return yPos + 13;
  };

  const addSubTitle = (title: string, yPos: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(234, 88, 12);
    doc.text(title, margin, yPos);
    return yPos + 4.8;
  };

  const addParagraph = (text: string, yPos: number, fontSize = 8.6): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    return yPos + lines.length * 4.1 + 2.5;
  };

  const addBulletList = (items: string[], yPos: number, boxFill = false): number => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    const wrappedBlocks = items.map((it) => doc.splitTextToSize(`• ${it}`, contentWidth - 8));
    const totalLines = wrappedBlocks.reduce((sum, lines) => sum + lines.length, 0);
    const boxHeight = totalLines * 4 + items.length * 1.4 + 5;

    if (boxFill) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.5, 1.5, 'FD');
    }

    let cy = yPos + (boxFill ? 5.5 : 3);
    doc.setTextColor(30, 41, 59);
    wrappedBlocks.forEach((lines) => {
      doc.text(lines, margin + (boxFill ? 4 : 2), cy);
      cy += lines.length * 4 + 1.4;
    });

    return yPos + boxHeight + 3;
  };

  // ============================================================================
  // PAGE 1 : PAGE DE GARDE, SYNTHÈSE EXÉCUTIVE & SOMMAIRE
  // ============================================================================
  drawHeaderFooter(1);
  let y = 18;

  // Bandeau titre officiel
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 44, 2.5, 2.5, 'F');
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y, 4, 44, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(249, 115, 22);
  doc.text('CAHIER METIER & SPECIFICATIONS FONCTIONNELLES', margin + 9, y + 11);

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('PROJET BATI-PILOT', margin + 9, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text('Plateforme SaaS de Pilotage de Chantiers BTP, Logistique & Controle Financier', margin + 9, y + 30);

  doc.setFontSize(8.2);
  doc.setTextColor(148, 163, 184);
  doc.text('Marche cible : Entreprises BTP & Genie Civil · Cameroun / Zone CEMAC · Devise : FCFA (XAF)', margin + 9, y + 38);
  y += 51;

  // Cartouche d'identité projet
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(253, 186, 116);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(154, 52, 18);
  doc.text('Objet du document :', margin + 4, y + 6.5);
  doc.text('Perimetre couvert :', margin + 4, y + 12.5);
  doc.text('Regle financiere cle :', margin + 4, y + 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(67, 20, 7);
  doc.text('Reference contractuelle et metier decrivant les regles de gestion, circuits et roles de BATI-PILOT.', margin + 38, y + 6.5);
  doc.text('Gestion multi-entreprises, Chantiers, Pointage/Paie, Stocks, Achats, Livraisons, Budgets & Alertes.', margin + 38, y + 12.5);
  doc.text('Saisie manuelle stricte des Prix Unitaires (P.U.) & montants FCFA par les seuls profils habilites.', margin + 38, y + 18.5);
  y += 30;

  y = addSectionTitle('0', 'CONTEXTE, ENJEUX TERRAIN & OBJECTIFS STRATEGIQUES', y);
  y = addParagraph(
    'Les entreprises de BTP et de Genie Civil en Afrique francophone font face a quatre sources majeures de derapage financier et operationnel : (1) le coulage et la perte de materiaux entre le depot et les chantiers, (2) les pointages approximatifs ou fictifs de la main-d\'oeuvre journaliere, (3) le manque de visibilite instantanee sur la consommation budgetaire reelle par chantier, et (4) la lenteur de validation des achats entre le terrain et la Direction Generale.',
    y
  );

  y = addSubTitle('Objectifs operationnels de la solution BATI-PILOT :', y);
  y = addBulletList(
    [
      'Centraliser en temps reel l\'etat physique (avancement, photos, journal) et financier (engage, paye, reste a consommer) de chaque chantier.',
      'Rendre chaque mouvement de materiau et chaque franc depense (FCFA) tracable jusqu\'au responsable qui l\'a saisi ou valide.',
      'Instaurer un circuit strict de controle interne : Demande terrain -> Saisie P.U. autorisee -> Visa DG -> Reception physique -> Imputation budgetaire.',
      'Simplifier le paiement hebdomadaire ou a la quinzaine des ouvriers via Orange Money, MTN Mobile Money, Caisse ou Virement bancaire.',
      'Garantir la continuite d\'utilisation sur chantier meme en cas de coupure reseau (Mode Hors-Ligne PWA) et prevenir les risques par alertes proactives.',
    ],
    y,
    true
  );

  y = addSubTitle('Structure du present Cahier Metier :', y + 1);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 61, 2, 2, 'FD');

  const toc = [
    ['Page 2', 'Chapitre 1 : Gouvernance Multi-Entreprises, Securite & Matrice des 6 Roles Metiers'],
    ['Page 3', 'Chapitre 2 : Pilotage des Chantiers, Journal Quotidien, Lots BTP & Preuves Photos'],
    ['Page 4', 'Chapitre 3 : Personnel Ouvrier, Pointage Journalier & Paie Orange Money / MTN MoMo'],
    ['Page 5', 'Chapitre 4 : Chaine Logistique — Stocks Depot, Bons de Commande (Visa DG) & Livraisons'],
    ['Page 6', 'Chapitre 5 : Controle Financier — Depenses Chantier & Suivi Budgetaire Prevu vs Realise'],
    ['Page 7', 'Chapitre 6 : Pilotage Proactif — Alertes, PWA Hors-Ligne, Fournisseurs & Coffre-Fort'],
    ['Page 8', 'Chapitre 7 : Abonnements SaaS Multi-Tenant, Livrables PDF/Word & Recette Client'],
    ['Page 9', 'Chapitre 8 : Architecture Technique Utilisee & Justification pour le Projet BATI-PILOT'],
  ];

  let ty = y + 6.5;
  toc.forEach(([pg, label]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.3);
    doc.setTextColor(234, 88, 12);
    doc.text(pg, margin + 4, ty);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(label, margin + 20, ty);
    ty += 7.2;
  });

  // ============================================================================
  // PAGE 2 : CHAPITRE 1 — ARCHITECTURE MULTI-TENANT & MATRICE DES 6 RÔLES
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(2);
  y = 18;

  y = addSectionTitle('1', 'GOUVERNANCE MULTI-ENTREPRISES, SECURITE & ROLES METIERS', y);
  y = addParagraph(
    'BATI-PILOT repose sur une architecture Multi-Entreprises (Multi-Tenant) hermetique. Plusieurs societes BTP independantes peuvent utiliser la plateforme simultanement : chaque donnee (chantier, ouvrier, stock, bon de commande, facture, depense) est strictement rattachee a l\'identifiant unique de l\'entreprise. Aucune fuite ou lecture croisee n\'est possible entre deux entreprises.',
    y
  );

  y = addSubTitle('1.1 Les 6 Profils Metiers et leurs responsabilites', y);

  const rolesData: [string, string][] = [
    [
      'Directeur General (DG)',
      'Detient la vision strategique et financiere. Cree/supprime les collaborateurs et ouvriers, approuve les Bons de Commande (Visa DG), valide les depenses, ajuste les budgets, gere le Coffre-Fort et supervise les marges.',
    ],
    [
      'Chef de Chantier',
      'Responsable terrain. Tient le journal quotidien, lots BTP, photos, pointages, demandes d\'achats (P.U. manuel). Peut inviter/supprimer un collaborateur non-DG et creer/supprimer des ouvriers (sans acces aux parametres fiscaux ni RBAC).',
    ],
    [
      'Magasinier Depot',
      'Garant de l\'integrite physique des materiaux. Enregistre les entrees et sorties de stock avec affectation au chantier destinataire, controle les livraisons camions, signale les avaries/litiges BL et surveille les seuils de rupture.',
    ],
    [
      'Comptable / Resp. Paie',
      'Gere l\'execution financiere : calcule les paies ouvriers depuis les pointages, enregistre les acomptes, execute les paiements (OM/MoMo/Caisse/Virement), decaisse les depenses, ajuste les budgets et archive les justificatifs du Coffre-Fort.',
    ],
    [
      'Ouvrier Journalier',
      'Acces restreint a son espace personnel (consultation de ses presences, heures supplementaires et bulletins de paie). Aucun acces aux donnees financieres, commandes, budgets ou diffusions generales.',
    ],
    [
      'Super Admin (Plateforme — Strictement Isole)',
      'Administrateur technique SaaS invisible dans les listes d\'equipes clientes. Provisionne les entreprises, gere les plans et quotas SaaS. Ses actions de gestion d\'equipe restent hermetiques aux clients.',
    ],
  ];

  rolesData.forEach(([roleName, desc]) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const descLines = doc.splitTextToSize(desc, contentWidth - 8);
    const h = descLines.length * 3.8 + 9;
    doc.roundedRect(margin, y, contentWidth, h, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(roleName, margin + 4, y + 5.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(descLines, margin + 4, y + 9.5);
    y += h + 2.2;
  });

  y = addSubTitle('1.2 Matrice synthetique de controle d\'acces (RBAC)', y + 2);

  // Tableau compact RBAC
  const headers = ['Domaine Metier', 'DG', 'Chef Ch.', 'Magasinier', 'Comptable', 'Ouvrier'];
  const colWidths = [64, 22, 24, 24, 24, 20];
  const rows = [
    ['Equipe (Invit / Suppression / MDP)', 'Tout', 'Sauf DG', 'Bloque', 'Bloque', 'Aucun'],
    ['Chantiers, Lots & Photos', 'Tout', 'Terrain', 'Lecture', 'Lecture', 'Aucun'],
    ['Ouvriers (Creation / Suppr / Pointage)', 'Complet', 'Complet', 'Aucun', 'Lecture', 'Perso'],
    ['Calcul & Paiement Paie (OM/MoMo)', 'Visa', 'Lecture', 'Aucun', 'Complet', 'Recu'],
    ['Stocks Depot (Entrees / Sorties)', 'Lecture', 'Demande', 'Complet', 'Lecture', 'Aucun'],
    ['Saisie Prix Unitaires (P.U.)', 'Autorise', 'Autorise', 'Bloque', 'Bloque', 'Bloque'],
    ['Bons de Commande (Visa DG)', 'Visa DG', 'Creation', 'Lecture', 'Lecture', 'Aucun'],
    ['Bons de Livraison & Litiges BL', 'Arbitrage', 'Reception', 'Complet', 'Lecture', 'Aucun'],
    ['Depenses, Budgets & Coffre-Fort', 'Complet', 'Saisie', 'Aucun', 'Complet', 'Aucun'],
    ['Fournisseurs & Diffusion Alertes', 'Complet', 'Terrain', 'Stock/BL', 'Budget', 'Bloque'],
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  let cx = margin + 2;
  headers.forEach((h, i) => {
    doc.text(h, cx, y + 4.8);
    cx += colWidths[i];
  });
  y += 7;

  rows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6.2, 'FD');
    cx = margin + 2;
    r.forEach((cell, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(7.3);
      if (cell === 'Bloque' || cell === 'Aucun') {
        doc.setTextColor(148, 163, 184);
      } else if (cell === 'Autorise' || cell === 'Visa DG' || cell === 'Complet') {
        doc.setTextColor(22, 101, 52);
      } else {
        doc.setTextColor(51, 65, 85);
      }
      doc.text(cell, cx, y + 4.3);
      cx += colWidths[i];
    });
    y += 6.2;
  });

  // ============================================================================
  // PAGE 3 : CHAPITRE 2 — PILOTAGE CHANTIERS, AVANCEMENT & PHOTOS
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(3);
  y = 18;

  y = addSectionTitle('2', 'PILOTAGE DES CHANTIERS, JOURNAL TERRAIN & PREUVES PHOTOS', y);
  y = addParagraph(
    'Ce chapitre couvre le coeur operationnel quotidien des conducteurs de travaux et chefs de chantier : structurer chaque projet des sa signature, suivre l\'execution physique lot par lot et conserver un historique probant de tout ce qui se passe sur le site.',
    y
  );

  y = addSubTitle('2.1 Tableau de Bord Consolidé Direction (Module 1)', y);
  y = addBulletList(
    [
      'Vue synthetique multi-chantiers affichant le nombre de chantiers actifs, l\'effectif mobilise du jour, le budget global alloue vs realise en FCFA et le taux moyen d\'avancement physique.',
      'Indicateurs d\'alerte immediate sur les chantiers presentant un decalage entre avancement physique (%) et consommation budgetaire (%).',
      'Filtrage rapide par chantier ou par statut (Planifie, En cours, Suspendu, Acheve).',
    ],
    y,
    true
  );

  y = addSubTitle('2.2 Fiche Signaletique Chantier & Journal Quotidien (Module 2)', y);
  y = addBulletList(
    [
      'Chaque chantier possede un code unique (ex. CH-2026-DLA-01), un nom d\'ouvrage, un maitre d\'ouvrage (client), une ville/quartier, des coordonnees GPS (latitude/longitude), un Chef de chantier attitre, un budget previsionnel total (FCFA) et des dates debut/fin prevues.',
      'Journal de Chantier Quotidien : redige chaque fin de journee par le Chef de chantier. Consigne les conditions meteorologiques (Ensoleille, Pluie forte, Orage), l\'effectif present, les taches realisees, les livraisons recues et les eventuels incidents ou arrets de chantier.',
      'Historique chronologique inalterable permettant a la Direction Generale de verifier a distance l\'activite reelle sans attendre le rapport hebdomadaire.',
    ],
    y,
    true
  );

  y = addSubTitle('2.3 Decoupage par Lots Techniques BTP & Galerie Photos Horodatee (Module 3)', y);
  y = addBulletList(
    [
      'Decomposition de l\'ouvrage en lots techniques standard BTP : Installations & Terrassement, Fondations & Gros Oeuvre, Ferraillage & Coffrage, Maconnerie & Elevation, Plomberie & Electricite, Revetements & Finitions.',
      'Suivi du pourcentage d\'avancement (0 a 100 %) et du statut de chaque tache/lot (A faire, En cours, En retard, Termine). Le taux d\'avancement global du chantier est recalcule dynamiquement.',
      'Galerie Photos Terrain : import direct d\'images depuis le chantier (appareil photo smartphone ou fichier) avec titre, lot concerne, date/heure et auteur. Permet de justifier les decomptes clients et d\'attester la qualite d\'execution (ferraillage avant coulage, etancheite, etc.).',
    ],
    y,
    true
  );

  // Schéma workflow physique
  y = addSubTitle('2.4 Schema du circuit de remontee d\'information terrain', y + 1);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(30, 41, 59);
  doc.text('  [Chef de Chantier Terrain] ---> 1. Saisit Journal Quotidien (Meteo, Incidents, Effectif)', margin + 4, y + 7);
  doc.text('                             ---> 2. Met a jour % Lots BTP (Gros Oeuvre, Ferraillage...)', margin + 4, y + 13.5);
  doc.text('                             ---> 3. Ajoute Photos horodatees (Preuve avant coulage)', margin + 4, y + 20);
  doc.text('  [Direction Generale Siege] <--- Consolidation temps reel sur Tableau de Bord & Budget', margin + 4, y + 26.5);

  // ============================================================================
  // PAGE 4 : CHAPITRE 3 — PERSONNEL, POINTAGE & PAIE MOBILE MONEY
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(4);
  y = 18;

  y = addSectionTitle('3', 'PERSONNEL OUVRIER, POINTAGE & PAIE MOBILE MONEY', y);
  y = addParagraph(
    'La main-d\'oeuvre journaliere et tacheronne represente l\'un des postes de tresorerie les plus sensibles sur un chantier africain. BATI-PILOT supprime les feuilles volantes papier et lie directement chaque franc verse a un pointage nominal verifie.',
    y
  );

  y = addSubTitle('3.1 Repertoire Nominatif des Ouvriers & Pointage Quotidien (Module 4)', y);
  y = addBulletList(
    [
      'Repertoire complet des ouvriers par chantier : Matricule automatique (MAT-XXX), Nom & Prenoms, Qualification (Chef d\'equipe, Macon, Ferrailleur, Coffreur, Electricien, Plombier, Manoeuvre), Numero de telephone (Mobile Money), CNI et Taux Journalier en FCFA.',
      'Gouvernance stricte du repertoire : l\'ajout et la suppression d\'ouvriers (avec nettoyage automatique des pointages associes et recalcul de l\'effectif chantier) sont strictement reserves au Directeur General et au Chef de Chantier.',
      'Feuille de Pointage Journalier : saisie rapide des statuts (Present = 1 j, Demi-journee = 0.5 j, Absent = 0 j, Conge/Maladie) et des heures supplementaires effectuees.',
      'Exports PDF immediats depuis le chantier : (1) Bouton "PDF Pointage du Jour" avec tableau d\'emargement et signatures Chef de chantier / Controle, et (2) Bouton "PDF Repertoire des Ouvriers" recensant l\'ensemble de l\'equipe mobilisee.',
    ],
    y,
    true
  );

  y = addSubTitle('3.2 Moteur de Calcul de Paie, Acomptes & Paiement OM / MTN MoMo (Module 5)', y);
  y = addBulletList(
    [
      'Calcul automatise de la paie de periode (semaine ou quinzaine) a partir des pointages reels : Salaire de base = (Jours valides x Taux journalier) + Heures Supplementaires majorees a 125 %.',
      'Gestion des Acomptes / Avances sur salaire : toute avance versee en milieu de semaine est tracee avec motif et automatiquement deduite du Net a Payer lors de la cloture de paie.',
      'Primes exceptionnelles : possibilite d\'ajouter une prime de rendement ou de chantier (montant saisi manuellement par le responsable habilite).',
      'Circuit de validation financier : Calcule -> Approuve (Bon a payer) -> Paye.',
      'Modes de reglement adaptes au terrain camerounais : Orange Money (OM), MTN Mobile Money (MoMo), Especes Caisse chantier ou Virement bancaire, avec saisie de la reference de transaction.',
      'Imputation automatique : des qu\'une fiche passe au statut PAYE, son montant Net est impute sur le poste "Main d\'oeuvre" du budget du chantier.',
      'Edition du Bulletin de Paie PDF individuel (format professionnel avec detail heures, avances deduites, net percu en FCFA et cachet PAYE).',
    ],
    y,
    true
  );

  y = addSubTitle('3.3 Regle de calcul et chaine de validation de la Paie', y + 1);
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(253, 186, 116);
  doc.roundedRect(margin, y, contentWidth, 31, 1.5, 1.5, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(154, 52, 18);
  doc.text('  Formule : NET A PAYER = (Jours x Taux) + (H.Sup x (Taux/8) x 1.25) + Prime - Avances', margin + 4, y + 7.5);
  doc.text('  Circuit : [Pointage Jour (M4)] -> [Calcul Quinzaine] -> [Visa Approbation]', margin + 4, y + 14.5);
  doc.text('         -> [Reglement OM / MoMo / Caisse] -> [Bulletin PDF + Imputation Budget Chantier]', margin + 4, y + 21.5);
  doc.text('  Controle: Un ouvrier non pointe ne peut recevoir aucun bulletin de paie.', margin + 4, y + 27.5);

  // ============================================================================
  // PAGE 5 : CHAPITRE 4 — LOGISTIQUE MATÉRIAUX, P.U., COMMANDES & LIVRAISONS
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(5);
  y = 18;

  y = addSectionTitle('4', 'CHAINE LOGISTIQUE MATERIAUX, SAISIE P.U., ACHATS & LIVRAISONS', y);
  y = addParagraph(
    'La maitrise des couts materiaux (ciment, fer a beton, granulats, bois, carburant) exige une separation claire des pouvoirs entre celui qui commande, celui qui negocie le prix, celui qui approuve et celui qui receptionne physiquement la marchandise.',
    y
  );

  // Encart Règle P.U. Critique
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(margin, y, contentWidth, 21, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('REGLE METIER EXPRESSE — SAISIE MANUELLE DES PRIX UNITAIRES (P.U.) :', margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(127, 29, 29);
  const puLines = doc.splitTextToSize(
    'Aucun Prix Unitaire (P.U.) n\'est pre-rempli ou impose automatiquement par le systeme. Sur le terrain comme lors des achats, seuls le Directeur General ou le Chef de Chantier saisissent manuellement le P.U. reel negocie aupres du fournisseur.',
    contentWidth - 8
  );
  doc.text(puLines, margin + 4, y + 11.5);
  y += 26;

  y = addSubTitle('4.1 Stocks & Depot Central de Materiaux (Module 6)', y);
  y = addBulletList(
    [
      'Catalogue structure par familles BTP : Liants (Ciment 42.5, Chaux), Aciers (HA 8/10/12/14), Granulats (Sable Sanaga, Gravier 5/15 & 15/25), Maconnerie (Parpaings), Bois/Coffrage, Plomberie/Electricite et Carburant.',
      'Tracabilite des mouvements : chaque Entree, Sortie vers un chantier ou Ajustement d\'inventaire mentionne l\'operateur, le receptionnaire chantier, la reference document et la valorisation.',
      'Seuils d\'alerte parametrables : passage automatique en alerte "Stock Critique" ou "Rupture" lorsque le disponible descend sous le seuil minimal.',
    ],
    y,
    true
  );

  y = addSubTitle('4.2 Bons de Commande & Circuit d\'Approbation DG (Module 7)', y);
  y = addBulletList(
    [
      'Workflow strict : Brouillon -> En attente Visa DG -> Approuve DG (ou Refus motive) -> Commande Fournisseur -> Livre.',
      'Calcul automatique des totaux de lignes (Quantite x P.U. saisi manuellement) et gestion optionnelle de la TVA camerounaise (19,25 %).',
      'Edition du Bon de Commande Officiel en PDF avec mentions legales entreprise (RC / NIU), tableau detaille, cachet et signature DG.',
    ],
    y,
    true
  );

  y = addSubTitle('4.3 Bons de Livraison (BL) & Gestion des Litiges Transporteurs (Module 8)', y);
  y = addBulletList(
    [
      'Rapprochement automatique avec le Bon de Commande approuve : verification stricte des reliquats (livraisons partielles multi-rotations camions supportees).',
      'Double circuit de destination : (1) Livraison au Depot Central -> entree automatique en stock physique ; (2) Livraison Directe Chantier -> imputation directe sur le budget materiaux du chantier sans passage par le magasin central.',
      'Controle conformite & Litiges : saisie des quantites conformes et des quantites avariees/refusees. Tout ecart bascule le BL en statut LITIGE jusqu\'a regularisation par avoir ou relivraison.',
      'Cloture automatique du Bon de Commande au statut LIVRE des que 100 % des quantites sont receptionnees sans litige non resolu.',
    ],
    y,
    true
  );

  // ============================================================================
  // PAGE 6 : CHAPITRE 5 — DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(6);
  y = 18;

  y = addSectionTitle('5', 'CONTROLE FINANCIER, DEPENSES & SUIVI BUDGETAIRE CHANTIER', y);
  y = addParagraph(
    'Ce module constitue le tableau de bord financier du Directeur General et du Comptable. Il garantit que toutes les sorties d\'argent — qu\'elles proviennent des materiaux consommes, des salaires ouvriers ou des frais directs sur chantier — convergent vers une vue unique Prevu vs Realise.',
    y
  );

  y = addSubTitle('5.1 Moteur d\'Agregation Budgetaire en Temps Reel (Module 9)', y);
  y = addBulletList(
    [
      'Chaque chantier est decoupe en 6 postes budgetaires de reference : (1) Materiaux, (2) Main d\'oeuvre, (3) Engins & Carburant, (4) Sous-traitance, (5) Frais generaux de chantier, (6) Divers & Imprevus.',
      'Le montant "Realise" par chantier est calcule automatiquement a partir de 4 flux authentifies :',
      '  - Flux A (Sorties Stock Depot) : valeur des materiaux sortis du magasin vers le chantier -> Poste Materiaux.',
      '  - Flux B (Livraisons Directes Chantier) : valeur des BL livres directement sur site -> Poste Materiaux.',
      '  - Flux C (Paies Ouvriers Payees) : bulletins de paie regles en OM/MoMo/Caisse -> Poste Main d\'oeuvre.',
      '  - Flux D (Depenses Directes Payees) : locations d\'engins, gasoil, sous-traitants, autorisations, frais de site.',
    ],
    y,
    true
  );

  y = addSubTitle('5.2 Circuit de Validation & Decaissement des Depenses Directes', y);
  y = addBulletList(
    [
      'Saisie manuelle obligatoire du montant en FCFA, du beneficiaire, du numero de facture/recu et de l\'imputation chantier.',
      'Circuit anti-fraude a 3 etapes : En attente -> Approuve ("Bon a payer" par DG ou Comptable) -> Decaisse (saisie du mode OM / MTN MoMo / Caisse / Virement et reference piece) ou Refuse avec motif.',
      'Ajustement encadre des enveloppes budgetaires par poste : strictement reserve au Directeur General et au Comptable.',
      'Export du Rapport Budgetaire PDF consolidant la synthese multi-chantiers, le comparatif Prevu vs Realise par poste et le journal des depenses.',
    ],
    y,
    true
  );

  y = addSubTitle('5.3 Regles de Vigilance & Seuils d\'Alerte de Depassement', y + 1);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(30, 41, 59);
  doc.text('  • Consommation < 70 %          : [MAITRISE]    Execution conforme a l\'enveloppe prevue', margin + 4, y + 7.5);
  doc.text('  • 70 % <= Consommation < 85 %  : [VIGILANCE]   Alerte preventive envoyee au Chef & Comptable', margin + 4, y + 14.5);
  doc.text('  • 85 % <= Consommation < 100 % : [CRITIQUE]    Arbitrage Direction Generale requis', margin + 4, y + 21.5);
  doc.text('  • Consommation >= 100 %        : [DEPASSEMENT] Blocage analytique & alerte rouge DG', margin + 4, y + 28.5);

  // ============================================================================
  // PAGE 7 : CHAPITRE 6 — ALERTES TEMPS RÉEL, MODE HORS-LIGNE PWA & COMPLÉMENTS
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(7);
  y = 18;

  y = addSectionTitle('6', 'PILOTAGE PROACTIF : ALERTES, HORS-LIGNE PWA & FOURNISSEURS', y);
  y = addParagraph(
    'Pour repondre aux contraintes reelles des chantiers camerounais (connectivite instable en zone reculee, urgence des arbitrages a distance), la plateforme integre des modules de reactivite et de resilience terrain.',
    y
  );

  y = addSubTitle('6.1 Centre de Notifications & Alertes Metier BTP (Module 12 — Operationnel)', y);
  y = addBulletList(
    [
      'Capteurs temps reel connectes a toute la plateforme : detection automatique des stocks sous seuil critique, Bons de Commande en attente de Visa DG, litiges de reception BL, depassements budgetaires (>= 70 %) et paies en attente.',
      'Navigation actionnable : chaque alerte comporte un bouton direct vers le module concerne pour traiter l\'anomalie en un clic. Des que l\'anomalie est reglee (ex. BC valide ou litige clos), l\'alerte disparait automatiquement.',
      'Console de Diffusion Terrain : permet a l\'encadrement de diffuser des consignes urgentes (securite/EPI, arrivee toupie beton, controle qualite) vers des roles et chantiers cibles.',
      'Escalade Multicanal configurable par entreprise : In-App, passerelle WhatsApp Business (ou envoi direct sur vrai numero WhatsApp selon integration choisie), SMS d\'urgence terrain et Email de synthese Direction.',
    ],
    y,
    true
  );

  y = addSubTitle('6.2 Mode Hors-Ligne / PWA Chantier (Module 13 — Operationnel)', y);
  y = addBulletList(
    [
      'Installation directe PC/Android/iOS depuis le bouton "Installer App" du menu lateral gauche (sous Abonnements SaaS), avec assistant guide Safari/Chrome sans passer par les stores.',
      'Bascule manuelle de test & resilience : boutons "Tester Hors-Ligne" et "Retablir Connexion" pour simuler une zone blanche ou forcer la resynchronisation immediate de la file locale chiffree (pointages, journaux, avancement).',
    ],
    y,
    true
  );

  y = addSubTitle('6.3 Fournisseurs (Module 10) & Rapports / Coffre-Fort Justificatif (Module 11)', y);
  y = addBulletList(
    [
      'Annuaire & Performance Fournisseurs (Module 10 — Operationnel) : fiches fournisseurs (NIU, RCCM, delai paiement), suivi du Volume TTC cumule (montant global commande TVA 19,25 % incluse), Encours a payer (FCFA), et taux de Conformite BL (affiche "N/A" tant qu\'aucun BL n\'est receptionne).',
      'Rapports Direction & Coffre-Fort Pieces Justificatives (Module 11 — Operationnel) : archivage numerique probant jusqu\'a 4 Mo/piece classe en 5 dossiers BTP (Factures Fournisseurs, Bons de Livraison Signes, Quittances Mobile Money, Contrats & Avenants, Decomptes Clients), avec suppression reservee au DG et au Comptable.',
      'Onboarding Collaborateurs simplifie : attribution d\'un mot de passe temporaire (aleatoire ou personnalise), partage direct par copie 1-clic ou WhatsApp (wa.me) et acces immediat sans blocage.',
    ],
    y,
    true
  );

  // ============================================================================
  // PAGE 8 : CHAPITRE 7 — ABONNEMENTS SAAS, LIVRABLES PDF & RECETTE CLIENT
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(8);
  y = 18;

  y = addSectionTitle('7', 'MODELE SAAS, LIVRABLES PDF & CRITERES DE RECETTE CLIENT', y);

  y = addSubTitle('7.1 Abonnements SaaS & Facturation Multi-Entreprises (Module 14)', y);
  y = addBulletList(
    [
      'Plans tarifaires adaptes aux PME et majors du BTP (facturation mensuelle ou annuelle en FCFA) : Starter (jusqu\'a 3 chantiers), Croissance (10 chantiers + multi-depots), Entreprise (chantiers illimites + support dedie).',
      'Controle des quotas en temps reel (nombre de chantiers actifs, comptes utilisateurs, espace photos) et gestion du statut d\'abonnement (Essai gratuit, Actif, Suspendu).',
    ],
    y,
    true
  );

  y = addSubTitle('7.2 Synthese du Flux Operationnel Global de Bout en Bout', y);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(253, 186, 116);
  doc.text('  [1. Creation Chantier + Enveloppe FCFA] -> [2. Mobilisation Ouvriers + Pointage PDF]', margin + 4, y + 7.5);
  doc.setTextColor(226, 232, 240);
  doc.text('  -> [3. Demande Achat + P.U. Manuel + Visa DG] -> [4. Reception BL (Depot ou Direct Site)]', margin + 4, y + 14.5);
  doc.text('  -> [5. Sorties Stock + Paies OM/MoMo + Depenses] -> [6. Suivi Budget Prevu vs Realise]', margin + 4, y + 21.5);
  doc.setTextColor(134, 239, 172);
  doc.text('  -> [7. Alertes Temps Reel + Mode Hors-Ligne PWA + Rapports PDF Officiels Direction]', margin + 4, y + 28.5);
  y += 40;

  y = addSubTitle('7.3 Catalogue des Livrables Documentaires PDF, Word & CSV generes par BATI-PILOT', y);
  y = addBulletList(
    [
      'Feuille de Pointage Journalier PDF (emargement terrain) & Repertoire Officiel des Ouvriers PDF.',
      'Bulletins de Paie Individuels PDF avec decomposition heures sup, avances et reference OM/MoMo.',
      'Bons de Commande Officiels PDF (P.U., TVA 19,25 %, Visa DG) & Bons de Livraison PDF (ecarts/avaries).',
      'Rapport Budgetaire Consolidé PDF, Fiches Performance Fournisseurs PDF & Factures SaaS A4 PDF.',
      'Rapports Mensuels Direction PDF & Word (.docx), plus Export Comptable CSV (depenses & paies OHADA).',
    ],
    y,
    true
  );

  y = addSubTitle('7.4 Protocole de Recette & Mise en Production chez le Client', y);
  y = addBulletList(
    [
      'Etape A — Validation du present Cahier Metier et confirmation des regles de validation interne (seuils Visa DG, canaux WhatsApp/SMS).',
      'Etape B — Verification sur environnement de demonstration avec les 6 roles utilisateurs (DG, Chef de chantier, Magasinier, Comptable, Ouvrier, Admin).',
      'Etape C — Reprise des donnees initiales de l\'entreprise cliente (chantiers en cours, enveloppes budgetaires par poste, inventaire depot, liste ouvriers).',
      'Etape D — Deploiement sur serveur de production, formation pratique des equipes terrain (3h) et ouverture officielle.',
    ],
    y,
    true
  );

  // ============================================================================
  // PAGE 9 : CHAPITRE 8 — ARCHITECTURE TECHNIQUE UTILISÉE & ADEQUATION PROJET
  // ============================================================================
  doc.addPage();
  drawHeaderFooter(9);
  y = 18;

  y = addSectionTitle('8', 'ARCHITECTURE TECHNIQUE UTILISEE & ADEQUATION AU PROJET', y);
  y = addParagraph(
    'Pour repondre aux exigences de rapidite, de fiabilite financiere et d\'utilisation sur le terrain (chantiers a connectivite limitee et bureaux de Direction Generale), le projet BATI-PILOT s\'appuie sur une Architecture Web Moderne Client-Serveur Decouplee (SPA + API REST) en Mode SaaS Multi-Tenant et Progressive Web App (PWA).',
    y
  );

  y = addSubTitle('8.1 Les 4 couches principales de l\'architecture retenue', y);
  y = addBulletList(
    [
      'Couche Presentation (Frontend SPA React + TypeScript + Tailwind CSS) : interface reactive unique qui s\'adapte automatiquement aux grands ecrans du Siege (DG, Comptable) comme aux smartphones Android/iOS sur chantier (Chef de chantier, Magasinier).',
      'Couche Metier & API REST (Backend Node.js / Express + TypeScript) : serveur centralisant l\'authentification, les controles d\'acces par role (RBAC), la validation des circuits financiers (Visa DG, Paie, Depenses) et l\'agregation budgetaire en temps reel.',
      'Architecture Multi-Tenant Cloisonnee : chaque donnee est isolee par identifiant d\'entreprise (companyId), permettant de heberger plusieurs societes BTP ou filiales sur une meme infrastructure sans aucun risque de melange.',
      'Couche Resilience Hors-Ligne (PWA / Service Worker) & Moteur PDF : stockage temporaire local sur le terrain en l\'absence de reseau Internet avec synchronisation differee, et generation automatisee de documents PDF officiels.',
    ],
    y,
    true
  );

  y = addSubTitle('8.2 Schema d\'architecture technique globale', y);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 34, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.1);
  doc.setTextColor(253, 186, 116);
  doc.text('  [Utilisateurs Terrain & Siege : PC / Tablette / Mobile PWA]', margin + 4, y + 7);
  doc.setTextColor(226, 232, 240);
  doc.text('         |  (HTTPS / JSON + Cache Hors-Ligne Service Worker)', margin + 4, y + 13.5);
  doc.text('         v', margin + 4, y + 18.5);
  doc.text('  [Serveur API REST Express/Node.js] ---> [Controle RBAC & Regles Metier FCFA]', margin + 4, y + 24);
  doc.setTextColor(134, 239, 172);
  doc.text('         |---> [Donnees Multi-Tenant (companyId)]  +  [Moteur Export PDF Officiels]', margin + 4, y + 30);
  y += 39;

  y = addSubTitle('8.3 Pourquoi cette architecture correspond parfaitement a ce projet BTP ?', y);
  y = addBulletList(
    [
      '1. Deploiement immediat sans installation lourde : aucune application lourde a installer sur des dizaines de postes ; un simple navigateur web ou lien PWA suffit pour connecter le DG, le Comptable et tous les chefs de chantier en quelques secondes.',
      '2. Adaptation aux realites reseau du Cameroun & Afrique Centrale : grace au couplage SPA + PWA, l\'equipe chantier peut saisir ses pointages et son journal meme en zone blanche (sous-sol, chantier rural), puis synchroniser des le retour de la 4G.',
      '3. Securite financiere et anti-fraude centralisee : en decouplant l\'interface (Frontend) du moteur metier (API Backend), les regles critiques (Visa DG obligatoire, blocage P.U. pour les roles non autorises, calcul net des paies) sont verifiees sur le serveur et impossibles a contourner.',
      '4. Evolutivite modulaire maitrisee : chaque module (Stocks, Paie, Achats, Livraisons, Budgets, Alertes, Abonnements) est independant. Il est possible d\'ajouter de nouvelles passerelles (API WhatsApp Business, Mobile Money automatise, comptabilite OHADA) sans refondre l\'existant.',
      '5. Rentabilite SaaS Multi-Entreprises : cette architecture supporte aussi bien une entreprise BTP unique multi-chantiers qu\'une commercialisation en mode SaaS aupres de dizaines de PME du secteur, tout en optimisant les couts d\'hebergement.',
    ],
    y,
    true
  );

  const outputPath = path.resolve(process.cwd(), 'BATI-PILOT_Cahier_Metier_Client.pdf');
  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  return outputPath;
}
