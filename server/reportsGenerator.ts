import { jsPDF } from 'jspdf';
import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { Company, VaultDocumentRecord } from '../src/types';

function formatAmount(amount: number): string {
  return Math.round(amount || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDateFr(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function generateExecutiveMonthlyReportPdfBuffer(
  reportData: any,
  periodLabel: string
): Buffer {
  const { company, projectScopeLabel, projects, metrics, supplierOverview } = reportData;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Bandeau Exécutif
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');

  doc.setTextColor(249, 115, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(company?.name || 'ENTREPRISE BTP', margin + 5, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.text(`RAPPORT EXECUTIF DIRECTION GENERALE — ${periodLabel.toUpperCase()}`, margin + 5, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Perimetre : ${projectScopeLabel}  |  Edite le ${formatDateFr(new Date().toISOString())}  |  Devise : FCFA (XAF)`,
    margin + 5,
    y + 24
  );

  y += 36;

  // Grille KPI 2x3
  const tileW = (contentWidth - 6) / 3;
  const kpis = [
    {
      label: 'Chantiers & Avancement',
      val: `${metrics.avgProgressPct}% moyen`,
      sub: `${metrics.activeProjectsCount}/${metrics.totalProjectsCount} chantier(s) en cours`,
    },
    {
      label: 'Budget Alloue / Consomme',
      val: `${metrics.budgetExecutionPct}% execute`,
      sub: `${formatAmount(metrics.totalBudgetSpentXAF)} / ${formatAmount(metrics.totalBudgetAllocatedXAF)} FCFA`,
    },
    {
      label: 'Engagements Achats (BC)',
      val: `${formatAmount(metrics.totalOrdersTTCXAF)} FCFA`,
      sub: `${metrics.totalOrdersCount} bon(s) de commande`,
    },
    {
      label: 'Masse Salariale Payee',
      val: `${formatAmount(metrics.totalPayrollPaidXAF)} FCFA`,
      sub: `Depenses payees : ${formatAmount(metrics.totalExpensesPaidXAF)} FCFA`,
    },
    {
      label: 'Stock Valorise Depot',
      val: `${formatAmount(metrics.stockValuationXAF)} FCFA`,
      sub: `${metrics.criticalStockCount} alerte(s) seuil critique`,
    },
    {
      label: 'Conformite Fournisseurs',
      val: `${metrics.supplierConformityPct}% BL`,
      sub: `${metrics.suppliersCount} fournisseur(s) · ${metrics.disputeDeliveriesCount} litige(s)`,
    },
  ];

  kpis.forEach((k, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * (tileW + 3);
    const ty = y + row * 22;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, ty, tileW, 19, 1.5, 1.5, 'FD');

    doc.setFontSize(7.3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(k.label, x + 3, ty + 5.5);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(k.val, x + 3, ty + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub.slice(0, 38), x + 3, ty + 16.5);
  });

  y += 49;

  // Tableau des chantiers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Etat d’Avancement & Execution Budgetaire par Chantier', margin, y);
  y += 4;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.6);
  doc.text('Code & Chantier', margin + 2, y + 4.8);
  doc.text('Ville', margin + 78, y + 4.8);
  doc.text('Avanc.', margin + 102, y + 4.8);
  doc.text('Budget Alloue', margin + 120, y + 4.8);
  doc.text('Consomme FCFA', pageWidth - margin - 2, y + 4.8, { align: 'right' });
  y += 7;

  projects.slice(0, 10).forEach((p: any, idx: number) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.text(`${p.code} ${p.name}`.slice(0, 42), margin + 2, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text((p.city || '-').slice(0, 14), margin + 78, y + 5);
    doc.text(`${p.progressPercentage}%`, margin + 102, y + 5);
    doc.text(`${formatAmount(p.budgetTotal)}`, margin + 120, y + 5);
    doc.text(`${formatAmount(p.budgetSpent)} FCFA`, pageWidth - margin - 2, y + 5, {
      align: 'right',
    });
    y += 7.5;
  });

  y += 8;

  // Synthèse Fournisseurs & Risques
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Top Fournisseurs, Conformite BL & Encours Restants', margin, y);
  y += 4;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.6);
  doc.text('Fournisseur', margin + 2, y + 4.8);
  doc.text('NIU', margin + 72, y + 4.8);
  doc.text('Conformite', margin + 106, y + 4.8);
  doc.text('Volume TTC', margin + 130, y + 4.8);
  doc.text('Encours FCFA', pageWidth - margin - 2, y + 4.8, { align: 'right' });
  y += 7;

  (supplierOverview?.suppliers || []).slice(0, 6).forEach((s: any, idx: number) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7.2, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text((s.name || '').slice(0, 38), margin + 2, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.text((s.niu || '-').slice(0, 16), margin + 72, y + 4.8);
    doc.text(
      s.metrics?.conformityRatePct === null ? 'Non evalue' : `${s.metrics.conformityRatePct}%`,
      margin + 106,
      y + 4.8
    );
    doc.text(`${formatAmount(s.metrics?.totalOrderedTTCXAF || 0)}`, margin + 130, y + 4.8);
    doc.text(
      `${formatAmount(s.metrics?.outstandingPayableXAF || 0)} FCFA`,
      pageWidth - margin - 2,
      y + 4.8,
      { align: 'right' }
    );
    y += 7.2;
  });

  // Pied de page
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Rapport Direction Generale genere par BATI-PILOT · Module 11 · ${company?.legalNumber || 'Cameroun'}`,
    margin,
    pageHeight - 10
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export async function generateExecutiveMonthlyReportDocxBuffer(
  reportData: any,
  periodLabel: string
): Promise<Buffer> {
  const { company, projectScopeLabel, projects, metrics, supplierOverview } = reportData;

  const makeHeaderCell = (text: string) =>
    new TableCell({
      shading: { fill: '0F172A' },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })],
        }),
      ],
    });

  const makeCell = (text: string, bold = false) =>
    new TableCell({
      borders: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, size: 18, color: '1E293B' })],
        }),
      ],
    });

  const projectRows = [
    new TableRow({
      children: [
        makeHeaderCell('Code & Chantier'),
        makeHeaderCell('Ville'),
        makeHeaderCell('Avancement'),
        makeHeaderCell('Budget Alloué (FCFA)'),
        makeHeaderCell('Consommé (FCFA)'),
      ],
    }),
    ...projects.map(
      (p: any) =>
        new TableRow({
          children: [
            makeCell(`${p.code} — ${p.name}`, true),
            makeCell(p.city || '-'),
            makeCell(`${p.progressPercentage}%`),
            makeCell(formatAmount(p.budgetTotal)),
            makeCell(formatAmount(p.budgetSpent)),
          ],
        })
    ),
  ];

  const supplierRows = [
    new TableRow({
      children: [
        makeHeaderCell('Fournisseur'),
        makeHeaderCell('NIU'),
        makeHeaderCell('Conformité BL'),
        makeHeaderCell('Volume TTC (FCFA)'),
        makeHeaderCell('Encours (FCFA)'),
      ],
    }),
    ...(supplierOverview?.suppliers || []).map(
      (s: any) =>
        new TableRow({
          children: [
            makeCell(s.name, true),
            makeCell(s.niu),
            makeCell(
              s.metrics?.conformityRatePct === null
                ? 'Non évalué (0 BL)'
                : `${s.metrics.conformityRatePct}%`
            ),
            makeCell(formatAmount(s.metrics?.totalOrderedTTCXAF || 0)),
            makeCell(formatAmount(s.metrics?.outstandingPayableXAF || 0)),
          ],
        })
    ),
  ];

  const wordDoc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: `${company?.name || 'BATI-PILOT'} — Rapport Exécutif Direction Générale`,
                bold: true,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Période : ${periodLabel} · Périmètre : ${projectScopeLabel} · Devise : FCFA (XAF) · Édité le ${formatDateFr(new Date().toISOString())}`,
                color: '475569',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '1. Synthèse Financière & Opérationnelle', bold: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Chantiers actifs : ${metrics.activeProjectsCount} / ${metrics.totalProjectsCount} (Avancement moyen : ${metrics.avgProgressPct}%)`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Budget alloué : ${formatAmount(metrics.totalBudgetAllocatedXAF)} FCFA | Consommé : ${formatAmount(metrics.totalBudgetSpentXAF)} FCFA (${metrics.budgetExecutionPct}%)`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Engagements Bons de Commande : ${formatAmount(metrics.totalOrdersTTCXAF)} FCFA (${metrics.totalOrdersCount} BC)`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `• Paie ouvriers réglée : ${formatAmount(metrics.totalPayrollPaidXAF)} FCFA | Stock valorisé dépôt : ${formatAmount(metrics.stockValuationXAF)} FCFA (${metrics.criticalStockCount} alerte(s) critique(s))`,
                size: 20,
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: '2. Détail des Chantiers', bold: true })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: projectRows,
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280 },
            children: [new TextRun({ text: '3. Performance Fournisseurs & Encours', bold: true })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: supplierRows,
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(wordDoc);
}

