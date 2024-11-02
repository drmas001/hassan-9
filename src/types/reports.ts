export interface ReportData {
  metrics: {
    totalPatients: number;
    criticalCases: number;
    medicationsGiven: number;
    labTests: number;
    averageStayDuration: number;
    bedOccupancyRate: number;
    readmissionRate: number;
    mortalityRate: number;
  };
  patients: Array<{
    id: string;
    mrn: string;
    name: string;
    age: number;
    gender: string;
    diagnosis: string;
    admission_date: string;
    status: string;
    bed_number: string;
  }>;
  labResults?: Array<{
    test_name: string;
    result: string;
    unit?: string;
    status: string;
    resulted_at: string;
    category: string;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    route: string;
    frequency: string;
    status: string;
    start_date: string;
  }>;
  procedures?: Array<{
    name: string;
    category: string;
    outcome: string;
    created_at: string;
  }>;
  activities: {
    patientStatusDistribution: Array<{ name: string; value: number }>;
    dailyActivities: Array<{ name: string; value: number }>;
    topProcedures: Array<{ name: string; count: number }>;
    commonDiagnoses: Array<{ name: string; count: number }>;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}