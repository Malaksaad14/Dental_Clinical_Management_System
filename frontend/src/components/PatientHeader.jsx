import React from 'react';
import { User, Phone, AlertCircle, Calendar, ShieldCheck, Stethoscope } from 'lucide-react';

export default function PatientHeader({ patient, doctor }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Patient Details */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xl shadow-inner">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">
                {patient.first_name} {patient.last_name}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full">
                Active Patient
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                ID #{patient.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Age: 28 ({patient.gender || 'Male'})
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {patient.phone || '01198765432'}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Nat ID: {patient.national_id || '29901011234567'}
              </span>
            </div>
          </div>
        </div>

        {/* Doctor and Medical Alerts */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Allergy: <strong>Penicillin</strong></span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Attending: <strong>{doctor?.name || 'Dr. Tarek Hassan'}</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
}
