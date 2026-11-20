import { jsPDF } from 'jspdf';
import { Company, PurchaseOrder } from '../src/types';

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

function getStatusBanner(status: PurchaseOrder['status']): { label: string; rgb: [number, number, number] } {
  if (status === 'APPROVED') return { label: 'APPROUVE DG - BON POUR COMMANDE', rgb: [5, 150, 105] };
  if (status === 'ORDERED') return { label: 'TRANSMIS AU FOURNISSEUR', rgb: [37, 99, 235] };
  if (status === 'DELIVERED') return { label: 'LIVRE & RECEPTIONNE', rgb: [5, 150, 105] };
  if (status === 'PENDING_APPROVAL') return { label: 'EN ATTENTE DE VISA DIRECTION GENERALE', rgb: [217, 119, 6] };
  if (status === 'REJECTED') return { label: 'REFUSE PAR LA DIRECTION', rgb: [185, 28, 28] };
  return { label: 'BROUILLON - NON VALIDE', rgb: [100, 116, 139] };
}

export function generatePurchaseOrderPdfBuffer(
  company: Company,
  order: PurchaseOrder
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
  doc.setFontSize(15);
  doc.text('BON DE COMMANDE MATERIAUX BTP', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${company.name}`, margin, 20);
  doc.text(
    `${company.address}, ${company.city} · ${company.legalNumber || 'Devise XAF (FCFA)'}`,
    margin,
    25.5
  );
  doc.text(`Tel : ${company.phone} · Email : ${company.email}`, margin, 30.5);

  // Référence BC à droite
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(253, 186, 116);
  doc.text(order.orderNumber, pageWidth - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Date emission : ${formatDateFr(order.createdAt)}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Livraison souhaitee : ${formatDateFr(order.expectedDeliveryDate)}`, pageWidth - margin, 25.5, {
    align: 'right',
  });

  let y = 42;

  // Bandeau Statut Circuit DG
  const statusInfo = getStatusBanner(order.status);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(statusInfo.rgb[0], statusInfo.rgb[1], statusInfo.rgb[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(statusInfo.rgb[0], statusInfo.rgb[1], statusInfo.rgb[2]);
  doc.text(`STATUT : ${statusInfo.label}`, margin + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Reglement : ${order.paymentTerms}`, pageWidth - margin - 4, y + 6.5, { align: 'right' });

  y += 15;

  // Blocs Fournisseur & Chantier côte à côte
  const boxW = (contentWidth - 6) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxW, 28, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + boxW + 6, y, boxW, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('FOURNISSEUR DESTINATAIRE', margin + 4, y + 6);
  doc.text('CHANTIER DE LIVRAISON / IMPUTATION', margin + boxW + 10, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(truncateText(order.supplierName, 38), margin + 4, y + 12.5);
  doc.text(truncateText(`${order.projectCode} - ${order.projectName}`, 38), margin + boxW + 10, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact : ${order.supplierContact || 'Service Commercial'}`, margin + 4, y + 18.5);
  doc.text(`Tel : ${order.supplierPhone || '-'}`, margin + 4, y + 24);

  doc.text(`Demandeur : ${order.requestedByName}`, margin + boxW + 10, y + 18.5);
  doc.text(
    `Visa DG : ${order.approvedByName || 'En attente de signature'}`,
    margin + boxW + 10,
    24 + y
  );

  y += 34;

  // Tableau des lignes de commande
  const cols = {
    num: margin + 3,
    desig: margin + 12,
    unite: margin + 98,
    qte: margin + 125,
    pu: margin + 152,
    total: pageWidth - margin - 3,
  };

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('N°', cols.num, y + 5.7);
  doc.text('Designation Materiau / Prestation', cols.desig, y + 5.7);
  doc.text('Unite', cols.unite, y + 5.7);
  doc.text('Qte', cols.qte, y + 5.7, { align: 'right' });
  doc.text('P.U. (FCFA)', cols.pu, y + 5.7, { align: 'right' });
  doc.text('Total HT (FCFA)', cols.total, y + 5.7, { align: 'right' });
  y += 8.5;

  order.items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 9, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${idx + 1}`, cols.num, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(truncateText(item.designation, 44), cols.desig, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(truncateText(item.unit, 13), cols.unite, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.text(formatAmount(item.quantity), cols.qte, y + 6, { align: 'right' });
    doc.text(formatAmount(item.unitPriceXAF), cols.pu, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(item.totalLineXAF), cols.total, y + 6, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 9, pageWidth - margin, y + 9);
    y += 9;
  });

  y += 6;

  // Bloc Totaux (HT, TVA 19.25% si cochée, Total TTC)
  const totalsW = 86;
  const totalsX = pageWidth - margin - totalsW;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, y, totalsW, 28, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Total H.T. :', totalsX + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatAmount(order.subtotalXAF)} FCFA`, pageWidth - margin - 4, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(order.includeTVA ? 'TVA Cameroun (19.25%) :' : 'TVA (Exonere / Non incl.) :', totalsX + 4, y + 14);
  doc.text(`${formatAmount(order.tvaXAF)} FCFA`, pageWidth - margin - 4, y + 14, { align: 'right' });

  doc.setDrawColor(234, 88, 12);
  doc.line(totalsX + 4, y + 17.5, pageWidth - margin - 4, y + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(234, 88, 12);
  doc.text('NET A COMMANDER :', totalsX + 4, y + 24);
  doc.text(`${formatAmount(order.totalAmountXAF)} FCFA`, pageWidth - margin - 4, y + 24, { align: 'right' });

  // Observations éventuelles à gauche du bloc totaux
  if (order.notes || order.rejectionReason) {
    const noteW = contentWidth - totalsW - 6;
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(margin, y, noteW, 28, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(154, 52, 18);
    doc.text(order.rejectionReason ? 'Motif du refus DG :' : 'Instructions / Notes chantier :', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(order.rejectionReason || order.notes || '', noteW - 8);
    doc.text(noteLines.slice(0, 3), margin + 4, y + 13);
  }

  y += 38;

  // Cadres Signatures (Demandeur vs Direction Générale)
  const sigW = (contentWidth - 8) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(margin, y, sigW, 30, 1.5, 1.5, 'D');
  doc.roundedRect(margin + sigW + 8, y, sigW, 30, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Etabli par (Conducteur / Chef Chantier)', margin + 4, y + 7);
  doc.text('Visa & Signature Direction Generale (DG)', margin + sigW + 12, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(order.requestedByName, margin + 4, y + 14);
  if (order.approvedByName) {
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALIDE : ${order.approvedByName}`, margin + sigW + 12, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Date visa : ${formatDateFr(order.approvedAt)}`, margin + sigW + 12, y + 20);
  } else {
    doc.text('Cachet & Signature requis avant livraison', margin + sigW + 12, y + 14);
  }

  // Pied de page
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `BATI-PILOT SaaS BTP · Bon de Commande Officiel ${order.orderNumber} · Cameroun (FCFA)`,
    margin,
    pageHeight - 8.5
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
