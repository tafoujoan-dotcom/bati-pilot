import { jsPDF } from 'jspdf';
import { Company, DeliveryNote } from '../src/types';

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

function getDeliveryStatusBanner(status: DeliveryNote['status']): {
  label: string;
  rgb: [number, number, number];
} {
  if (status === 'COMPLETED') {
    return { label: 'RECEPTION COMPLETE & CONFORME', rgb: [5, 150, 105] };
  }
  if (status === 'PARTIAL') {
    return { label: 'RECEPTION PARTIELLE - RELIQUAT A LIVRER', rgb: [217, 119, 6] };
  }
  return { label: 'RECEPTION AVEC RESERVES / LITIGE SIGNALE', rgb: [185, 28, 28] };
}

export function generateDeliveryNotePdfBuffer(
  company: Company,
  delivery: DeliveryNote
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
  doc.text('BON DE LIVRAISON & RECEPTION BTP', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`${company.name}`, margin, 20);
  doc.text(
    `${company.address}, ${company.city} - ${company.legalNumber || 'Devise XAF (FCFA)'}`,
    margin,
    25.5
  );
  doc.text(`Tel : ${company.phone} - Email : ${company.email}`, margin, 30.5);

  // Référence BL à droite
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(253, 186, 116);
  doc.text(delivery.deliveryNumber, pageWidth - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Date reception : ${formatDateFr(delivery.deliveryDate)}`, pageWidth - margin, 20, {
    align: 'right',
  });
  doc.text(`Ref. BC : ${delivery.purchaseOrderNumber}`, pageWidth - margin, 25.5, {
    align: 'right',
  });
  doc.text(
    `BL Fournisseur : ${delivery.supplierBlReference || 'Non renseigne'}`,
    pageWidth - margin,
    30.5,
    { align: 'right' }
  );

  let y = 42;

  // Bandeau Statut & Destination
  const statusInfo = getDeliveryStatusBanner(delivery.status);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(statusInfo.rgb[0], statusInfo.rgb[1], statusInfo.rgb[2]);
  doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(statusInfo.rgb[0], statusInfo.rgb[1], statusInfo.rgb[2]);
  doc.text(`STATUT : ${statusInfo.label}`, margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const destLabel =
    delivery.destination === 'DEPOT'
      ? 'Destination : Depot Central (Entree Stock Auto)'
      : 'Destination : Livraison Directe Chantier';
  doc.text(destLabel, pageWidth - margin - 4, y + 7, { align: 'right' });

  y += 16;

  // Blocs Fournisseur / Transport & Chantier / Réceptionnaire
  const boxW = (contentWidth - 6) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxW, 30, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + boxW + 6, y, boxW, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text('FOURNISSEUR & TRANSPORT', margin + 4, y + 6);
  doc.text('CHANTIER & RECEPTIONNAIRE', margin + boxW + 10, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(truncateText(delivery.supplierName, 38), margin + 4, y + 12.5);
  doc.text(
    truncateText(`${delivery.projectCode} - ${delivery.projectName}`, 38),
    margin + boxW + 10,
    y + 12.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Chauffeur : ${delivery.driverName || 'Non renseigne'}`,
    margin + 4,
    y + 18.5
  );
  doc.text(
    `Immatriculation : ${delivery.truckPlate || 'Non renseignee'}`,
    margin + 4,
    y + 24.5
  );

  doc.text(
    `Receptionne par : ${truncateText(delivery.receivedByName, 30)}`,
    margin + boxW + 10,
    y + 18.5
  );
  doc.text(
    `Sync Stock Depot : ${delivery.stockSynced ? 'Oui (Entree enregistree)' : 'Imputation directe chantier'}`,
    margin + boxW + 10,
    y + 24.5
  );

  y += 37;

  // Tableau des articles contrôlés
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  const col1 = margin + 3; // Designation
  const col2 = margin + 74; // Cde
  const col3 = margin + 92; // Recu Conforme
  const col4 = margin + 114; // Refus/Avarie
  const col5 = margin + 138; // P.U.
  const col6 = pageWidth - margin - 3; // Valeur

  doc.text('DESIGNATION MATERIAU', col1, y + 5.7);
  doc.text('CDE', col2, y + 5.7, { align: 'right' });
  doc.text('CONFORME', col3, y + 5.7, { align: 'right' });
  doc.text('AVARIE', col4, y + 5.7, { align: 'right' });
  doc.text('P.U. (FCFA)', col5, y + 5.7, { align: 'right' });
  doc.text('VALEUR (FCFA)', col6, y + 5.7, { align: 'right' });

  y += 8.5;

  delivery.items.forEach((item, index) => {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = margin;
    }

    const bg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 9.5, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(truncateText(item.designation, 36), col1, y + 4.3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Unite : ${item.unit} | Deja recu avant BL : ${item.previouslyDeliveredQuantity}`,
      col1,
      y + 8
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(String(item.orderedQuantity), col2, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(String(item.deliveredQuantity), col3, y + 6, { align: 'right' });

    doc.setTextColor(
      item.damagedOrRejectedQuantity > 0 ? 185 : 100,
      item.damagedOrRejectedQuantity > 0 ? 28 : 116,
      item.damagedOrRejectedQuantity > 0 ? 28 : 139
    );
    doc.text(String(item.damagedOrRejectedQuantity), col4, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(formatAmount(item.unitPriceXAF), col5, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatAmount(item.totalValueXAF), col6, y + 6, { align: 'right' });

    y += 9.5;
  });

  y += 6;

  // Bloc Total Réceptionné
  const totBoxW = 86;
  const totX = pageWidth - margin - totBoxW;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totX, y, totBoxW, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('VALEUR CONFORME RECEPTIONNEE', totX + 4, y + 7);
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`${formatAmount(delivery.totalValueXAF)} FCFA`, totX + totBoxW - 4, y + 14, {
    align: 'right',
  });

  // Observations / Réserves à gauche
  if (delivery.observations || delivery.resolvedNote) {
    const obsW = contentWidth - totBoxW - 6;
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(margin, y, obsW, 24, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(154, 52, 18);
    doc.text('OBSERVATIONS / RESERVES CONTROLE :', margin + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const fullObs = [delivery.observations, delivery.resolvedNote].filter(Boolean).join(' | ');
    const lines = doc.splitTextToSize(fullObs, obsW - 6);
    doc.text(lines.slice(0, 3), margin + 3, y + 10.5);
  }

  y += 32;

  // 3 Cadres de signatures officielles (Transporteur, Magasinier, Chef de Chantier / DG)
  const sigW = (contentWidth - 8) / 3;
  const sigLabels = [
    'LIVREUR / TRANSPORTEUR',
    'MAGASINIER / RECEPTIONNAIRE',
    'VISA CHEF CHANTIER / DG',
  ];
  const sigNames = [
    delivery.driverName || 'Signature chauffeur',
    delivery.receivedByName,
    'Controle conformite chantier',
  ];

  sigLabels.forEach((lbl, idx) => {
    const sx = margin + idx * (sigW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(sx, y, sigW, 28, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, sx + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(truncateText(sigNames[idx], 26), sx + 3, y + 12);

    doc.setDrawColor(203, 213, 225);
    doc.line(sx + 4, y + 23, sx + sigW - 4, y + 23);
  });

  // Pied de page
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document genere par BATI-PILOT SaaS BTP · ${company.name} · ${delivery.deliveryNumber}`,
    margin,
    pageHeight - 10
  );
  doc.text('Page 1 / 1', pageWidth - margin, pageHeight - 10, { align: 'right' });

  const arrayBuf = doc.output('arraybuffer');
  return Buffer.from(arrayBuf);
}
