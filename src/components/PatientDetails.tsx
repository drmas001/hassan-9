import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  Heart,
  Wind,
  Thermometer,
  Clock,
  User,
  FileText,
  Pill,
  TestTube,
  Hash,
  Bed,
  Stethoscope,
  ClipboardList,
  Plus,
  LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PatientStatusBadge } from './PatientStatusBadge';
import { LoadingSpinner } from './LoadingSpinner';
import { VitalsChart } from './VitalsChart';
import { MedicationList } from './MedicationList';
import { LabResults } from './LabResults';
import { ProcedureList } from './ProcedureList';
import { DischargeForm } from './DischargeForm';
import { AddVitalsForm } from './AddVitalsForm';
import { AddMedicationForm } from './AddMedicationForm';
import { AddLabResultForm } from './AddLabResultForm';
import { AddProcedureForm } from './AddProcedureForm';
import { DailyNotes } from './DailyNotes';
import { AddDailyNoteForm } from './AddDailyNoteForm';
import { ReadmissionBanner } from './ReadmissionBanner';
import { useVitals } from '../hooks/useVitals';
import { useMedications } from '../hooks/useMedications';
import { useLabResults } from '../hooks/useLabResults';
import { useProcedures } from '../hooks/useProcedures';
import { useDailyNotes } from '../hooks/useDailyNotes';
import { useAdmissionEpisode } from '../hooks/useAdmissionEpisode';
import type { Database } from '../types/supabase';
import type { Patient } from '../types/patient';
import toast from 'react-hot-toast';

