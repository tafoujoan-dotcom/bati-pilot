import { jsPDF } from 'jspdf';
import {
  Company,
  DeliveryNote,
  ExpenseRecord,
  PurchaseOrder,
  SupplierWithPerformance,
} from '../src/types';

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

function getStatusLabel(status: SupplierWithPerformance['status']): string {
  switch (status) {
    case 'PREFERRED':
      return 'AGREE / PREFERE';
    case 'ACTIVE':
      return 'ACTIF STANDARD';
    case 'UNDER_REVIEW':
      return 'SOUS SURVEILLANCE';
    case 'BLACKLISTED':
      return 'SUSPENDU / BLACKLISTE';
    default:
      return status;
  }
}

function getTermsLabel(terms: SupplierWithPerformance['paymentTerms']): string {
  switch (terms) {
    case 'CASH_ON_DELIVERY':
      return 'Paiement comptant a livraison';
    case 'ADVANCE_50':
      return 'Acompte 50% a commande / 50% livraison';
    case 'NET_15':
      return 'Net 15 jours fin de decade';
    case 'NET_30':
      return 'Net 30 jours date facture';
    case 'NET_45':
      return 'Net 45 jours fin de mois';
    default:
      return terms;
  }
}

export function generateSupplierDossierPdfBuffer(params: {
  company: Company | undefined;
  supplier: SupplierWithPerformance;
  orders: PurchaseOrder[];
  deliveries: DeliveryNote[];
  expenses: ExpenseRecord[];
}): Buffer {
  const { company, supplier, orders, deliveries } = params;
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

  // En-tête entreprise cliente
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F');

  doc.setTextColor(249, 115, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(company?.name || 'ENTREPRISE BTP', margin + 5, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('FICHE EVALUATION & PERFORMANCE FOURNISSEUR BTP', margin + 5, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${company?.legalNumber || 'Cameroun'} · Edite le ${formatDateFr(new Date().toISOString())}`,
    margin + 5,
    y + 23
  );

  y += 34;

  // Bloc Identité Fournisseur
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(supplier.name, margin + 5, y + 8);

  doc.setFontSize(8.5);
  doc.setTextColor(194, 65, 12);
  doc.text(`Statut : ${getStatusLabel(supplier.status)}  |  Note : ${supplier.rating.toFixed(1)} / 5`, pageWidth - margin - 5, y + 8, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`NIU : ${supplier.niu}    ·    RCCM : ${supplier.rccm}`, margin + 5, y + 15);
  doc.text(`Contact : ${supplier.contactPerson}  |  Tel : ${supplier.phone}  |  Email : ${supplier.email || '-'}`, margin + 5, y + 21);
  doc.text(`Adresse : ${supplier.address} (${supplier.city})`, margin + 5, y + 27);
  doc.text(`Conditions : ${getTermsLabel(supplier.paymentTerms)}`, margin + 5, y + 33);

  const specLines = doc.splitTextToSize(`Specialites : ${supplier.specialties}`, contentWidth - 10);
  doc.setFontSize(8);
  doc.text(specLines[0] || '', margin + 5, y + 38);

  y += 46;

  // Indicateurs de performance (4 tuiles)
  const tileW = (contentWidth - 9) / 4;
  const kpis = [
    {
      label: 'Taux Conformite BL',
      value:
        supplier.metrics.conformityRatePct === null
          ? 'Non evalue'
          : `${supplier.metrics.conformityRatePct}%`,
      sub:
        supplier.metrics.deliveriesCount === 0
          ? 'Aucune livraison (0 BL)'
          : `${supplier.metrics.conformDeliveriesCount}/${supplier.metrics.deliveriesCount} BL conformes`,
    },
    {
      label: 'Litiges Reception',
      value: `${supplier.metrics.disputeDeliveriesCount}`,
      sub: 'Ecarts ou avaries signales',
    },
    {
      label: 'Volume Commande TTC',
      value: `${formatAmount(supplier.metrics.totalOrderedTTCXAF)}`,
      sub: `${supplier.metrics.ordersCount} bon(s) de commande`,
    },
    {
      label: 'Encours Restant FCFA',
      value: `${formatAmount(supplier.metrics.outstandingPayableXAF)}`,
      sub: `Regle : ${formatAmount(supplier.metrics.paidExpensesXAF)} FCFA`,
    },
  ];

  kpis.forEach((k, idx) => {
    const x = margin + idx * (tileW + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, y, tileW, 22, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(k.label, x + 3, y + 6);

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, x + 3, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub, x + 3, y + 19);
  });

  y += 29;

  // Historique des Bons de Commande
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Bons de Commande Associes (${orders.length})`, margin, y);
  y += 4;

  if (orders.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Aucun bon de commande enregistre pour ce fournisseur.', margin, y + 4);
    y += 10;
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.8);
    doc.text('N° Commande', margin + 2, y + 4.8);
    doc.text('Chantier', margin + 35, y + 4.8);
    doc.text('Statut', margin + 105, y + 4.8);
    doc.text('Montant TTC (FCFA)', pageWidth - margin - 2, y + 4.8, { align: 'right' });
    y += 7;

    orders.slice(0, 8).forEach((po, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.text(po.orderNumber, margin + 2, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.text((po.projectName || '').slice(0, 36), margin + 35, y + 4.8);
      doc.text(po.status, margin + 105, y + 4.8);
      doc.text(`${formatAmount(po.totalAmountXAF)} FCFA`, pageWidth - margin - 2, y + 4.8, {
        align: 'right',
      });
      y += 7;
    });
    y += 6;
  }

  // Historique des Bons de Livraison & Litiges
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Bons de Livraison & Controles Reception (${deliveries.length})`, margin, y);
  y += 4;

  if (deliveries.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Aucun bon de livraison receptionne a ce jour.', margin, y + 4);
    y += 10;
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.8);
    doc.text('N° BL Interne', margin + 2, y + 4.8);
    doc.text('Ref BL Fournisseur', margin + 35, y + 4.8);
    doc.text('Date', margin + 78, y + 4.8);
    doc.text('Conformite', margin + 108, y + 4.8);
    doc.text('Observation', margin + 135, y + 4.8);
    y += 7;

    deliveries.slice(0, 8).forEach((dn, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 7, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      doc.text(dn.deliveryNumber, margin + 2, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.text((dn.supplierBlReference || '-').slice(0, 20), margin + 35, y + 4.8);
      doc.text(formatDateFr(dn.deliveryDate), margin + 78, y + 4.8);

      if (dn.status === 'DISPUTED') {
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setTextColor(21, 128, 61);
      }
      doc.text(dn.status === 'DISPUTED' ? 'LITIGE' : 'CONFORME', margin + 108, y + 4.8);

      doc.setTextColor(71, 85, 105);
      doc.text((dn.observations || 'RAS').slice(0, 28), margin + 135, y + 4.8);
      y += 7;
    });
  }

  // Pied de page
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document genere par BATI-PILOT · Module 10 Annuaire & Performance Fournisseurs · ${company?.city || 'Douala'}, Cameroun`,
    margin,
    pageHeight - 10
  );

  return Buffer.from(doc.output('arraybuffer'));
}
