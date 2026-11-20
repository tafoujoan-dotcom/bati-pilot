import { jsPDF } from 'jspdf';
import { Company, SaaSInvoice, SaaSPlanCatalog } from '../src/types';

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDateFr(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getPaymentLabel(method?: string): string {
  switch (method) {
    case 'ORANGE_MONEY':
      return 'Orange Money Cameroun';
    case 'MTN_MOMO':
      return 'MTN Mobile Money (MoMo)';
    case 'BANK_TRANSFER':
      return 'Virement Bancaire';
    case 'CASH':
      return 'Espèces / Versement Agence';
    default:
      return 'Non réglé';
  }
}

export function generateSubscriptionInvoicePdfBuffer(
  invoice: SaaSInvoice,
  company: Company | undefined,
  planSpec: SaaSPlanCatalog | undefined
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Bandeau Émetteur SaaS BATI-PILOT
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('BATI-PILOT SAAS BTP', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Plateforme de Pilotage de Chantiers · Cameroun & Afrique Centrale', margin + 6, y + 16);
  doc.text('Douala, Bonanjo · facturation@batipilot.cm · Devise : FCFA (XAF)', margin + 6, y + 22);

  // Badge FACTURE à droite
  doc.setFillColor(234, 88, 12);
  doc.roundedRect(pageWidth - margin - 52, y + 5, 46, 20, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FACTURE SAAS', pageWidth - margin - 29, y + 13, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text(invoice.invoiceNumber, pageWidth - margin - 29, y + 20, { align: 'center' });

  y += 38;

  // Bloc 2 colonnes : Client BTP + Détails Facture
  const colW = (contentWidth - 6) / 2;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colW, 38, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + colW + 6, y, colW, 38, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FACTURÉ À (ENTREPRISE CLIENTE)', margin + 4, y + 7);
  doc.text('RÉFÉRENCES DE FACTURATION', margin + colW + 10, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text((company?.name || invoice.companyName).slice(0, 40), margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(company?.legalNumber || 'N° RC / NIU en cours', margin + 4, y + 20);
  doc.text(`${company?.address || ''} · ${company?.city || 'Douala'}`, margin + 4, y + 26);
  doc.text(`Tél : ${company?.phone || '-'} · ${company?.email || ''}`, margin + 4, y + 32);

  doc.setFontSize(8.5);
  doc.text(`N° Facture : ${invoice.invoiceNumber}`, margin + colW + 10, y + 14);
  doc.text(`Date d'émission : ${formatDateFr(invoice.issuedAt)}`, margin + colW + 10, y + 20);
  doc.text(`Date d'échéance : ${formatDateFr(invoice.dueDate)}`, margin + colW + 10, y + 26);
  const statusLabel =
    invoice.status === 'PAID' ? 'PAYÉE' : invoice.status === 'OVERDUE' ? 'EN RETARD' : 'EN ATTENTE';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.status === 'PAID' ? 22 : 180, invoice.status === 'PAID' ? 163 : 83, invoice.status === 'PAID' ? 74 : 9);
  doc.text(`Statut : ${statusLabel}`, margin + colW + 10, y + 32);

  y += 46;

  // Tableau des prestations SaaS
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DÉSIGNATION DE LA LICENCE & PÉRIODE', margin + 4, y + 6);
  doc.text('QUOTAS INCLUS', margin + 102, y + 6);
  doc.text('MONTANT HT', pageWidth - margin - 4, y + 6, { align: 'right' });
  y += 9;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 26, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Forfait BATI-PILOT ${planSpec?.name || invoice.plan}`, margin + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(invoice.periodLabel, margin + 4, y + 14);
  if (invoice.notes) {
    doc.text(invoice.notes.slice(0, 62), margin + 4, y + 20);
  }

  const limitProj =
    planSpec && planSpec.maxProjects >= 999
      ? 'Chantiers illimités'
      : `${planSpec?.maxProjects || 10} chantiers actifs`;
  const limitUsr =
    planSpec && planSpec.maxUsers >= 999
      ? 'Utilisateurs illimités'
      : `${planSpec?.maxUsers || 20} utilisateurs`;
  doc.setTextColor(15, 23, 42);
  doc.text(limitProj, margin + 102, y + 9);
  doc.text(limitUsr, margin + 102, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${formatAmount(invoice.amountHTXAF)} FCFA`, pageWidth - margin - 4, y + 12, {
    align: 'right',
  });

  y += 32;

  // Bloc Totaux HT / TVA 19.25% / TTC
  const totX = pageWidth - margin - 78;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totX, y, 78, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text('Total Hors Taxes (HT) :', totX + 4, y + 7);
  doc.text(`${formatAmount(invoice.amountHTXAF)} FCFA`, totX + 74, y + 7, { align: 'right' });

  doc.text('TVA Cameroun (19,25%) :', totX + 4, y + 14);
  doc.text(`${formatAmount(invoice.tvaXAF)} FCFA`, totX + 74, y + 14, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(totX + 4, y + 18, totX + 74, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('NET À PAYER (TTC) :', totX + 4, y + 25);
  doc.setTextColor(194, 65, 12);
  doc.text(`${formatAmount(invoice.amountTTCXAF)} FCFA`, totX + 74, y + 25, { align: 'right' });

  // Détails de règlement à gauche
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth - 84, 30, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MODALITÉS & PREUVE DE RÈGLEMENT', margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Mode : ${getPaymentLabel(invoice.paymentMethod)}`, margin + 4, y + 14);
  doc.text(`Référence : ${invoice.paymentReference || 'En attente de règlement'}`, margin + 4, y + 20);
  doc.text(
    invoice.paidAt ? `Réglée le : ${formatDateFr(invoice.paidAt)}` : `Échéance : ${formatDateFr(invoice.dueDate)}`,
    margin + 4,
    y + 26
  );

  // Pied de page légal
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'BATI-PILOT Vertical SaaS BTP · Facture acquittée électroniquement · Zone CEMAC / Cameroun (XAF)',
    pageWidth / 2,
    pageHeight - 13,
    { align: 'center' }
  );

  const arr = doc.output('arraybuffer');
  return Buffer.from(arr);
}
