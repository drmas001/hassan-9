export interface AdmissionEpisode {
  id: string;
  patient_id: string;
  admission_date: string;
  discharge_date?: string;
  primary_diagnosis: string;
  attending_physician_id: string;
  bed_number: string;
  status: 'Active' | 'Discharged';
  readmission_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdmissionStats {
  totalAdmissions: number;
  activeAdmissions: number;
  readmissionRate: number;
  averageLengthOfStay: number;
}