export function generateVaultDocumentSummaryPdfBuffer(
  company: Company | undefined,
  docRecord: VaultDocumentRecord
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const margin = 16;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 18;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  doc.setTextColor(249, 115, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(company?.name || 'BATI-PILOT BTP', margin + 5, y + 9);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text('FICHE PIECE ARCHIVEE — CENTRE DOCUMENTAIRE BTP', margin + 5, y + 17);

  y += 34;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 68, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(docRecord.title, margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Reference officielle : ${docRecord.reference}`, margin + 6, y + 19);
  doc.text(`Categorie : ${docRecord.category}`, margin + 6, y + 26);
  doc.text(`Chantier / Entite : ${docRecord.projectName || '-'}`, margin + 6, y + 33);
  doc.text(`Date du document : ${formatDateFr(docRecord.documentDate)}`, margin + 6, y + 40);
  doc.text(
    `Archive par : ${docRecord.uploadedByName} (${docRecord.uploadedByRole})`,
    margin + 6,
    y + 47
  );
  doc.text(`Fichier indexe : ${docRecord.fileName} (${docRecord.fileSizeKB} Ko)`, margin + 6, y + 54);

  if (docRecord.notes) {
    const noteLines = doc.splitTextToSize(`Observations : ${docRecord.notes}`, contentWidth - 12);
    doc.text(noteLines[0] || '', margin + 6, y + 62);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
