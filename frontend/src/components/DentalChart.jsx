import React, { useState } from 'react';
import { Plus, Check, Trash2, X } from 'lucide-react';
import DrawnDentalChart from './DrawnDentalChart';

const TOOTH_NAMES = {
  1: 'Upper Right 3rd Molar (Wisdom)',
  2: 'Upper Right 2nd Molar',
  3: 'Upper Right 1st Molar',
  4: 'Upper Right 2nd Premolar',
  5: 'Upper Right 1st Premolar',
  6: 'Upper Right Canine (Cuspid)',
  7: 'Upper Right Lateral Incisor',
  8: 'Upper Right Central Incisor',
  9: 'Upper Left Central Incisor',
  10: 'Upper Left Lateral Incisor',
  11: 'Upper Left Canine (Cuspid)',
  12: 'Upper Left 1st Premolar',
  13: 'Upper Left 2nd Premolar',
  14: 'Upper Left 1st Molar',
  15: 'Upper Left 2nd Molar',
  16: 'Upper Left 3rd Molar (Wisdom)',

  32: 'Lower Right 3rd Molar (Wisdom)',
  31: 'Lower Right 2nd Molar',
  30: 'Lower Right 1st Molar',
  29: 'Lower Right 2nd Premolar',
  28: 'Lower Right 1st Premolar',
  27: 'Lower Right Canine (Cuspid)',
  26: 'Lower Right Lateral Incisor',
  25: 'Lower Right Central Incisor',
  24: 'Lower Left Central Incisor',
  23: 'Lower Left Lateral Incisor',
  22: 'Lower Left Canine (Cuspid)',
  21: 'Lower Left 1st Premolar',
  20: 'Lower Left 2nd Premolar',
  19: 'Lower Left 1st Molar',
  18: 'Lower Left 2nd Molar',
  17: 'Lower Left 3rd Molar (Wisdom)',
};

const CONDITIONS = [
  { id: 'healthy', label: 'Healthy', color: '#10b981' },
  { id: 'caries', label: 'Caries / Decay', color: '#ef4444' },
  { id: 'filled', label: 'Restored / Filled', color: '#0284c7' },
  { id: 'crown', label: 'Crown / Cap', color: '#d97706' },
  { id: 'root_canal', label: 'Root Canal (Endo)', color: '#9333ea' },
  { id: 'missing', label: 'Missing / Extracted', color: '#475569' },
  { id: 'implant', label: 'Dental Implant', color: '#0d9488' },
];

const SURFACES = [
  { id: 'Whole Tooth', label: 'Whole Tooth / Crown', code: 'ALL' },
  { id: 'Occlusal', label: 'Occlusal / Chewing Surface', code: 'O' },
  { id: 'Mesial', label: 'Mesial (Front side)', code: 'M' },
  { id: 'Distal', label: 'Distal (Back side)', code: 'D' },
  { id: 'Buccal', label: 'Buccal / Facial (Cheek side)', code: 'B' },
  { id: 'Lingual', label: 'Lingual / Palatal (Tongue side)', code: 'L' },
];

export default function DentalChart({ teethData = {}, onSaveRecord, onDeleteRecord, onAddToPlan, readOnly = false }) {
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [condition, setCondition] = useState('caries');
  const [surface, setSurface] = useState('Whole Tooth');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectTooth = (tooth) => {
    setSelectedTooth(tooth);
    const existing = teethData[tooth.num];
    if (existing && existing.length > 0) {
      const latest = existing[0];
      setCondition(latest.condition || 'caries');
      setSurface(latest.surface || 'Whole Tooth');
      setNotes(latest.notes || '');
    } else {
      setCondition('caries');
      setSurface('Whole Tooth');
      setNotes('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTooth) return;
    setSubmitting(true);
    try {
      await onSaveRecord({
        tooth_number: selectedTooth.num,
        condition,
        surface,
        notes: notes || undefined
      });
      setSelectedTooth(null);
    } catch (err) {
      alert('Error saving record: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-800">
              🦷 Dental Anatomy Chart (Universal 1–32)
            </h2>
          </div>
        </div>

        {/* Condition Legend */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CONDITIONS.map(c => (
            <span key={c.id} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span>{c.label.split(' ')[0]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Drawn SVG Chart */}
      <DrawnDentalChart
        teethData={teethData}
        onSelectTooth={handleSelectTooth}
      />

      {/* Diagnosis Modal */}
      {selectedTooth && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Tooth #{selectedTooth.num} — {selectedTooth.name || TOOTH_NAMES[selectedTooth.num]}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record clinical findings or add to treatment plan
                </p>
              </div>
              <button type="button" onClick={() => setSelectedTooth(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {readOnly ? (
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-2">Existing Records on #{selectedTooth.num}:</span>
                  {teethData[selectedTooth.num] && teethData[selectedTooth.num].length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {teethData[selectedTooth.num].map((rec) => (
                        <div key={rec.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-800 capitalize font-bold">{rec.condition}</strong>
                            <span className="text-[11px] text-slate-400">{rec.recorded_at ? new Date(rec.recorded_at).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-slate-500 mt-1">Surface: {rec.surface || 'Whole Tooth'}</p>
                          {rec.notes && <p className="text-slate-600 mt-1 italic font-mono">Note: {rec.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Healthy — No conditions or findings recorded for this tooth.</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setSelectedTooth(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900">
                    Close
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Clinical Diagnosis</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button type="button" key={c.id} onClick={() => setCondition(c.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        condition === c.id
                          ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-400/30 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Affected Surface</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SURFACES.map((s) => (
                    <button type="button" key={s.id} onClick={() => setSurface(s.id)}
                      className={`p-2 rounded-xl border text-xs font-medium transition-all text-left ${
                        surface === s.id
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}>
                      <span className="font-mono font-bold text-sky-400 mr-1.5">[{s.code}]</span>
                      {s.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Clinical Notes</label>
                <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deep cavity on occlusal surface, cold sensitivity..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
              </div>

              {/* Existing History */}
              {teethData[selectedTooth.num] && teethData[selectedTooth.num].length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1.5">Existing Records on #{selectedTooth.num}:</span>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {teethData[selectedTooth.num].map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-slate-600">
                          <strong className="text-slate-800 capitalize">{rec.condition}</strong> ({rec.surface || 'Whole'})
                          {rec.notes && <span className="text-slate-400 ml-1.5">— {rec.notes}</span>}
                        </span>
                        <button type="button" onClick={() => onDeleteRecord(rec.id)}
                          className="text-rose-500 hover:text-rose-700 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                {onAddToPlan && (
                  <button type="button"
                    onClick={() => { onAddToPlan({ tooth_number: selectedTooth.num, condition, notes }); setSelectedTooth(null); }}
                    className="px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add to Treatment Plan
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" onClick={() => setSelectedTooth(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/30">
                    <Check className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save Condition'}
                  </button>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
