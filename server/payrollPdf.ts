import { jsPDF } from 'jspdf';
import { Company, PaymentMethod, PayrollRecord, Project } from '../src/types';

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money Cameroun',
  MTN_MOMO: 'MTN Mobile Money',
  CASH: 'Espèces (Caisse Chantier)',
  BANK_TRANSFER: 'Virement Bancaire',
};

const PAYROLL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  APPROVED: 'Validé DG',
  PAID: 'Payé',
};

export function generatePayslipPdfBuffer(
  company: Company,
  project: Project,
  record: PayrollRecord
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // En-tête entreprise
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(249, 115, 22);
  doc.text('BATI-PILOT', margin + 5, y + 9);

  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(company.name, margin + 5, y + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${company.city} (${company.country}) · Tél : ${company.phone}${company.legalNumber ? ` · ${company.legalNumber}` : ''}`,
    margin + 5,
    y + 21.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 186, 116);
  doc.text('BULLETIN DE PAIE / QUINZAINE', pageWidth - margin - 5, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Période : ${record.periodLabel}`, pageWidth - margin - 5, y + 16, { align: 'right' });

  y += 33;

  // Fiche Ouvrier & Chantier
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${record.workerName} (${record.workerMatricule})`, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Corps de métier : ${record.specialtyLabel} · Tél : ${record.phone}`, margin + 4, y + 13);
  doc.text(`Chantier : ${project.name} (${project.code}) · ${project.city}`, margin + 4, y + 19);

  y += 31;

  // Tableau des rubriques de paie
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Rubrique de paie', margin + 4, y + 5.6);
  doc.text('Base / Détail', margin + 92, y + 5.6);
  doc.text('Gains (+)', margin + 132, y + 5.6, { align: 'right' });
  doc.text('Retenues (-)', pageWidth - margin - 4, y + 5.6, { align: 'right' });

  y += 8.5;

  const rows = [
    {
      label: 'Salaire de base (Jours pointés)',
      detail: `${record.daysWorked} j x ${formatAmount(record.dailyRateXAF)} F`,
      gain: `${formatAmount(record.basePayXAF)} F`,
      deduct: '-',
    },
    {
      label: 'Heures supplémentaires (+25%)',
      detail: `${record.overtimeHours} heure(s)`,
      gain: record.overtimePayXAF > 0 ? `${formatAmount(record.overtimePayXAF)} F` : '-',
      deduct: '-',
    },
    {
      label: 'Primes de rendement / Panier',
      detail: 'Prime chantier',
      gain: record.bonusXAF > 0 ? `${formatAmount(record.bonusXAF)} F` : '-',
      deduct: '-',
    },
    {
      label: 'TOTAL BRUT GAGNÉ',
      detail: '',
      gain: `${formatAmount(record.grossPayXAF)} FCFA`,
      deduct: '-',
      isSubtotal: true,
    },
    {
      label: 'Avances & Acomptes perçus',
      detail: 'Déduction sur quinzaine',
      gain: '-',
      deduct: record.advancesDeductedXAF > 0 ? `${formatAmount(record.advancesDeductedXAF)} F` : '0 F',
    },
  ];

  rows.forEach((r, idx) => {
    const h = r.isSubtotal ? 9 : 8;
    if (r.isSubtotal) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, h, 'F');
    } else if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, h, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + h, pageWidth - margin, y + h);

    doc.setFont('helvetica', r.isSubtotal ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(r.label, margin + 4, y + 5.3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(r.detail, margin + 92, y + 5.3);

    doc.setFont('courier', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text(r.gain, margin + 132, y + 5.3, { align: 'right' });

    doc.setTextColor(220, 38, 38);
    doc.text(r.deduct, pageWidth - margin - 4, y + 5.3, { align: 'right' });

    y += h;
  });

  // Net à payer
  y += 4;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('NET À PAYER À L\'OUVRIER', margin + 5, y + 8.8);
  doc.setFontSize(12);
  doc.setTextColor(253, 186, 116);
  doc.text(`${formatAmount(record.netPayXAF)} FCFA`, pageWidth - margin - 5, y + 9, { align: 'right' });

  y += 20;

  // Statut et Canal de règlement (Mobile Money / Espèces)
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(154, 52, 18);
  const statusLabel = PAYROLL_STATUS_LABELS[record.status] || record.status;
  doc.text(`Statut du règlement : ${statusLabel.toUpperCase()}`, margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  if (record.status === 'PAID' && record.paymentMethod) {
    doc.text(
      `Payé via ${PAYMENT_METHOD_LABELS[record.paymentMethod]} · Référence : ${record.paymentReference || 'N/A'}`,
      margin + 4,
      y + 12.5
    );
  } else {
    doc.text('En attente de décaissement (Orange Money, MTN MoMo ou Caisse chantier).', margin + 4, y + 12.5);
  }

  y += 25;

  // Signatures
  const boxW = (contentWidth - 8) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, boxW, 22, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + boxW + 8, y, boxW, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Signature Responsable Paie / Direction', margin + 4, y + 5.5);
  doc.text('Signature Ouvrier (Pour acquit)', margin + boxW + 12, y + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Bulletin généré par BATI-PILOT le ${new Date().toLocaleDateString('fr-FR')} · Devise XAF (FCFA)`,
    margin,
    pageHeight - 8
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export function generatePayrollSummaryPdfBuffer(
  company: Company,
  project: Project,
  records: PayrollRecord[]
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // En-tête sombre
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(249, 115, 22);
  doc.text('BATI-PILOT', margin + 5, y + 8);
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(company.name, margin + 5, y + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Chantier : ${project.name} (${project.code}) · ${project.city}`, margin + 5, y + 20);

  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('ÉTAT RÉCAPITULATIF DE PAIE & RÈGLEMENTS CHANTIER (FCFA)', margin, y);
  y += 6;

  const totalGross = records.reduce((s, r) => s + r.grossPayXAF, 0);
  const totalAdv = records.reduce((s, r) => s + r.advancesDeductedXAF, 0);
  const totalNet = records.reduce((s, r) => s + r.netPayXAF, 0);
  const totalPaid = records.filter((r) => r.status === 'PAID').reduce((s, r) => s + r.netPayXAF, 0);

  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(154, 52, 18);
  doc.text(
    `Brut : ${formatAmount(totalGross)} F   |   Avances : -${formatAmount(totalAdv)} F   |   Payé : ${formatAmount(totalPaid)} F`,
    margin + 4,
    y + 7.5
  );
  doc.setTextColor(15, 23, 42);
  doc.text(`Net total : ${formatAmount(totalNet)} FCFA`, pageWidth - margin - 4, y + 7.5, { align: 'right' });

  y += 16;

  const drawHeader = (topY: number) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, topY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Mat.', margin + 2, topY + 5.2);
    doc.text('Ouvrier', margin + 19, topY + 5.2);
    doc.text('Jours', margin + 62, topY + 5.2);
    doc.text('Brut', margin + 88, topY + 5.2, { align: 'right' });
    doc.text('Avances', margin + 112, topY + 5.2, { align: 'right' });
    doc.text('Net à payer', margin + 140, topY + 5.2, { align: 'right' });
    doc.text('Statut / Réf.', margin + 144, topY + 5.2);
    return topY + 8;
  };

  y = drawHeader(y);

  records.forEach((r, idx) => {
    if (y > pageHeight - 32) {
      doc.addPage();
      y = drawHeader(16);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(r.workerMatricule, margin + 2, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r.workerName.slice(0, 22), margin + 19, y + 5);

    doc.setFont('courier', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${r.daysWorked}j`, margin + 62, y + 5);
    doc.text(`${formatAmount(r.grossPayXAF)}`, margin + 88, y + 5, { align: 'right' });
    doc.text(`${formatAmount(r.advancesDeductedXAF)}`, margin + 112, y + 5, { align: 'right' });

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatAmount(r.netPayXAF)} F`, margin + 140, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    if (r.status === 'PAID') doc.setTextColor(22, 163, 74);
    else if (r.status === 'APPROVED') doc.setTextColor(217, 119, 6);
    else doc.setTextColor(100, 116, 139);
    const statusText = r.status === 'PAID' && r.paymentReference ? r.paymentReference : PAYROLL_STATUS_LABELS[r.status];
    doc.text(statusText, margin + 144, y + 5);

    y += 7.5;
  });

  y += 14;
  if (y > pageHeight - 28) {
    doc.addPage();
    y = 20;
  }

  const boxW = (contentWidth - 8) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, boxW, 20, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + boxW + 8, y, boxW, 20, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Visa Comptable Paie', margin + 4, y + 6);
  doc.text('Visa Directeur Général (Bon à Payer)', margin + boxW + 12, y + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`État édité par BATI-PILOT le ${new Date().toLocaleDateString('fr-FR')}`, margin, pageHeight - 8);

  return Buffer.from(doc.output('arraybuffer'));
}
