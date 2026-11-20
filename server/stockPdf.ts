import { jsPDF } from 'jspdf';
import { Company, MaterialItem, StockMovement } from '../src/types';

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '.' : text;
}

function formatDateFr(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function generateStockInventoryPdfBuffer(
  company: Company,
  materials: MaterialItem[]
): Buffer {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const drawHeader = (pageNum: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(234, 88, 12);
    doc.rect(0, 24, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BATI-PILOT · ETAT D\'INVENTAIRE & VALORISATION DES STOCKS BTP', margin, 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `${company.name} · ${company.city}, ${company.country} · Devise : FCFA (XAF)`,
      margin,
      17.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(253, 186, 116);
    doc.text(
      `Edite le ${formatDateFr(new Date().toISOString())} · Page ${pageNum}`,
      pageWidth - margin,
      14,
      { align: 'right' }
    );
  };

  const drawFooter = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `BATI-PILOT SaaS BTP · Controle des Depots & Materiaux · Fuseau Africa/Douala`,
      margin,
      pageHeight - 5.5
    );
  };

  let pageNum = 1;
  drawHeader(pageNum);
  drawFooter();

  let y = 31;

  // Bandeau KPI Synthese
  const totalValueXAF = materials.reduce((s, m) => s + m.currentStock * m.unitPriceXAF, 0);
  const criticalCount = materials.filter((m) => m.currentStock <= m.minimumStockAlert).length;
  const warningCount = materials.filter(
    (m) => m.currentStock > m.minimumStockAlert && m.currentStock <= m.minimumStockAlert * 1.35
  ).length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`References catalogue : ${materials.length} articles`, margin + 4, y + 6.5);
  doc.setTextColor(185, 28, 28);
  doc.text(`Alertes critiques : ${criticalCount}`, margin + 78, y + 6.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`Sous surveillance : ${warningCount}`, margin + 135, y + 6.5);

  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9.5);
  doc.text(
    `VALEUR TOTALE DU STOCK : ${formatAmount(totalValueXAF)} FCFA`,
    pageWidth - margin - 4,
    y + 10,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Perimetre : Depot Central Bassa & Parc Materiels · Verification physique hebdomadaire`,
    margin + 4,
    y + 12.5
  );

  y += 21;

  // En-tetes du tableau
  const cols = {
    ref: margin + 2,
    desig: margin + 30,
    cat: margin + 104,
    depot: margin + 138,
    stock: margin + 178,
    seuil: margin + 198,
    pu: margin + 218,
    val: margin + 245,
    statut: pageWidth - margin - 2,
  };

  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Reference', cols.ref, y + 5.3);
    doc.text('Designation & Fournisseur', cols.desig, y + 5.3);
    doc.text('Categorie', cols.cat, y + 5.3);
    doc.text('Depot', cols.depot, y + 5.3);
    doc.text('Stock', cols.stock, y + 5.3, { align: 'right' });
    doc.text('Seuil', cols.seuil, y + 5.3, { align: 'right' });
    doc.text('P.U. FCFA', cols.pu, y + 5.3, { align: 'right' });
    doc.text('Valeur FCFA', cols.val, y + 5.3, { align: 'right' });
    doc.text('Etat', cols.statut, y + 5.3, { align: 'right' });
    y += 8;
  };

  drawTableHeader();

  materials.forEach((m, idx) => {
    if (y > pageHeight - 36) {
      doc.addPage();
      pageNum++;
      drawHeader(pageNum);
      drawFooter();
      y = 31;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 8.5, 'F');
    }

    const isCritical = m.currentStock <= m.minimumStockAlert;
    const isWarning = !isCritical && m.currentStock <= m.minimumStockAlert * 1.35;
    const valXAF = m.currentStock * m.unitPriceXAF;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(truncateText(m.reference, 15), cols.ref, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.text(truncateText(`${m.designation} (${m.supplierName})`, 43), cols.desig, y + 5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(truncateText(m.categoryLabel, 19), cols.cat, y + 5.5);
    doc.text(truncateText(m.depotLocation, 21), cols.depot, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isCritical ? 185 : 15, isCritical ? 28 : 23, isCritical ? 28 : 42);
    doc.text(`${formatAmount(m.currentStock)}`, cols.stock, y + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${formatAmount(m.minimumStockAlert)}`, cols.seuil, y + 5.5, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.text(formatAmount(m.unitPriceXAF), cols.pu, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(valXAF), cols.val, y + 5.5, { align: 'right' });

    if (isCritical) {
      doc.setTextColor(185, 28, 28);
      doc.text('CRITIQUE', cols.statut, y + 5.5, { align: 'right' });
    } else if (isWarning) {
      doc.setTextColor(180, 83, 9);
      doc.text('VIGILANCE', cols.statut, y + 5.5, { align: 'right' });
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('OK', cols.statut, y + 5.5, { align: 'right' });
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8.5, pageWidth - margin, y + 8.5);
    y += 8.5;
  });

  // Ligne total + Visas
  if (y > pageHeight - 36) {
    doc.addPage();
    pageNum++;
    drawHeader(pageNum);
    drawFooter();
    y = 32;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL VALORISATION INVENTAIRE :', cols.depot, y + 6);
  doc.setTextColor(234, 88, 12);
  doc.text(`${formatAmount(totalValueXAF)} FCFA`, cols.val, y + 6, { align: 'right' });

  y += 14;
  const boxW = (contentWidth - 8) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, boxW, 18, 1.5, 1.5, 'D');
  doc.roundedRect(margin + boxW + 8, y, boxW, 18, 1.5, 1.5, 'D');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Visa Magasinier Depot Central (Verification physique)', margin + 4, y + 5.5);
  doc.text('Visa Direction Generale / Controle de Gestion', margin + boxW + 12, y + 5.5);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

