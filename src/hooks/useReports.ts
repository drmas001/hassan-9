import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { ReportData } from '../types/reports';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function useReports(dateRange: DateRange) {
  const [reportData, setReportData] = useState<ReportData>({
    metrics: {
      totalPatients: 0,
      criticalCases: 0,
      medicationsGiven: 0,
      labTests: 0,
      averageStayDuration: 0,
      bedOccupancyRate: 0,
      readmissionRate: 0,
      mortalityRate: 0
    },
    patients: [],
    activities: {
      patientStatusDistribution: [],
      dailyActivities: [],
      topProcedures: [],
      commonDiagnoses: []
    },
    dateRange
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all required data in parallel
        const [
          patientsResponse,
          medicationsResponse,
          labResultsResponse,
          proceduresResponse,
          vitalsResponse,
          dischargesResponse
        ] = await Promise.all([
          // Patients data
          supabase
            .from('patients')
            .select('*')
            .gte('admission_date', dateRange.startDate.toISOString())
            .lte('admission_date', dateRange.endDate.toISOString()),

          // Medications data
          supabase
            .from('medications')
            .select('*')
            .gte('created_at', dateRange.startDate.toISOString())
            .lte('created_at', dateRange.endDate.toISOString()),

          // Lab results data
          supabase
            .from('lab_results')
            .select('*')
            .gte('created_at', dateRange.startDate.toISOString())
            .lte('created_at', dateRange.endDate.toISOString()),

          // Procedures data
          supabase
            .from('procedures')
            .select('*')
            .gte('created_at', dateRange.startDate.toISOString())
            .lte('created_at', dateRange.endDate.toISOString()),

          // Vitals data
          supabase
            .from('vitals')
            .select('*')
            .gte('created_at', dateRange.startDate.toISOString())
            .lte('created_at', dateRange.endDate.toISOString()),

          // Discharges data
          supabase
            .from('discharges')
            .select('*')
            .gte('discharge_date', dateRange.startDate.toISOString())
            .lte('discharge_date', dateRange.endDate.toISOString())
        ]);

        if (patientsResponse.error) throw patientsResponse.error;
        if (medicationsResponse.error) throw medicationsResponse.error;
        if (labResultsResponse.error) throw labResultsResponse.error;
        if (proceduresResponse.error) throw proceduresResponse.error;
        if (vitalsResponse.error) throw vitalsResponse.error;
        if (dischargesResponse.error) throw dischargesResponse.error;

        const patients = patientsResponse.data || [];
        const medications = medicationsResponse.data || [];
        const labResults = labResultsResponse.data || [];
        const procedures = proceduresResponse.data || [];
        const vitals = vitalsResponse.data || [];
        const discharges = dischargesResponse.data || [];

        // Calculate metrics
        const totalPatients = patients.length;
        const criticalCases = patients.filter(p => p.status === 'Critical').length;
        const medicationsGiven = medications.length;
        const labTests = labResults.length;

        // Calculate bed occupancy rate
        const totalBeds = 50; // Assuming 50 beds in the ICU
        const occupiedBeds = patients.filter(p => p.status !== 'Discharged').length;
        const bedOccupancyRate = occupiedBeds / totalBeds;

        // Calculate mortality rate
        const totalDischarges = discharges.length;
        const mortalityRate = totalDischarges > 0 
          ? discharges.filter(d => d.discharge_condition === 'Died').length / totalDischarges 
          : 0;

        // Calculate readmission rate (30-day readmissions)
        const readmissions = patients.filter(p => {
          const previousDischarge = discharges.find(d => 
            d.patient_id === p.id && 
            new Date(p.admission_date).getTime() - new Date(d.discharge_date).getTime() <= 30 * 24 * 60 * 60 * 1000
          );
          return previousDischarge !== undefined;
        });
        const readmissionRate = totalPatients > 0 ? readmissions.length / totalPatients : 0;

        // Calculate average stay duration
        const stayDurations = discharges.map(d => {
          const patient = patients.find(p => p.id === d.patient_id);
          if (!patient) return 0;
          return (new Date(d.discharge_date).getTime() - new Date(patient.admission_date).getTime()) / (1000 * 60 * 60 * 24);
        });
        const averageStayDuration = stayDurations.length > 0
          ? stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length
          : 0;

        setReportData({
          metrics: {
            totalPatients,
            criticalCases,
            medicationsGiven,
            labTests,
            averageStayDuration,
            bedOccupancyRate,
            readmissionRate,
            mortalityRate
          },
          patients,
          labResults,
          medications,
          procedures,
          activities: {
            patientStatusDistribution: Object.entries(
              patients.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([name, value]) => ({ name, value })),
            dailyActivities: [
              {
                name: 'Admissions',
                value: patients.filter(p => 
                  new Date(p.admission_date).toDateString() === new Date().toDateString()
                ).length
              },
              {
                name: 'Lab Tests',
                value: labResults.filter(l =>
                  new Date(l.created_at).toDateString() === new Date().toDateString()
                ).length
              },
              {
                name: 'Medications',
                value: medications.filter(m =>
                  new Date(m.created_at).toDateString() === new Date().toDateString()
                ).length
              },
              {
                name: 'Procedures',
                value: procedures.filter(p =>
                  new Date(p.created_at).toDateString() === new Date().toDateString()
                ).length
              }
            ],
            topProcedures: procedures
              .reduce((acc, curr) => {
                const existing = acc.find(p => p.name === curr.name);
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ name: curr.name, count: 1 });
                }
                return acc;
              }, [] as Array<{ name: string; count: number }>)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5),
            commonDiagnoses: Object.entries(
              patients.reduce((acc, curr) => {
                acc[curr.diagnosis] = (acc[curr.diagnosis] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          },
          dateRange
        });
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch report data'));
        toast.error('Failed to generate report');
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [dateRange]);

  return { reportData, loading, error };
}