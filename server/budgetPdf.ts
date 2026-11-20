import { jsPDF } from 'jspdf';
import { Company, ExpenseRecord } from '../src/types';

export interface BudgetProjectRow {
  code: string;
  name: string;
  city: string;
  budgetTotal: number;
  budgetSpent: number;
  remaining: number;
  rate: number;
  alertLevel: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
}

export interface BudgetCategoryRow {
  categoryLabel: string;
  allocatedXAF: number;
  spentXAF: number;
  remainingXAF: number;
  rate: number;
}

export interface BudgetReportPayload {
  scopeLabel: string;
  totalBudgetXAF: number;
  totalSpentXAF: number;
  totalRemainingXAF: number;
  globalRate: number;
  projectRows: BudgetProjectRow[];
  categoryRows: BudgetCategoryRow[];
  expenses: ExpenseRecord[];
}

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '.' : text;
}

function formatDateFr(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function generateBudgetReportPdfBuffer(
  company: Company,
  report: BudgetReportPayload
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // En-tête Bleu nuit + Barre orange sécurité
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 34, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text('RAPPORT BUDGETAIRE & CONTROLE DES DEPENSES BTP', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${company.name}`, margin, 20);
  doc.text(
    `${company.address}, ${company.city} - ${company.legalNumber || 'Devise XAF (FCFA)'}`,
    margin,
    25.5
  );
  doc.text(`Perimetre : ${truncateText(report.scopeLabel, 55)}`, margin, 30.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(253, 186, 116);
  doc.text(`Edition : ${formatDateFr(new Date().toISOString())}`, pageWidth - margin, 13, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Devise : FCFA (XAF)`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Taux d'execution : ${report.globalRate}%`, pageWidth - margin, 25.5, { align: 'right' });

  let y = 42;

  // 4 Cartes KPI Synthèse
  const cardW = (contentWidth - 9) / 4;
  const kpis = [
    { label: 'BUDGET ALLOUE', value: `${formatAmount(report.totalBudgetXAF)} F`, rgb: [15, 23, 42] },
    { label: 'REALISE / CONSOMME', value: `${formatAmount(report.totalSpentXAF)} F`, rgb: [234, 88, 12] },
    {
      label: 'RELIQUAT DISPONIBLE',
      value: `${formatAmount(report.totalRemainingXAF)} F`,
      rgb: [5, 150, 105],
    },
    {
      label: 'CONSOMMATION',
      value: `${report.globalRate}%`,
      rgb: report.globalRate >= 85 ? [185, 28, 28] : [37, 99, 235],
    },
  ];

  kpis.forEach((k, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, 18, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, cx + 3, y + 6);
    doc.setFontSize(9.5);
    doc.setTextColor(k.rgb[0], k.rgb[1], k.rgb[2]);
    doc.text(k.value, cx + 3, y + 13.5);
  });

  y += 24;

  // SECTION 1 : SYNTHÈSE PAR CHANTIER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTION BUDGETAIRE PAR CHANTIER', margin, y);
  y += 4;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('CHANTIER', margin + 3, y + 5.5);
  doc.text('BUDGET PREVU', margin + 96, y + 5.5, { align: 'right' });
  doc.text('REALISE', margin + 128, y + 5.5, { align: 'right' });
  doc.text('RELIQUAT', margin + 158, y + 5.5, { align: 'right' });
  doc.text('TAUX', pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 8;

  report.projectRows.forEach((pr, idx) => {
    const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 8.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(truncateText(`${pr.code} - ${pr.name}`, 36), margin + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(formatAmount(pr.budgetTotal), margin + 96, y + 5.5, { align: 'right' });
    doc.text(formatAmount(pr.budgetSpent), margin + 128, y + 5.5, { align: 'right' });
    doc.text(formatAmount(pr.remaining), margin + 158, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    if (pr.rate >= 90) doc.setTextColor(185, 28, 28);
    else if (pr.rate >= 75) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(5, 150, 105);
    doc.text(`${pr.rate}%`, pageWidth - margin - 3, y + 5.5, { align: 'right' });

    y += 8.5;
  });

  y += 8;

  // SECTION 2 : VENTILATION PAR POSTE DE DÉPENSE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. COMPARATIF PREVU VS REALISE PAR POSTE DE DEPENSE', margin, y);
  y += 4;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('POSTE BUDGETAIRE', margin + 3, y + 5.5);
  doc.text('ENVELOPPE PREVUE', margin + 96, y + 5.5, { align: 'right' });
  doc.text('CONSOMME', margin + 128, y + 5.5, { align: 'right' });
  doc.text('ECART / DISPO', margin + 158, y + 5.5, { align: 'right' });
  doc.text('%', pageWidth - margin - 3, y + 5.5, { align: 'right' });
  y += 8;

  report.categoryRows.forEach((cr, idx) => {
    const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 8, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(truncateText(cr.categoryLabel, 34), margin + 3, y + 5.3);

    doc.setFont('helvetica', 'normal');
    doc.text(formatAmount(cr.allocatedXAF), margin + 96, y + 5.3, { align: 'right' });
    doc.text(formatAmount(cr.spentXAF), margin + 128, y + 5.3, { align: 'right' });
    doc.text(formatAmount(cr.remainingXAF), margin + 158, y + 5.3, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    if (cr.rate >= 100) doc.setTextColor(185, 28, 28);
    else if (cr.rate >= 80) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(5, 150, 105);
    doc.text(`${cr.rate}%`, pageWidth - margin - 3, y + 5.3, { align: 'right' });

    y += 8;
  });

  y += 8;

  // SECTION 3 : JOURNAL DES DÉPENSES
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. JOURNAL DES DEPENSES ENREGISTREES', margin, y);
  y += 4;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.2);
  doc.text('REF / DATE', margin + 3, y + 5.4);
  doc.text('LIBELLE & BENEFICIAIRE', margin + 36, y + 5.4);
  doc.text('POSTE', margin + 115, y + 5.4);
  doc.text('STATUT', margin + 146, y + 5.4);
  doc.text('MONTANT (FCFA)', pageWidth - margin - 3, y + 5.4, { align: 'right' });
  y += 8;

  report.expenses.slice(0, 14).forEach((exp, idx) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    const bg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 9, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(exp.reference, margin + 3, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(formatDateFr(exp.expenseDate), margin + 3, y + 7.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(truncateText(exp.title, 34), margin + 36, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(truncateText(exp.beneficiary, 34), margin + 36, y + 7.5);

    doc.setTextColor(51, 65, 85);
    doc.text(truncateText(exp.categoryLabel, 16), margin + 115, y + 5.5);

    const stLabel =
      exp.status === 'PAID'
        ? 'PAYE'
        : exp.status === 'APPROVED'
          ? 'VALIDE'
          : exp.status === 'PENDING'
            ? 'ATTENTE'
            : 'REFUSE';
    doc.setFont('helvetica', 'bold');
    if (exp.status === 'PAID') doc.setTextColor(5, 150, 105);
    else if (exp.status === 'APPROVED') doc.setTextColor(37, 99, 235);
    else if (exp.status === 'PENDING') doc.setTextColor(217, 119, 6);
    else doc.setTextColor(185, 28, 28);
    doc.text(stLabel, margin + 146, y + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.text(formatAmount(exp.amountXAF), pageWidth - margin - 3, y + 5.5, { align: 'right' });

    y += 9;
  });

  if (y < pageHeight - 42) {
    y += 8;
    const sigW = (contentWidth - 6) / 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, sigW, 24, 1.5, 1.5, 'FD');
    doc.roundedRect(margin + sigW + 6, y, sigW, 24, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('DIRECTION FINANCIERE & COMPTABILITE', margin + 4, y + 6);
    doc.text('VISA DIRECTION GENERALE (DG)', margin + sigW + 10, y + 6);
    doc.line(margin + 4, y + 19, margin + sigW - 4, y + 19);
    doc.line(margin + sigW + 10, y + 19, margin + contentWidth - 4, y + 19);
  }

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`BATI-PILOT SaaS BTP · Rapport financier FCFA · ${company.name}`, margin, pageHeight - 10);
  doc.text('Page 1 / 1', pageWidth - margin, pageHeight - 10, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}