export function generateStockMovementSlipPdfBuffer(
  company: Company,
  movement: StockMovement
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const isExit = movement.type === 'EXIT';
  const titleText = isExit
    ? 'BON DE SORTIE MATERIAUX CHANTIER'
    : movement.type === 'ENTRY'
      ? 'BON D\'ENTREE & RECEPTION DEPOT'
      : 'PROCES-VERBAL D\'AJUSTEMENT INVENTAIRE';

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 32, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(titleText, margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${company.name} · ${company.address}, ${company.city}`, margin, 22);
  doc.text(`N° Document : ${movement.referenceDoc} · Date : ${formatDateFr(movement.createdAt)}`, margin, 27.5);

  let y = 44;

  // Fiche de mouvement
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILS DU MOUVEMENT', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Type d'operation : ${isExit ? 'Sortie vers Chantier' : movement.type === 'ENTRY' ? 'Entree fournisseur au Depot' : 'Ajustement d\'inventaire'}`, margin + 5, y + 16);
  doc.text(`Chantier / Destination : ${movement.projectName || 'Depot Central Entreprise'}`, margin + 5, y + 23);
  doc.text(`Emetteur (Magasinier) : ${movement.operatorName}`, margin + 5, y + 30);
  doc.text(`Recepteur / Fournisseur : ${movement.recipientName}`, margin + 5, y + 37);

  y += 50;

  // Tableau article
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Reference', margin + 3, y + 6);
  doc.text('Designation Materiau', margin + 35, y + 6);
  doc.text('Quantite', margin + 115, y + 6, { align: 'right' });
  doc.text('P.U. (FCFA)', margin + 145, y + 6, { align: 'right' });
  doc.text('Valeur (FCFA)', pageWidth - margin - 3, y + 6, { align: 'right' });
  y += 9;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 14, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(movement.materialReference, margin + 3, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(truncateText(movement.materialDesignation, 36), margin + 35, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatAmount(movement.quantity)} ${movement.unit}`, margin + 115, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatAmount(movement.unitPriceXAF), margin + 145, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(formatAmount(movement.totalValueXAF), pageWidth - margin - 3, y + 9, { align: 'right' });

  y += 22;

  if (movement.notes) {
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(154, 52, 18);
    doc.text('Observations / Affectation technique :', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(truncateText(movement.notes, 90), margin + 4, y + 14);
    y += 28;
  }

  // Cadres signatures
  const sigW = (contentWidth - 10) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(margin, y, sigW, 32, 2, 2, 'D');
  doc.roundedRect(margin + sigW + 10, y, sigW, 32, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Signature Magasinier (Remis par)', margin + 4, y + 7);
  doc.text('Signature Conducteur / Recepteur', margin + sigW + 14, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(movement.operatorName, margin + 4, y + 14);
  doc.text(movement.recipientName, margin + sigW + 14, y + 14);

  // Pied de page
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `BATI-PILOT · Document de tracabilite depot BTP genere le ${formatDateFr(new Date().toISOString())}`,
    margin,
    pageHeight - 9
  );

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
