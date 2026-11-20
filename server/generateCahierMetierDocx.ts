import fs from 'fs';
import path from 'path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

function makeTitleBanner(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
      bottom: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
      left: { style: BorderStyle.SINGLE, size: 24, color: 'F97316' },
      right: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: '0F172A' },
            margins: { top: 220, bottom: 220, left: 260, right: 220 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: 'CAHIER MÉTIER & SPÉCIFICATIONS FONCTIONNELLES',
                    bold: true,
                    size: 20,
                    color: 'F97316',
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: 'PROJET BATI-PILOT',
                    bold: true,
                    size: 40,
                    color: 'FFFFFF',
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Plateforme SaaS de Pilotage de Chantiers BTP, Logistique & Contrôle Financier',
                    size: 22,
                    color: 'E2E8F0',
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Marché cible : Entreprises BTP & Génie Civil · Cameroun / Zone CEMAC · Devise : FCFA (XAF)',
                    size: 18,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeSectionHeader(num: string, title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    shading: { type: ShadingType.CLEAR, fill: '0F172A' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: 'F97316' },
    },
    children: [
      new TextRun({
        text: `  ${num}. ${title}`,
        bold: true,
        size: 23,
        color: 'FFFFFF',
        font: 'Calibri',
      }),
    ],
  });
}

function makeSubTitle(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21,
        color: 'EA580C',
        font: 'Calibri',
      }),
    ],
  });
}

function makeParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 110, line: 276 },
    children: [
      new TextRun({
        text,
        size: 20,
        color: '334155',
        font: 'Calibri',
      }),
    ],
  });
}

function makeBullet(text: string, boldPrefix?: string): Paragraph {
  const runs: TextRun[] = [
    new TextRun({
      text: '•  ',
      bold: true,
      size: 20,
      color: 'EA580C',
      font: 'Calibri',
    }),
  ];
  if (boldPrefix) {
    runs.push(
      new TextRun({
        text: `${boldPrefix} : `,
        bold: true,
        size: 20,
        color: '0F172A',
        font: 'Calibri',
      })
    );
  }
  runs.push(
    new TextRun({
      text,
      size: 20,
      color: '334155',
      font: 'Calibri',
    })
  );
  return new Paragraph({
    spacing: { after: 70, line: 264 },
    indent: { left: 260, hanging: 180 },
    children: runs,
  });
}