export function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'medications' | 'labs' | 'procedures' | 'notes' | 'discharge'>('overview');
  const [showDischargeForm, setShowDischargeForm] = useState(false);
  const [showAddVitalsForm, setShowAddVitalsForm] = useState(false);
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);
  const [showAddLabResultForm, setShowAddLabResultForm] = useState(false);
  const [showAddProcedureForm, setShowAddProcedureForm] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);

  const { vitals, loading: vitalsLoading } = useVitals(id || '');
  const { medications, loading: medsLoading, updateMedicationStatus } = useMedications(id || '');
  const { results: labResults, loading: labsLoading } = useLabResults(id || '');
  const { procedures, loading: proceduresLoading } = useProcedures(id || '');
  const { notes, loading: notesLoading, refreshNotes } = useDailyNotes(id || '');
  const { episode, previousEpisode, loading: episodeLoading } = useAdmissionEpisode(id || '');

  useEffect(() => {
    async function fetchPatient() {
      try {
        if (!id) {
          toast.error('No patient ID provided');
          navigate('/dashboard');
          return;
        }

        const { data, error } = await supabase
          .from('patients')
          .select(`
            *,
            attending_physician:users!patients_attending_physician_id_fkey (
              name,
              employee_code
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error('Patient not found');
          navigate('/dashboard');
          return;
        }

        setPatient(data);
      } catch (error) {
        console.error('Error fetching patient:', error);
        toast.error('Failed to load patient data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchPatient();
  }, [id, navigate]);

  const handleDischargeComplete = () => {
    setShowDischargeForm(false);
    setActiveTab('overview');
    navigate('/dashboard');
  };

  const renderActionButton = (
    onClick: () => void,
    icon: React.ReactNode,
    text: string
  ) => (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {icon}
      <span className="ml-2">{text}</span>
    </button>
  );

  if (loading || episodeLoading) {
    return <LoadingSpinner />;
  }

  if (!patient || !episode) {
    return null;
  }

  const isActiveAdmission = episode.status === 'Active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Patient Header */}
      <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <User className="h-8 sm:h-12 w-8 sm:w-12 text-blue-500" />
            <div className="ml-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{patient.name}</h2>
                <span className="text-sm text-gray-500">
                  <Hash className="h-4 w-4 inline" /> {patient.mrn}
                </span>
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500">
                <span>{patient.age} years</span>
                <span className="hidden sm:inline">•</span>
                <span>{patient.gender}</span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <Bed className="h-4 w-4 inline mr-1" />
                  Bed {patient.bed_number}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <PatientStatusBadge 
              status={patient.status} 
              showDropdown={false}
            />
            {isActiveAdmission && (
              <button
                onClick={() => {
                  setShowDischargeForm(true);
                  setActiveTab('discharge');
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Discharge Patient
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Readmission Banner */}
      {previousEpisode && (
        <ReadmissionBanner
          currentEpisode={episode}
          previousEpisode={previousEpisode}
        />
      )}

      {/* Action Buttons */}
      {isActiveAdmission && (
        <div className="mb-6 flex flex-wrap gap-4">
          {renderActionButton(
            () => setShowAddVitalsForm(true),
            <Activity className="h-4 w-4" />,
            "Record Vitals"
          )}
          {renderActionButton(
            () => setShowAddMedicationForm(true),
            <Pill className="h-4 w-4" />,
            "Add Medication"
          )}
          {renderActionButton(
            () => setShowAddLabResultForm(true),
            <TestTube className="h-4 w-4" />,
            "Add Lab Result"
          )}
          {renderActionButton(
            () => setShowAddProcedureForm(true),
            <Stethoscope className="h-4 w-4" />,
            "Record Procedure"
          )}
          {renderActionButton(
            () => setShowAddNoteForm(true),
            <ClipboardList className="h-4 w-4" />,
            "Add Progress Note"
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FileText className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`${
              activeTab === 'vitals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Activity className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Vitals
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`${
              activeTab === 'medications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Pill className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Medications
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`${
              activeTab === 'labs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <TestTube className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Lab Results
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`${
              activeTab === 'procedures'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Stethoscope className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Procedures
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ClipboardList className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Progress Notes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Diagnosis */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-3 sm:mb-4">
                <Stethoscope className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                <h3 className="ml-2 text-base sm:text-lg font-medium text-gray-900">Diagnosis</h3>
              </div>
              <p className="text-sm text-gray-600">{episode.primary_diagnosis}</p>
            </div>

            {/* History */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-3 sm:mb-4">
                <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                <h3 className="ml-2 text-base sm:text-lg font-medium text-gray-900">History</h3>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{episode.history}</p>
            </div>

            {/* Examination */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-3 sm:mb-4">
                <ClipboardList className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                <h3 className="ml-2 text-base sm:text-lg font-medium text-gray-900">Physical Examination</h3>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{episode.examination}</p>
            </div>

            {/* Notes */}
            {episode.notes && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center mb-3 sm:mb-4">
                  <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <h3 className="ml-2 text-base sm:text-lg font-medium text-gray-900">Additional Notes</h3>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{episode.notes}</p>
              </div>
            )}

            {/* Admission Details */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-3 sm:mb-4">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                <h3 className="ml-2 text-base sm:text-lg font-medium text-gray-900">Admission Details</h3>
              </div>
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Admitted:</span>{' '}
                  {new Date(episode.admission_date).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Attending Physician:</span>{' '}
                  {patient.attending_physician?.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Last Updated:</span>{' '}
                  {new Date(episode.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-4 sm:space-y-6">
            {vitalsLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Latest Vitals */}
                {vitals[0] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <Heart className="h-6 sm:h-8 w-6 sm:w-8 text-red-500" />
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Heart Rate</p>
                          <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                            {vitals[0].heart_rate} <span className="text-xs sm:text-sm text-gray-500">bpm</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <Wind className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500" />
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Oxygen Saturation</p>
                          <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                            {vitals[0].oxygen_saturation}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <Thermometer className="h-6 sm:h-8 w-6 sm:w-8 text-orange-500" />
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Temperature</p>
                          <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                            {vitals[0].temperature}°C
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <Activity className="h-6 sm:h-8 w-6 sm:w-8 text-purple-500" />
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Blood Pressure</p>
                          <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                            {vitals[0].blood_pressure}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vitals Charts */}
                {vitals.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Heart Rate History</h3>
                      <VitalsChart
                        data={vitals}
                        metric="heart_rate"
                        color="#ef4444"
                        label="Heart Rate"
                        unit="bpm"
                      />
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Oxygen Saturation History</h3>
                      <VitalsChart
                        data={vitals}
                        metric="oxygen_saturation"
                        color="#3b82f6"
                        label="SpO2"
                        unit="%"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-4 sm:space-y-6">
            {medsLoading ? (
              <LoadingSpinner />
            ) : (
              <MedicationList
                medications={medications}
                onUpdateStatus={updateMedicationStatus}
              />
            )}
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-4 sm:space-y-6">
            {labsLoading ? (
              <LoadingSpinner />
            ) : (
              <LabResults results={labResults} />
            )}
          </div>
        )}

        {activeTab === 'procedures' && (
          <div className="space-y-4 sm:space-y-6">
            {proceduresLoading ? (
              <LoadingSpinner />
            ) : (
              <ProcedureList procedures={procedures} />
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4 sm:space-y-6">
            {notesLoading ? (
              <LoadingSpinner />
            ) : (
              <DailyNotes
                patientId={patient.id}
                notes={notes}
                onNoteAdded={refreshNotes}
              />
            )}
          </div>
        )}

        {activeTab === 'discharge' && showDischargeForm && (
          <DischargeForm
            patient={patient}
            onDischarge={handleDischargeComplete}
          />
        )}
      </div>

      {/* Modal Forms */}
      {showAddVitalsForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <AddVitalsForm
              patientId={patient.id}
              onClose={() => setShowAddVitalsForm(false)}
            />
          </div>
        </div>
      )}

      {showAddMedicationForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <AddMedicationForm
              patientId={patient.id}
              onClose={() => setShowAddMedicationForm(false)}
            />
          </div>
        </div>
      )}

      {showAddLabResultForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <AddLabResultForm
              patientId={patient.id}
              onClose={() => setShowAddLabResultForm(false)}
            />
          </div>
        </div>
      )}

      {showAddProcedureForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <AddProcedureForm
              patientId={patient.id}
              onClose={() => setShowAddProcedureForm(false)}
            />
          </div>
        </div>
      )}

      {showAddNoteForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <AddDailyNoteForm
              patientId={patient.id}
              onClose={() => setShowAddNoteForm(false)}
              onSuccess={() => {
                setShowAddNoteForm(false);
                refreshNotes();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}