import { jsPDF } from 'jspdf';
import { AttendanceRecord, AttendanceStatus, Company, Project, Worker } from '../src/types';

function formatAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDateFr(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00Z`);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Présent',
  HALF_DAY: 'Demi-journée',
  LATE: 'Retard',
  ABSENT: 'Absent',
};

const CONTRACT_LABELS: Record<string, string> = {
  JOURNALIER: 'Journalier',
  TACHERON: 'Tâcheron',
  MENSUEL: 'Mensuel',
};

function drawCompanyBanner(
  doc: jsPDF,
  company: Company,
  project: Project,
  title: string,
  subtitle: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // En-tête sombre professionnel
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(249, 115, 22);
  doc.text('BATI-PILOT', margin + 5, y + 8.5);

  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(company.name, margin + 5, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const legalLine = `${company.city} (${company.country}) · Tél : ${company.phone}${company.legalNumber ? ` · ${company.legalNumber}` : ''}`;
  doc.text(legalLine, margin + 5, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 186, 116);
  doc.text(`Devise : ${company.currency || 'XAF'} (FCFA)`, pageWidth - margin - 5, y + 8.5, { align: 'right' });

  y += 32;

  // Titre du document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, margin, y);
  y += 6;

  // Cartouche Chantier
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Chantier : ${project.name} (${project.code})`, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Localisation : ${project.location}, ${project.city} · Conducteur : ${project.managerName || 'Non assigné'}`,
    margin + 4,
    y + 12
  );

  return y + 22;
}

export function generateDailyAttendancePdfBuffer(
  company: Company,
  project: Project,
  date: string,
  workers: Worker[],
  attendance: AttendanceRecord[]
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const activeWorkers = workers.filter((w) => w.isActive);

  let presentCount = 0;
  let halfDayCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let totalDayPay = 0;

  activeWorkers.forEach((w) => {
    const rec = attendance.find((a) => a.workerId === w.id);
    if (!rec) return;
    if (rec.status === 'PRESENT') presentCount++;
    else if (rec.status === 'HALF_DAY') halfDayCount++;
    else if (rec.status === 'LATE') lateCount++;
    else if (rec.status === 'ABSENT') absentCount++;
    totalDayPay += rec.amountEarnedXAF || 0;
  });

  const validatedRec = attendance.find((a) => a.isValidated);
  const isValidated =
    activeWorkers.length > 0 && attendance.length >= activeWorkers.length && attendance.every((a) => a.isValidated);

  let y = drawCompanyBanner(
    doc,
    company,
    project,
    'FEUILLE DE POINTAGE QUOTIDIEN DE CHANTIER',
    `Date d'appel : ${formatDateFr(date)} · Statut : ${isValidated ? `Validée par ${validatedRec?.validatedBy || 'Chef de chantier'}` : 'Pointage en cours de saisie'}`
  );

  // Bandeau KPI résumé
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(154, 52, 18);
  doc.text(
    `Actifs : ${activeWorkers.length}   |   Présents : ${presentCount}   |   Demi-J : ${halfDayCount}   |   Retards : ${lateCount}   |   Absents : ${absentCount}`,
    margin + 4,
    y + 8
  );
  doc.setTextColor(15, 23, 42);
  doc.text(`Total jour : ${formatAmount(totalDayPay)} FCFA`, pageWidth - margin - 4, y + 8, { align: 'right' });

  y += 18;

  // En-tête du tableau
  const drawTableHeader = (topY: number) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, topY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Matricule', margin + 2.5, topY + 5.3);
    doc.text('Nom & Prénom', margin + 22, topY + 5.3);
    doc.text('Corps de métier', margin + 64, topY + 5.3);
    doc.text('Arrivée', margin + 104, topY + 5.3);
    doc.text('Statut', margin + 121, topY + 5.3);
    doc.text('H.Sup', margin + 145, topY + 5.3);
    doc.text('Gain (FCFA)', pageWidth - margin - 2.5, topY + 5.3, { align: 'right' });
    return topY + 8;
  };

  y = drawTableHeader(y);

  activeWorkers.forEach((worker, idx) => {
    if (y > pageHeight - 36) {
      doc.addPage();
      y = drawTableHeader(16);
    }

    const rec = attendance.find((a) => a.workerId === worker.id);
    const statusLabel = rec ? STATUS_LABELS[rec.status] : 'Non pointé';
    const checkIn = rec?.checkInTime || '-';
    const overtime = rec?.overtimeHours ? `+${rec.overtimeHours}h` : '0h';
    const earned = rec ? `${formatAmount(rec.amountEarnedXAF)} F` : '0 F';

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(worker.matricule, margin + 2.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(worker.fullName.slice(0, 24), margin + 22, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(worker.specialtyLabel.slice(0, 22), margin + 64, y + 5);
    doc.text(checkIn, margin + 104, y + 5);

    if (rec?.status === 'PRESENT') doc.setTextColor(22, 163, 74);
    else if (rec?.status === 'HALF_DAY') doc.setTextColor(2, 132, 199);
    else if (rec?.status === 'LATE') doc.setTextColor(217, 119, 6);
    else if (rec?.status === 'ABSENT') doc.setTextColor(220, 38, 38);
    else doc.setTextColor(100, 116, 139);

    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, margin + 121, y + 5);

    doc.setFont('courier', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(overtime, margin + 145, y + 5);

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(earned, pageWidth - margin - 2.5, y + 5, { align: 'right' });

    y += 7.5;
  });

  // Ligne Total
  y += 2;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`TOTAL MAIN D'OEUVRE DU JOUR (${activeWorkers.length} OUVRIERS)`, margin + 4, y + 5.8);
  doc.setTextColor(253, 186, 116);
  doc.text(`${formatAmount(totalDayPay)} FCFA`, pageWidth - margin - 4, y + 5.8, { align: 'right' });

  y += 15;
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }

  // Bloc signatures officielles
  const boxW = (contentWidth - 8) / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, boxW, 22, 1.5, 1.5, 'FD');
  doc.roundedRect(margin + boxW + 8, y, boxW, 22, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Visa Chef de Chantier (Pointeur)', margin + 4, y + 5.5);
  doc.text('Visa Direction / Comptabilité Paie', margin + boxW + 12, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isValidated ? `Signé numériquement : ${validatedRec?.validatedBy || 'Chef de chantier'}` : 'En attente de validation terrain',
    margin + 4,
    y + 12
  );
  doc.text('Date & Cachet :', margin + boxW + 12, y + 12);

  // Pied de page
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document généré par BATI-PILOT le ${new Date().toLocaleDateString('fr-FR')} · Fuseau Africa/Douala`,
    margin,
    pageHeight - 8
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export function generateWorkersDirectoryPdfBuffer(
  company: Company,
  project: Project,
  workers: Worker[]
): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const activeWorkers = workers.filter((w) => w.isActive);
  const theoreticalDailyTotal = activeWorkers.reduce((sum, w) => sum + w.dailyRateXAF, 0);

  let y = drawCompanyBanner(
    doc,
    company,
    project,
    'RÉPERTOIRE OFFICIEL DU PERSONNEL & TÂCHERONS DE CHANTIER',
    `Effectif inscrit : ${workers.length} ouvrier(s) · Actifs sur site : ${activeWorkers.length} · En pause : ${workers.length - activeWorkers.length}`
  );

  // Bandeau résumé effectif
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Effectif actif affecté : ${activeWorkers.length} personne(s)`, margin + 4, y + 7.5);
  doc.text(
    `Masse salariale théorique / jour (100% présence) : ${formatAmount(theoreticalDailyTotal)} FCFA`,
    pageWidth - margin - 4,
    y + 7.5,
    { align: 'right' }
  );

  y += 17;

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, topY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Matricule', margin + 2.5, topY + 5.3);
    doc.text('Nom & Prénom', margin + 21, topY + 5.3);
    doc.text('Corps de métier', margin + 58, topY + 5.3);
    doc.text('Contrat', margin + 95, topY + 5.3);
    doc.text('Téléphone / CNI', margin + 116, topY + 5.3);
    doc.text('Statut', margin + 148, topY + 5.3);
    doc.text('Taux/J (FCFA)', pageWidth - margin - 2.5, topY + 5.3, { align: 'right' });
    return topY + 8;
  };

  y = drawTableHeader(y);

  workers.forEach((worker, idx) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = drawTableHeader(16);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 9, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 9, pageWidth - margin, y + 9);

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(worker.matricule, margin + 2.5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(worker.fullName.slice(0, 22), margin + 21, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(worker.specialtyLabel.slice(0, 21), margin + 58, y + 5.5);
    doc.text(CONTRACT_LABELS[worker.contractType] || worker.contractType, margin + 95, y + 5.5);

    doc.setFontSize(7);
    doc.text(worker.phone || '-', margin + 116, y + 4.3);
    if (worker.cniNumber) {
      doc.setTextColor(100, 116, 139);
      doc.text(`CNI: ${worker.cniNumber}`, margin + 116, y + 7.6);
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    if (worker.isActive) {
      doc.setTextColor(22, 163, 74);
      doc.text('Actif', margin + 148, y + 5.5);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text('En pause', margin + 148, y + 5.5);
    }

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatAmount(worker.dailyRateXAF)} F`, pageWidth - margin - 2.5, y + 5.5, { align: 'right' });

    y += 9;
  });

  // Pied de page
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Répertoire édité par BATI-PILOT le ${new Date().toLocaleDateString('fr-FR')} · Fuseau Africa/Douala`,
    margin,
    pageHeight - 8
  );

  return Buffer.from(doc.output('arraybuffer'));
}
