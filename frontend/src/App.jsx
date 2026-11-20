import React, { useState, useEffect } from 'react';
import PatientHeader from './components/PatientHeader';
import DentalChart from './components/DentalChart';
import TreatmentPlanList from './components/TreatmentPlanList';
import PrescriptionsList from './components/PrescriptionsList';
import { api } from './services/api';
import { Stethoscope, Activity, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chart');
  const [patient, setPatient] = useState({
    id: 1,
    first_name: 'Ahmed',
    last_name: 'Mohamed',
    gender: 'Male',
    phone: '01198765432',
    national_id: '29901011234567'
  });
  const [doctor] = useState({ name: 'Dr. Tarek Hassan', role: 'Dentist' });

  // Data states
  const [teethData, setTeethData] = useState({});
  const [plans, setPlans] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial data from FastAPI backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [chartRes, plansRes, rxRes] = await Promise.all([
        api.getPatientChart(1).catch(() => null),
        api.getTreatmentPlans(1).catch(() => null),
        api.getPrescriptions(1).catch(() => null),
      ]);

      if (chartRes || plansRes || rxRes) {
        setBackendConnected(true);
        if (chartRes?.teeth) setTeethData(chartRes.teeth);
        if (plansRes) setPlans(plansRes);
        if (rxRes) setPrescriptions(rxRes);
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleSaveToothRecord = async (record) => {
    // Optimistic immediate update to local state
    const optimisticEntry = {
      id: Date.now(),
      tooth_number: record.tooth_number,
      condition: record.condition,
      surface: record.surface,
      notes: record.notes,
      recorded_at: new Date().toISOString()
    };

    setTeethData(prev => {
      const copy = { ...prev };
      const list = copy[record.tooth_number] || [];
      copy[record.tooth_number] = [optimisticEntry, ...list];
      return copy;
    });

    try {
      if (backendConnected) {
        await api.addToothRecord({
          patient_id: 1,
          recorded_by: 1,
          ...record
        });
      }
      showToast(`Tooth #${record.tooth_number} saved (${record.condition})!`);
    } catch (err) {
      showToast('Saved locally. Backend note: ' + err.message);
    }
  };

  const handleDeleteToothRecord = async (recordId) => {
    // Local-only records have a timestamp-based ID (> 9999999999),
    // so skip the backend call and just remove from local state.
    const isLocalOnly = recordId > 9_999_999_999;

    if (!isLocalOnly && backendConnected) {
      try {
        await api.deleteToothRecord(recordId);
      } catch (err) {
        showToast('Error deleting from server: ' + err.message);
        return;
      }
    }

    // Remove from local state immediately
    setTeethData(prev => {
      const updated = {};
      for (const [toothNum, records] of Object.entries(prev)) {
        const filtered = records.filter(r => r.id !== recordId);
        if (filtered.length > 0) {
          updated[toothNum] = filtered;
        }
      }
      return updated;
    });

    showToast('Record deleted successfully.');
  };

  const handleCreatePlan = async (planData) => {
    try {
      if (backendConnected) {
        const newPlan = await api.createTreatmentPlan({
          patient_id: 1,
          dentist_id: 1,
          ...planData
        });
        setPlans([newPlan, ...plans]);
      } else {
        setPlans([{ id: Date.now(), ...planData, created_at: new Date().toISOString() }, ...plans]);
      }
      showToast('Treatment Plan created successfully!');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      if (backendConnected) {
        await api.updatePlanItem(itemId, { status: newStatus });
      }
      setPlans(prev => prev.map(p => ({
        ...p,
        items: p.items?.map(it => it.id === itemId ? { ...it, status: newStatus } : it)
      })));
      showToast(`Procedure marked as ${newStatus}!`);
    } catch (err) {
      showToast('Error updating item: ' + err.message);
    }
  };

  const handleCreatePrescription = async (rxData) => {
    try {
      if (backendConnected) {
        const newRx = await api.createPrescription({
          patient_id: 1,
          dentist_id: 1,
          ...rxData
        });
        setPrescriptions([newRx, ...prescriptions]);
      } else {
        setPrescriptions([{ id: Date.now(), issued_at: new Date().toISOString(), ...rxData }, ...prescriptions]);
      }
      showToast('Prescription issued successfully!');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow">
              🦷
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide block">Dental Clinical Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-slate-300 text-[11px]">
                {backendConnected ? 'FastAPI Connected' : 'Offline / Standalone Demo'}
              </span>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Patient Profile Header */}
      <PatientHeader patient={patient} doctor={doctor} />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'chart'
                ? 'text-sky-600 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🦷 Dental Chart & Findings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'plans'
                ? 'text-sky-600 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Treatment Plans ({plans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'prescriptions'
                ? 'text-sky-600 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💊 Prescriptions ({prescriptions.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'chart' && (
          <DentalChart
            teethData={teethData}
            onSaveRecord={handleSaveToothRecord}
            onDeleteRecord={handleDeleteToothRecord}
            onAddToPlan={(planItem) => {
              setActiveTab('plans');
              handleCreatePlan({
                title: `Treatment for Tooth #${planItem.tooth_number}`,
                notes: `Diagnosed condition: ${planItem.condition}`,
                items: [
                  {
                    service_id: planItem.condition === 'root_canal' ? 5 : 3,
                    tooth_number: planItem.tooth_number,
                    notes: planItem.notes || `Restoration for ${planItem.condition}`
                  }
                ]
              });
            }}
          />
        )}

        {activeTab === 'plans' && (
          <TreatmentPlanList
            plans={plans}
            onCreatePlan={handleCreatePlan}
            onUpdateItemStatus={handleUpdateItemStatus}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsList
            prescriptions={prescriptions}
            onCreatePrescription={handleCreatePrescription}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        Dental Clinical Management System • Electronic Medical Records & Dental Treatment Planning
      </footer>
    </div>
  );
}
