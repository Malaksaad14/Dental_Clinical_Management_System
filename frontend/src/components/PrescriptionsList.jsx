import React, { useState } from 'react';
import { Pill, Plus, Calendar, Clock, UserCheck, Trash2, Edit2, X } from 'lucide-react';

const COMMON_DRUGS = [
  { name: 'Amoxicillin 500mg', dosage: '1 capsule', freq: 'Every 8 hours', dur: '5-7 days' },
  { name: 'Augmentin 1g', dosage: '1 tablet', freq: 'Every 12 hours', dur: '7 days' },
  { name: 'Ibuprofen 400mg', dosage: '1 tablet', freq: 'Every 8 hours as needed for pain', dur: '3 days' },
  { name: 'Cataflam 50mg', dosage: '1 tablet', freq: 'After meals when needed', dur: '3 days' },
  { name: 'Chlorhexidine 0.12% Mouthwash', dosage: '15 ml', freq: 'Twice daily after brushing', dur: '10 days' },
  { name: 'Flagyl 500mg (Metronidazole)', dosage: '1 tablet', freq: 'Every 8 hours with meals', dur: '5 days' }
];

export default function PrescriptionsList({ prescriptions = [], onCreatePrescription, onDeletePrescription, onUpdatePrescription, readOnly = false }) {
  const [showModal, setShowModal] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [meds, setMeds] = useState([
    { drug_name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Every 8 hours', duration: '5 days' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddMed = () => {
    setMeds([...meds, { drug_name: '', dosage: '1 tablet', frequency: 'Every 8 hours', duration: '5 days' }]);
  };

  const handleRemoveMed = (idx) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx, field, val) => {
    const updated = [...meds];
    updated[idx][field] = val;
    setMeds(updated);
  };

  const handleQuickAdd = (drug) => {
    setMeds([...meds, { drug_name: drug.name, dosage: drug.dosage, frequency: drug.freq, duration: drug.dur }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreatePrescription({
        notes: notes || undefined,
        items: meds
      });
      setShowModal(false);
      setNotes('');
      setMeds([{ drug_name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Every 8 hours', duration: '5 days' }]);
    } catch (err) {
      alert('Error creating prescription: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (rx) => {
    setEditingRx(rx);
    setEditNotes(rx.notes || '');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (onUpdatePrescription) {
        await onUpdatePrescription(editingRx.id, { notes: editNotes });
      }
      setEditingRx(null);
    } catch (err) {
      alert('Error updating prescription: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-5 h-5 text-sky-600" />
            <span>Prescriptions & Medications</span>
          </h2>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
          >
            <Plus className="w-4 h-4" />
            Write Prescription
          </button>
        )}
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No prescriptions on record</p>
          <p className="text-xs text-slate-400 mt-1">Click "Write Prescription" to issue dental medications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="border border-slate-200 rounded-2xl p-5 hover:border-sky-200 bg-slate-50/40 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">Prescription #{rx.id}</span>
                  <span className="text-[10px] bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
                    Dental Prescription
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(rx.issued_at).toLocaleDateString()}
                  </span>
                  {!readOnly && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rx)}
                        title="Edit prescription notes"
                        className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePrescription && onDeletePrescription(rx.id)}
                        title="Delete prescription"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {rx.notes && (
                <p className="text-xs text-slate-600 my-2.5 italic">"{rx.notes}"</p>
              )}

              {/* Drug items */}
              <div className="mt-3 space-y-2">
                {rx.items?.map((item) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.drug_name}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.dosage} • {item.frequency}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {item.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Issue Electronic Prescription</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Quick Drug Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Common Dental Drugs:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DRUGS.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handleQuickAdd(d)}
                      className="text-[10px] bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 font-medium"
                    >
                      + {d.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meds List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {meds.map((m, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Drug Name (e.g. Amoxicillin 500mg)"
                        value={m.drug_name}
                        onChange={(e) => handleMedChange(idx, 'drug_name', e.target.value)}
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        disabled={meds.length === 1}
                        className="text-rose-500 hover:text-rose-700 p-1 text-xs disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Dosage (1 cap)"
                        value={m.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Freq (Every 8h)"
                        value={m.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        value={m.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddMed}
                className="text-xs text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Medication
              </button>

              {/* Instructions / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with plenty of water after meals"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Prescription Modal */}
      {editingRx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Edit Prescription #{editingRx.id} Notes</h3>
              <button
                type="button"
                onClick={() => setEditingRx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Doctor Instructions & Notes</label>
                <textarea
                  rows="3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRx(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
