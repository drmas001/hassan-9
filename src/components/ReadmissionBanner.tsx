import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface AdmissionEpisode {
  id: string;
  admission_date: string;
  discharge_date: string | null;
  status: 'Active' | 'Discharged';
}

interface ReadmissionBannerProps {
  currentEpisode: AdmissionEpisode;
  previousEpisode: AdmissionEpisode;
}

export function ReadmissionBanner({ currentEpisode, previousEpisode }: ReadmissionBannerProps) {
  if (!previousEpisode.discharge_date) return null;

  const daysSinceDischarge = differenceInDays(
    new Date(currentEpisode.admission_date),
    new Date(previousEpisode.discharge_date)
  );

  const isRecentReadmission = daysSinceDischarge <= 30;

  return (
    <div className={`mb-6 p-4 rounded-lg ${
      isRecentReadmission ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start">
        <AlertCircle className={`h-5 w-5 ${
          isRecentReadmission ? 'text-red-400' : 'text-yellow-400'
        } mt-0.5`} />
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${
            isRecentReadmission ? 'text-red-800' : 'text-yellow-800'
          }`}>
            Patient Readmission
          </h3>
          <div className="mt-2 text-sm">
            <p className={isRecentReadmission ? 'text-red-700' : 'text-yellow-700'}>
              Previously discharged {format(new Date(previousEpisode.discharge_date), 'PPP')}
              {' '}({daysSinceDischarge} days ago)
            </p>
            <div className="mt-1 flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Current admission: {format(new Date(currentEpisode.admission_date), 'PPP')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}