function makeCalloutBox(
  title: string,
  lines: string[],
  bgHex = 'F8FAFC',
  borderHex = 'CBD5E1',
  titleColor = '0F172A',
  bodyColor = '334155',
  mono = false
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
      left: { style: BorderStyle.SINGLE, size: 16, color: borderHex },
      right: { style: BorderStyle.SINGLE, size: 6, color: borderHex },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: bgHex },
            margins: { top: 140, bottom: 140, left: 200, right: 180 },
            children: [
              ...(title
                ? [
                    new Paragraph({
                      spacing: { after: 70 },
                      children: [
                        new TextRun({
                          text: title,
                          bold: true,
                          size: 20,
                          color: titleColor,
                          font: mono ? 'Consolas' : 'Calibri',
                        }),
                      ],
                    }),
                  ]
                : []),
              ...lines.map(
                (l) =>
                  new Paragraph({
                    spacing: { after: 50, line: 250 },
                    children: [
                      new TextRun({
                        text: l,
                        size: mono ? 17 : 19,
                        color: bodyColor,
                        font: mono ? 'Consolas' : 'Calibri',
                        bold: mono,
                      }),
                    ],
                  })
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeRbacTable(): Table {
  const headers = ['Domaine Métier', 'DG', 'Chef Ch.', 'Magasinier', 'Comptable', 'Ouvrier'];
  const rows = [
    ['Équipe (Invit / Suppression / MDP)', 'Tout', 'Sauf DG', 'Bloqué', 'Bloqué', 'Aucun'],
    ['Chantiers, Lots & Photos', 'Tout', 'Terrain', 'Lecture', 'Lecture', 'Aucun'],
    ['Ouvriers (Création / Suppr / Pointage)', 'Complet', 'Complet', 'Aucun', 'Lecture', 'Perso'],
    ['Calcul & Paiement Paie (OM/MoMo)', 'Visa', 'Lecture', 'Aucun', 'Complet', 'Reçu'],
    ['Stocks Dépôt (Entrées / Sorties)', 'Lecture', 'Demande', 'Complet', 'Lecture', 'Aucun'],
    ['Saisie Prix Unitaires (P.U.)', 'Autorisé', 'Autorisé', 'Bloqué', 'Bloqué', 'Bloqué'],
    ['Bons de Commande (Visa DG)', 'Visa DG', 'Création', 'Lecture', 'Lecture', 'Aucun'],
    ['Bons de Livraison & Litiges BL', 'Arbitrage', 'Réception', 'Complet', 'Lecture', 'Aucun'],
    ['Dépenses, Budgets & Coffre-Fort', 'Complet', 'Saisie', 'Aucun', 'Complet', 'Aucun'],
    ['Fournisseurs & Diffusion Alertes', 'Complet', 'Terrain', 'Stock / BL', 'Budget', 'Bloqué'],
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: '0F172A' },
          margins: { top: 90, bottom: 90, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 18,
                  color: 'FFFFFF',
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (r, idx) =>
      new TableRow({
        children: r.map((cell, cIdx) => {
          const isRestricted = cell === 'Bloqué' || cell === 'Aucun';
          const isAllowed = cell === 'Autorisé' || cell === 'Visa DG' || cell === 'Complet';
          return new TableCell({
            shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
            margins: { top: 75, bottom: 75, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cell,
                    bold: cIdx === 0 || isAllowed,
                    size: 18,
                    color: isRestricted ? '94A3B8' : isAllowed ? '166534' : '334155',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          });
        }),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: [headerRow, ...dataRows],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

export async function generateCahierMetierDocx(): Promise<string> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
            color: '334155',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              bottom: 900,
              left: 950,
              right: 950,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // PAGE 1 : GARDE, CONTEXTE & SOMMAIRE
          makeTitleBanner(),
          new Paragraph({ spacing: { after: 140 } }),
          makeCalloutBox(
            'FICHE DE CADRAGE MÉTIER',
            [
              'Objet du document : Référence fonctionnelle décrivant les règles de gestion, circuits de validation et rôles de la plateforme BATI-PILOT.',
              'Périmètre couvert : Gestion multi-entreprises, Chantiers, Pointage/Paie, Stocks, Achats, Livraisons, Budgets, Alertes & Architecture.',
              'Règle financière clé : Saisie manuelle stricte des Prix Unitaires (P.U.) et montants FCFA par les seuls profils habilités.',
            ],
            'FFF7ED',
            'FDBA74',
            '9A3412',
            '431407'
          ),

          makeSectionHeader('0', 'CONTEXTE, ENJEUX TERRAIN & OBJECTIFS STRATÉGIQUES'),
          makeParagraph(
            'Les entreprises de BTP et de Génie Civil en Afrique francophone font face à quatre sources majeures de dérapage financier et opérationnel : (1) le coulage et la perte de matériaux entre le dépôt et les chantiers, (2) les pointages approximatifs ou fictifs de la main-d’œuvre journalière, (3) le manque de visibilité instantanée sur la consommation budgétaire réelle par chantier, et (4) la lenteur de validation des achats entre le terrain et la Direction Générale.'
          ),
          makeSubTitle('Objectifs opérationnels de la solution BATI-PILOT :'),
          makeBullet('Centraliser en temps réel l’état physique (avancement, photos, journal) et financier (engagé, payé, reste à consommer) de chaque chantier.'),
          makeBullet('Rendre chaque mouvement de matériau et chaque franc dépensé (FCFA) traçable jusqu’au responsable qui l’a saisi ou validé.'),
          makeBullet('Instaurer un circuit strict de contrôle interne : Demande terrain -> Saisie P.U. autorisée -> Visa DG -> Réception physique -> Imputation budgétaire.'),
          makeBullet('Simplifier le paiement hebdomadaire ou à la quinzaine des ouvriers via Orange Money, MTN Mobile Money, Caisse ou Virement bancaire.'),
          makeBullet('Garantir la continuité d’utilisation sur chantier même en cas de coupure réseau (Mode Hors-Ligne PWA) et prévenir les risques par alertes proactives.'),

          makeSubTitle('Structure du présent Cahier Métier :'),
          makeCalloutBox('', [
            'Chapitre 1 : Gouvernance Multi-Entreprises, Sécurité & Matrice des 6 Rôles Métiers',
            'Chapitre 2 : Pilotage des Chantiers, Journal Quotidien, Lots BTP & Preuves Photos',
            'Chapitre 3 : Personnel Ouvrier, Pointage Journalier & Paie Orange Money / MTN MoMo',
            'Chapitre 4 : Chaîne Logistique — Stocks Dépôt, Bons de Commande (Visa DG) & Livraisons',
            'Chapitre 5 : Contrôle Financier — Dépenses Chantier & Suivi Budgétaire Prévu vs Réalisé',
            'Chapitre 6 : Pilotage Proactif — Alertes, PWA Hors-Ligne, Fournisseurs & Coffre-Fort',
            'Chapitre 7 : Abonnements SaaS Multi-Tenant, Livrables PDF/Word & Protocole de Recette',
            'Chapitre 8 : Architecture Technique Utilisée & Justification pour le Projet BATI-PILOT',
          ]),

          pageBreak(),

          // CHAPITRE 1 : GOUVERNANCE & RÔLES
          makeSectionHeader('1', 'GOUVERNANCE MULTI-ENTREPRISES, SÉCURITÉ & RÔLES MÉTIERS'),
          makeParagraph(
            'BATI-PILOT repose sur une architecture Multi-Entreprises (Multi-Tenant) hermétique. Plusieurs sociétés BTP indépendantes peuvent utiliser la plateforme simultanément : chaque donnée (chantier, ouvrier, stock, bon de commande, facture, dépense) est strictement rattachée à l’identifiant unique de l’entreprise. Aucune fuite ou lecture croisée n’est possible entre deux entreprises.'
          ),
          makeSubTitle('1.1 Les 6 Profils Métiers et leurs responsabilités'),
          makeBullet(
            'Détient la vision stratégique et financière. Crée/supprime les collaborateurs et ouvriers, approuve ou rejette les Bons de Commande (Visa DG obligatoire), valide les dépenses, ajuste les budgets, gère le Coffre-Fort et supervise les marges.',
            'Directeur Général (DG)'
          ),
          makeBullet(
            'Responsable opérationnel terrain. Tient le journal quotidien, lots BTP, photos, pointages et demandes d’achats (P.U. manuel). Peut créer/supprimer des ouvriers et gérer les collaborateurs non-DG (sans accès aux paramètres fiscaux ni à la matrice RBAC).',
            'Chef de Chantier'
          ),
          makeBullet(
            'Garant de l’intégrité physique des matériaux. Enregistre les entrées et sorties de stock avec affectation au chantier destinataire, contrôle les livraisons camions, signale les avaries/litiges BL et surveille les seuils de rupture.',
            'Magasinier Dépôt'
          ),
          makeBullet(
            'Gère l’exécution financière : calcule les paies ouvriers depuis les pointages, enregistre les acomptes, exécute les paiements (OM/MoMo/Caisse/Virement), décaisse les dépenses, ajuste les budgets et archive les justificatifs du Coffre-Fort.',
            'Comptable / Resp. Paie'
          ),
          makeBullet(
            'Accès restreint à son espace personnel (consultation de ses présences, heures supplémentaires et bulletins de paie). Aucun accès aux données financières, commandes, budgets ou diffusions générales.',
            'Ouvrier Journalier'
          ),
          makeBullet(
            'Administrateur technique de la plateforme SaaS, strictement isolé et invisible dans les listes d’équipes des entreprises clientes. Provisionne les comptes sociétés, attribue les plans d’abonnement et contrôle les quotas.',
            'Super Admin (Plateforme — Isolé)'
          ),

          makeSubTitle('1.2 Matrice synthétique de contrôle d’accès (RBAC)'),
          makeRbacTable(),

          pageBreak(),

          // CHAPITRE 2 : CHANTIERS & PHOTOS
          makeSectionHeader('2', 'PILOTAGE DES CHANTIERS, JOURNAL TERRAIN & PREUVES PHOTOS'),
          makeParagraph(
            'Ce chapitre couvre le cœur opérationnel quotidien des conducteurs de travaux et chefs de chantier : structurer chaque projet dès sa signature, suivre l’exécution physique lot par lot et conserver un historique probant de tout ce qui se passe sur le site.'
          ),
          makeSubTitle('2.1 Tableau de Bord Consolidé Direction (Module 1)'),
          makeBullet('Vue synthétique multi-chantiers affichant le nombre de chantiers actifs, l’effectif mobilisé du jour, le budget global alloué vs réalisé en FCFA et le taux moyen d’avancement physique.'),
          makeBullet('Indicateurs d’alerte immédiate sur les chantiers présentant un décalage entre avancement physique (%) et consommation budgétaire (%).'),
          makeBullet('Filtrage rapide par chantier ou par statut (Planifié, En cours, Suspendu, Achevé).'),

          makeSubTitle('2.2 Fiche Signalétique Chantier & Journal Quotidien (Module 2)'),
          makeBullet('Chaque chantier possède un code unique (ex. CH-2026-DLA-01), un nom d’ouvrage, un maître d’ouvrage (client), une ville/quartier, des coordonnées GPS, un Chef de chantier attitré, un budget prévisionnel total (FCFA) et des dates début/fin prévues.'),
          makeBullet('Journal de Chantier Quotidien : rédigé chaque fin de journée par le Chef de chantier. Consigne la météo, l’effectif présent, les tâches réalisées, les livraisons reçues et les éventuels incidents ou arrêts de chantier.'),
          makeBullet('Historique chronologique inaltérable permettant à la Direction Générale de vérifier à distance l’activité réelle sans attendre le rapport hebdomadaire.'),

          makeSubTitle('2.3 Découpage par Lots Techniques BTP & Galerie Photos Horodatée (Module 3)'),
          makeBullet('Décomposition de l’ouvrage en lots techniques standard BTP : Installations & Terrassement, Fondations & Gros Œuvre, Ferraillage & Coffrage, Maçonnerie & Élévation, Plomberie & Électricité, Revêtements & Finitions.'),
          makeBullet('Suivi du pourcentage d’avancement (0 à 100 %) et du statut de chaque tâche/lot. Le taux d’avancement global du chantier est recalculé dynamiquement.'),
          makeBullet('Galerie Photos Terrain : import direct d’images depuis le chantier avec titre, lot concerné, date/heure et auteur afin de justifier les décomptes clients et attester la qualité d’exécution.'),

          makeSubTitle('2.4 Schéma du circuit de remontée d’information terrain'),
          makeCalloutBox(
            '',
            [
              '[Chef de Chantier Terrain] ---> 1. Saisit Journal Quotidien (Météo, Incidents, Effectif)',
              '                           ---> 2. Met à jour % Lots BTP (Gros Œuvre, Ferraillage...)',
              '                           ---> 3. Ajoute Photos horodatées (Preuve avant coulage)',
              '[Direction Generale Siege] <--- Consolidation temps reel sur Tableau de Bord & Budget',
            ],
            'F1F5F9',
            'CBD5E1',
            '0F172A',
            '1E293B',
            true
          ),

          pageBreak(),

          // CHAPITRE 3 : PERSONNEL, POINTAGE & PAIE
          makeSectionHeader('3', 'PERSONNEL OUVRIER, POINTAGE & PAIE MOBILE MONEY'),
          makeParagraph(
            'La main-d’œuvre journalière et tâcheronne représente l’un des postes de trésorerie les plus sensibles sur un chantier. BATI-PILOT supprime les feuilles volantes papier et lie directement chaque franc versé à un pointage nominal vérifié.'
          ),
          makeSubTitle('3.1 Répertoire Nominatif des Ouvriers & Pointage Quotidien (Module 4)'),
          makeBullet('Répertoire complet des ouvriers par chantier : Matricule automatique (MAT-XXX), Nom & Prénoms, Qualification (Chef d’équipe, Maçon, Ferrailleur, Coffreur, Électricien, Plombier, Manœuvre), Téléphone Mobile Money, CNI et Taux Journalier en FCFA.'),
          makeBullet('Gouvernance du répertoire : la création et la suppression d’ouvriers (avec nettoyage automatique des pointages liés et recalcul de l’effectif du chantier) sont strictement réservées au Directeur Général et au Chef de Chantier.'),
          makeBullet('Feuille de Pointage Journalier : saisie rapide des statuts (Présent = 1 j, Demi-journée = 0,5 j, Absent = 0 j, Congé/Maladie) et des heures supplémentaires.'),
          makeBullet('Exports PDF immédiats : (1) PDF Pointage du Jour avec tableau d’émargement terrain et (2) PDF Répertoire Officiel des Ouvriers mobilisés.'),

          makeSubTitle('3.2 Moteur de Calcul de Paie, Acomptes & Paiement OM / MTN MoMo (Module 5)'),
          makeBullet('Calcul automatisé de la paie de période (semaine ou quinzaine) depuis les pointages réels : Salaire de base = (Jours validés x Taux journalier) + Heures Supplémentaires majorées à 125 %.'),
          makeBullet('Gestion des Acomptes / Avances sur salaire : toute avance versée en milieu de semaine est tracée avec motif et automatiquement déduite du Net à Payer.'),
          makeBullet('Primes exceptionnelles saisies manuellement par le responsable habilité et circuit strict : Calculé -> Approuvé (Bon à payer) -> Payé.'),
          makeBullet('Modes de règlement adaptés : Orange Money (OM), MTN Mobile Money (MoMo), Espèces Caisse chantier ou Virement bancaire avec référence transaction.'),
          makeBullet('Imputation automatique sur le poste « Main-d’œuvre » du budget chantier et édition du Bulletin de Paie PDF individuel avec mention PAYÉ.'),

          makeSubTitle('3.3 Règle de calcul et chaîne de validation de la Paie'),
          makeCalloutBox(
            '',
            [
              'Formule : NET A PAYER = (Jours x Taux) + (H.Sup x (Taux/8) x 1.25) + Prime - Avances',
              'Circuit : [Pointage Jour (M4)] -> [Calcul Quinzaine] -> [Visa Approbation]',
              '       -> [Reglement OM / MoMo / Caisse] -> [Bulletin PDF + Imputation Budget Chantier]',
              'Controle: Un ouvrier non pointe ne peut recevoir aucun bulletin de paie.',
            ],
            'FFF7ED',
            'FDBA74',
            '9A3412',
            '9A3412',
            true
          ),

          pageBreak(),

          // CHAPITRE 4 : LOGISTIQUE, P.U., COMMANDES & LIVRAISONS
          makeSectionHeader('4', 'CHAÎNE LOGISTIQUE MATÉRIAUX, SAISIE P.U., ACHATS & LIVRAISONS'),
          makeParagraph(
            'La maîtrise des coûts matériaux (ciment, fer à béton, granulats, bois, carburant) exige une séparation claire des pouvoirs entre celui qui commande, celui qui négocie le prix, celui qui approuve et celui qui réceptionne physiquement.'
          ),
          makeCalloutBox(
            'RÈGLE MÉTIER EXPRESSE — SAISIE MANUELLE DES PRIX UNITAIRES (P.U.)',
            [
              'Aucun Prix Unitaire (P.U.) n’est pré-rempli ou imposé automatiquement par le système. Sur le terrain comme lors des achats, seuls le Directeur Général ou le Chef de Chantier saisissent manuellement le P.U. réel négocié auprès du fournisseur.',
            ],
            'FEF2F2',
            'FCA5A5',
            '991B1B',
            '7F1D1D'
          ),

          makeSubTitle('4.1 Stocks & Dépôt Central de Matériaux (Module 6)'),
          makeBullet('Catalogue structuré par familles BTP : Liants (Ciment 42.5), Aciers (HA 8/10/12/14), Granulats (Sable Sanaga, Gravier), Maçonnerie, Bois/Coffrage, Plomberie/Élec et Carburant.'),
          makeBullet('Traçabilité des mouvements : chaque Entrée, Sortie vers un chantier ou Ajustement mentionne l’opérateur, le réceptionnaire chantier, la référence document et la valorisation.'),
          makeBullet('Seuils d’alerte paramétrables : passage automatique en alerte « Stock Critique » ou « Rupture ».'),

          makeSubTitle('4.2 Bons de Commande & Circuit d’Approbation DG (Module 7)'),
          makeBullet('Workflow strict : Brouillon -> En attente Visa DG -> Approuvé DG (ou Refus motivé) -> Commandé Fournisseur -> Livré.'),
          makeBullet('Calcul des totaux de lignes à partir du P.U. saisi manuellement et gestion optionnelle de la TVA (19,25 %).'),
          makeBullet('Édition du Bon de Commande Officiel en PDF avec mentions légales (RC / NIU), tableau détaillé et cadre signature DG.'),

          makeSubTitle('4.3 Bons de Livraison (BL) & Gestion des Litiges Transporteurs (Module 8)'),
          makeBullet('Rapprochement automatique avec le Bon de Commande approuvé et gestion des reliquats (livraisons partielles multi-camions).'),
          makeBullet('Double circuit de destination : (1) Livraison au Dépôt Central (entrée automatique en stock physique) ; (2) Livraison Directe Chantier (imputation directe sur le budget matériaux du chantier).'),
          makeBullet('Contrôle conformité & Litiges : saisie des quantités conformes vs avariées/refusées. Tout écart bascule le BL en statut LITIGE jusqu’à régularisation, et le BC se clôture en LIVRÉ à 100 %.'),

          pageBreak(),

          // CHAPITRE 5 : FINANCES & BUDGETS
          makeSectionHeader('5', 'CONTRÔLE FINANCIER, DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER'),
          makeParagraph(
            'Ce module constitue le tableau de bord financier du Directeur Général et du Comptable. Il garantit que toutes les sorties d’argent convergent vers une vue unique Prévu vs Réalisé.'
          ),
          makeSubTitle('5.1 Moteur d’Agrégation Budgétaire en Temps Réel (Module 9)'),
          makeBullet('Chaque chantier est découpé en 6 postes budgétaires de référence : Matériaux, Main-d’œuvre, Engins & Carburant, Sous-traitance, Frais généraux de chantier, Divers & Imprévus.'),
          makeBullet('Flux A (Sorties Stock Dépôt) : valeur des matériaux sortis du magasin vers le chantier -> Poste Matériaux.'),
          makeBullet('Flux B (Livraisons Directes Chantier) : valeur des BL livrés directement sur site -> Poste Matériaux.'),
          makeBullet('Flux C (Paies Ouvriers Payées) : bulletins de paie réglés en OM/MoMo/Caisse -> Poste Main-d’œuvre.'),
          makeBullet('Flux D (Dépenses Directes Payées) : locations d’engins, gasoil, sous-traitants, autorisations et frais de site.'),

          makeSubTitle('5.2 Circuit de Validation & Décaissement des Dépenses Directes'),
          makeBullet('Saisie manuelle obligatoire du montant en FCFA, du bénéficiaire, du numéro de facture/reçu et de l’imputation chantier.'),
          makeBullet('Circuit anti-fraude : En attente -> Approuvé (« Bon à payer » par DG ou Comptable) -> Décaissé (OM / MTN MoMo / Caisse / Virement) ou Refusé avec motif.'),
          makeBullet('Ajustement encadré des enveloppes budgétaires réservé au DG et au Comptable, avec export du Rapport Budgétaire PDF consolidé.'),

          makeSubTitle('5.3 Règles de Vigilance & Seuils d’Alerte de Dépassement'),
          makeCalloutBox(
            '',
            [
              '• Consommation < 70 %          : [MAITRISE]    Execution conforme a l\'enveloppe prevue',
              '• 70 % <= Consommation < 85 %  : [VIGILANCE]   Alerte preventive Chef & Comptable',
              '• 85 % <= Consommation < 100 % : [CRITIQUE]    Arbitrage Direction Generale requis',
              '• Consommation >= 100 %        : [DEPASSEMENT] Alerte rouge DG & controle analytique',
            ],
            'F1F5F9',
            'CBD5E1',
            '0F172A',
            '1E293B',
            true
          ),

          pageBreak(),

          // CHAPITRE 6 : ALERTES, PWA & FOURNISSEURS
          makeSectionHeader('6', 'PILOTAGE PROACTIF : ALERTES, HORS-LIGNE PWA & FOURNISSEURS'),
          makeParagraph(
            'Pour répondre aux contraintes réelles des chantiers (connectivité instable en zone reculée, urgence des arbitrages à distance), la plateforme intègre des modules de réactivité et de résilience terrain.'
          ),
          makeSubTitle('6.1 Centre de Notifications & Alertes Métier BTP (Module 12 — Opérationnel)'),
          makeBullet('Capteurs temps réel connectés à toute la plateforme : stocks sous seuil critique, Bons de Commande en attente de Visa DG, litiges de réception BL, dépassements budgétaires (>= 70 %) et paies en attente.'),
          makeBullet('Navigation actionnable en un clic vers le module concerné ; disparition automatique de l’alerte dès résolution de l’anomalie.'),
          makeBullet('Console de Diffusion Terrain pour consignes urgentes (sécurité/EPI, toupie béton, contrôle qualité) et escalade multicanal configurable (In-App, WhatsApp, SMS, Email).'),

          makeSubTitle('6.2 Mode Hors-Ligne / PWA Chantier (Module 13 — Opérationnel)'),
          makeBullet('Installation directe PC / Android / iOS depuis le bouton « Installer App » du menu latéral gauche (placé sous Abonnements SaaS), avec guide d’installation intégré sans passer par les stores.'),
          makeBullet('Bascule manuelle & résilience terrain : boutons « Tester Hors-Ligne » et « Rétablir Connexion » pour simuler une perte réseau ou forcer la resynchronisation immédiate de la file d’attente chiffrée (pointages, journaux, avancement).'),

          makeSubTitle('6.3 Fournisseurs (Module 10) & Rapports / Coffre-Fort Justificatif (Module 11)'),
          makeBullet('Annuaire & Performance Fournisseurs (Module 10 — Opérationnel) : fiches fournisseurs BTP (NIU, RCCM, contacts), suivi du Volume TTC cumulé (total des commandes TVA 19,25 % incluse), Encours à payer (FCFA), et Conformité BL (affichée « N/A » à 0 BL réceptionné).'),
          makeBullet('Rapports Direction & Coffre-Fort Pièces Justificatives (Module 11 — Opérationnel) : archivage numérique probant jusqu’à 4 Mo par document dans 5 dossiers BTP (Factures Fournisseurs, Bons de Livraison Signés, Quittances Mobile Money, Contrats & Avenants, Décomptes Clients), avec suppression réservée au DG et au Comptable.'),
          makeBullet('Onboarding Collaborateurs simplifié : génération d’un mot de passe temporaire (aléatoire ou personnalisé), copie 1-clic ou partage direct WhatsApp (wa.me) et connexion directe sans changement forcé au premier accès.'),

          pageBreak(),

          // CHAPITRE 7 : ABONNEMENTS SAAS & RECETTE
          makeSectionHeader('7', 'MODÈLE SAAS, LIVRABLES PDF & CRITÈRES DE RECETTE CLIENT'),
          makeSubTitle('7.1 Abonnements SaaS & Facturation Multi-Entreprises (Module 14)'),
          makeBullet('Plans tarifaires en FCFA adaptés aux PME et majors du BTP : Starter, Croissance et Entreprise Multi-Chantiers.'),
          makeBullet('Contrôle des quotas en temps réel (nombre de chantiers actifs, comptes utilisateurs, stockage photos) et gestion du statut d’abonnement (Essai, Actif, Suspendu).'),

          makeSubTitle('7.2 Synthèse du Flux Opérationnel Global de Bout en Bout'),
          makeCalloutBox(
            '',
            [
              '[1. Creation Chantier + Enveloppe FCFA] -> [2. Mobilisation Ouvriers + Pointage PDF]',
              '-> [3. Demande Achat + P.U. Manuel + Visa DG] -> [4. Reception BL (Depot ou Direct Site)]',
              '-> [5. Sorties Stock + Paies OM/MoMo + Depenses] -> [6. Suivi Budget Prevu vs Realise]',
              '-> [7. Alertes Temps Reel + Mode Hors-Ligne PWA + Rapports PDF Officiels Direction]',
            ],
            '0F172A',
            'F97316',
            'FDBA74',
            'E2E8F0',
            true
          ),

          makeSubTitle('7.3 Catalogue des Livrables Documentaires PDF, Word & CSV générés par BATI-PILOT'),
          makeBullet('Feuille de Pointage Journalier PDF (émargement terrain) & Répertoire Officiel des Ouvriers PDF.'),
          makeBullet('Bulletins de Paie Individuels PDF avec décomposition heures sup, avances et référence OM/MoMo.'),
          makeBullet('Bons de Commande Officiels PDF (P.U., TVA 19,25 %, Visa DG) & Bons de Livraison PDF (écarts/avaries).'),
          makeBullet('Rapport Budgétaire Consolidé PDF, Fiches Performance Fournisseurs PDF & Factures SaaS A4 PDF.'),
          makeBullet('Rapports Mensuels Direction PDF & Word (.docx), plus Export Comptable CSV (dépenses & paies OHADA).'),

          makeSubTitle('7.4 Protocole de Recette & Mise en Production chez le Client'),
          makeBullet('Étape A : Validation du présent Cahier Métier et confirmation des seuils de validation interne (Visa DG, canaux WhatsApp/SMS).'),
          makeBullet('Étape B : Vérification sur environnement de démonstration avec les 6 profils utilisateurs.'),
          makeBullet('Étape C : Reprise des données initiales de l’entreprise cliente (chantiers en cours, enveloppes budgétaires, inventaire dépôt, liste ouvriers).'),
          makeBullet('Étape D : Déploiement sur serveur de production, formation pratique des équipes terrain (3h) et ouverture officielle.'),

          pageBreak(),

          // CHAPITRE 8 : ARCHITECTURE TECHNIQUE & JUSTIFICATION
          makeSectionHeader('8', 'ARCHITECTURE TECHNIQUE UTILISÉE & ADÉQUATION AU PROJET'),
          makeParagraph(
            'Pour répondre aux exigences de rapidité, de fiabilité financière et d’utilisation sur le terrain (chantiers à connectivité limitée et bureaux de Direction Générale), le projet BATI-PILOT s’appuie sur une Architecture Web Moderne Client-Serveur Découplée (SPA + API REST) en Mode SaaS Multi-Tenant et Progressive Web App (PWA).'
          ),

          makeSubTitle('8.1 Les 4 couches principales de l’architecture retenue'),
          makeBullet(
            'Interface réactive unique qui s’adapte automatiquement aux grands écrans du Siège (DG, Comptable) comme aux smartphones Android/iOS sur chantier (Chef de chantier, Magasinier).',
            'Couche Présentation (Frontend SPA React + TypeScript + Tailwind CSS)'
          ),
          makeBullet(
            'Serveur centralisant l’authentification, les contrôles d’accès par rôle (RBAC), la validation des circuits financiers (Visa DG, Paie, Dépenses) et l’agrégation budgétaire en temps réel.',
            'Couche Métier & API REST (Backend Node.js / Express + TypeScript)'
          ),
          makeBullet(
            'Chaque donnée est isolée par identifiant d’entreprise (companyId), permettant d’héberger plusieurs sociétés BTP ou filiales sur une même infrastructure sans aucun risque de mélange.',
            'Architecture Multi-Tenant Cloisonnée'
          ),
          makeBullet(
            'Stockage temporaire local sur le terrain en l’absence de réseau Internet avec synchronisation différée, et génération automatisée de documents officiels (PDF & Word).',
            'Couche Résilience Hors-Ligne (PWA / Service Worker) & Moteur Documentaire'
          ),

          makeSubTitle('8.2 Schéma d’architecture technique globale'),
          makeCalloutBox(
            '',
            [
              '[Utilisateurs Terrain & Siege : PC / Tablette / Mobile PWA]',
              '       |  (HTTPS / JSON + Cache Hors-Ligne Service Worker)',
              '       v',
              '[Serveur API REST Express/Node.js] ---> [Controle RBAC & Regles Metier FCFA]',
              '       |---> [Donnees Multi-Tenant (companyId)] + [Moteur Export PDF/Word]',
            ],
            '0F172A',
            'F97316',
            'FDBA74',
            '86EFAC',
            true
          ),

          makeSubTitle('8.3 Pourquoi cette architecture correspond parfaitement à ce projet BTP ?'),
          makeBullet(
            'Aucune application lourde à installer sur des dizaines de postes ; un simple navigateur web ou lien PWA suffit pour connecter le DG, le Comptable et tous les chefs de chantier en quelques secondes.',
            '1. Déploiement immédiat sans installation lourde'
          ),
          makeBullet(
            'Grâce au couplage SPA + PWA, l’équipe chantier peut saisir ses pointages et son journal même en zone blanche (sous-sol, chantier rural), puis synchroniser dès le retour de la 4G.',
            '2. Adaptation aux réalités réseau du Cameroun & Afrique Centrale'
          ),
          makeBullet(
            'En découplant l’interface (Frontend) du moteur métier (API Backend), les règles critiques (Visa DG obligatoire, blocage P.U. pour les rôles non autorisés, calcul net des paies) sont vérifiées sur le serveur et impossibles à contourner.',
            '3. Sécurité financière et anti-fraude centralisée'
          ),
          makeBullet(
            'Chaque module (Stocks, Paie, Achats, Livraisons, Budgets, Alertes, Abonnements) est indépendant. Il est possible d’ajouter de nouvelles passerelles (API WhatsApp Business, Mobile Money automatisé, comptabilité OHADA) sans refondre l’existant.',
            '4. Évolutivité modulaire maîtrisée'
          ),
          makeBullet(
            'Cette architecture supporte aussi bien une entreprise BTP unique multi-chantiers qu’une commercialisation en mode SaaS auprès de dizaines de PME du secteur, tout en optimisant les coûts d’hébergement.',
            '5. Rentabilité SaaS Multi-Entreprises'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve(process.cwd(), 'BATI-PILOT_Cahier_Metier_Client.docx');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}
