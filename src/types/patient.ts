export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  bed_number: string;
  status: string;
  admission_date: string;
  attending_physician_id: string;
  history: string;
  examination: string;
  notes: string;
  daily_notes?: DailyNote[];
  updated_at: string;
}

export interface DailyNote {
  id: string;
  patient_id: string;
  note_date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Statistics {
  totalPatients: number;
  criticalPatients: number;
  stablePatients: number;
  newAdmissions: number;
}

export interface Notification {
  id: string;
  type: 'status' | 'lab' | 'medication';
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
}