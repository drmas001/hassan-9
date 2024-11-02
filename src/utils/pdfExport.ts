import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ReportData } from '../types/reports';

export function generatePDF(data: ReportData) {
  const doc = new jsPDF();
  const dateFormat = 'MMM dd, yyyy';
  const pageWidth = doc.internal.pageSize.width;

  // Title and Header
  doc.setFontSize(20);
  doc.setTextColor(44, 82, 130);
  const title = 'ICU Patient Report';
  const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  // Date Range
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  const dateText = `Report Period: ${format(data.dateRange.startDate, dateFormat)} - ${format(data.dateRange.endDate, dateFormat)}`;
  const dateWidth = doc.getStringUnitWidth(dateText) * doc.getFontSize() / doc.internal.scaleFactor;
  doc.text(dateText, (pageWidth - dateWidth) / 2, 30);

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics', 20, 45);

  const summaryData = [
    ['Total Patients', data.metrics.totalPatients.toString()],
    ['Critical Cases', data.metrics.criticalCases.toString()],
    ['Average Stay Duration', `${data.metrics.averageStayDuration.toFixed(1)} days`],
    ['Bed Occupancy Rate', `${(data.metrics.bedOccupancyRate * 100).toFixed(1)}%`],
    ['Readmission Rate', `${(data.metrics.readmissionRate * 100).toFixed(1)}%`],
    ['Mortality Rate', `${(data.metrics.mortalityRate * 100).toFixed(1)}%`]
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 82, 130],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });

  // Patient List Overview
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(44, 82, 130);
  doc.text('Patient Overview', 20, 20);

  const patientOverviewData = data.patients.map(patient => [
    patient.mrn,
    patient.name,
    patient.age.toString(),
    patient.gender,
    patient.status,
    patient.bed_number,
    format(new Date(patient.admission_date), dateFormat)
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['MRN', 'Name', 'Age', 'Gender', 'Status', 'Bed', 'Admission Date']],
    body: patientOverviewData,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 82, 130]
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });

  // Detailed Patient Reports
  data.patients.forEach((patient) => {
    doc.addPage();
    
    // Patient Header
    doc.setFontSize(16);
    doc.setTextColor(44, 82, 130);
    doc.text(`Patient Report: ${patient.name}`, 20, 20);

    // Patient Demographics
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const demographicsData = [
      ['MRN', patient.mrn],
      ['Age', patient.age.toString()],
      ['Gender', patient.gender],
      ['Status', patient.status],
      ['Bed Number', patient.bed_number],
      ['Admission Date', format(new Date(patient.admission_date), dateFormat)]
    ];

    autoTable(doc, {
      startY: 30,
      head: [['Field', 'Value']],
      body: demographicsData,
      theme: 'grid',
      headStyles: {
        fillColor: [44, 82, 130]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Laboratory Results
    if (data.labResults && data.labResults.length > 0) {
      const patientLabs = data.labResults.filter(lab => lab.patient_id === patient.id);
      if (patientLabs.length > 0) {
        doc.setFontSize(14);
        doc.text('Laboratory Results', 20, doc.lastAutoTable.finalY + 20);

        const labData = patientLabs.map(lab => [
          lab.category,
          lab.test_name,
          lab.result,
          lab.unit || '',
          lab.status,
          format(new Date(lab.resulted_at), 'MMM dd, yyyy HH:mm')
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Category', 'Test', 'Result', 'Unit', 'Status', 'Date']],
          body: labData,
          theme: 'grid',
          headStyles: {
            fillColor: [44, 82, 130]
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });
      }
    }

    // Medications
    if (data.medications && data.medications.length > 0) {
      const patientMeds = data.medications.filter(med => med.patient_id === patient.id);
      if (patientMeds.length > 0) {
        doc.setFontSize(14);
        doc.text('Medications', 20, doc.lastAutoTable.finalY + 20);

        const medData = patientMeds.map(med => [
          med.name,
          med.dosage,
          med.route,
          med.frequency,
          med.status,
          format(new Date(med.start_date), dateFormat)
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Medication', 'Dosage', 'Route', 'Frequency', 'Status', 'Start Date']],
          body: medData,
          theme: 'grid',
          headStyles: {
            fillColor: [44, 82, 130]
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });
      }
    }

    // Procedures
    if (data.procedures && data.procedures.length > 0) {
      const patientProcs = data.procedures.filter(proc => proc.patient_id === patient.id);
      if (patientProcs.length > 0) {
        doc.setFontSize(14);
        doc.text('Procedures', 20, doc.lastAutoTable.finalY + 20);

        const procData = patientProcs.map(proc => [
          proc.name,
          proc.category,
          proc.outcome,
          format(new Date(proc.created_at), dateFormat)
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 25,
          head: [['Procedure', 'Category', 'Outcome', 'Date']],
          body: procData,
          theme: 'grid',
          headStyles: {
            fillColor: [44, 82, 130]
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });
      }
    }

    // Daily Notes
    if (patient.daily_notes && patient.daily_notes.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Progress Notes', 20, 20);

      patient.daily_notes.forEach((note, index) => {
        const noteData = [
          ['Date', format(new Date(note.note_date), dateFormat)],
          ['Subjective', note.subjective],
          ['Objective', note.objective],
          ['Assessment', note.assessment],
          ['Plan', note.plan],
          ['Created By', note.created_by],
          ['Created At', format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')]
        ];

        autoTable(doc, {
          startY: index === 0 ? 30 : doc.lastAutoTable.finalY + 15,
          body: noteData,
          theme: 'grid',
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });
      });
    }
  });

  // Add page numbers and footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    
    // Add page number
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 30,
      doc.internal.pageSize.height - 10
    );
    
    // Add confidentiality notice
    doc.text(
      'CONFIDENTIAL - For authorized medical personnel only',
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Save the PDF
  doc.save(`ICU-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}