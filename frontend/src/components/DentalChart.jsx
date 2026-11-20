import React, { useState } from 'react';
import { Plus, Check, Trash2, X, AlertTriangle, Layers, Info } from 'lucide-react';

// Standard 32 adult teeth with descriptions
const UPPER_TEETH = [
  { num: 1, name: '3rd Molar (Wisdom)' },
  { num: 2, name: '2nd Molar' },
  { num: 3, name: '1st Molar' },
  { num: 4, name: '2nd Premolar' },
  { num: 5, name: '1st Premolar' },
  { num: 6, name: 'Canine' },
  { num: 7, name: 'Lateral Incisor' },
  { num: 8, name: 'Central Incisor' },
  { num: 9, name: 'Central Incisor' },
  { num: 10, name: 'Lateral Incisor' },
  { num: 11, name: 'Canine' },
  { num: 12, name: '1st Premolar' },
  { num: 13, name: '2nd Premolar' },
  { num: 14, name: '1st Molar' },
  { num: 15, name: '2nd Molar' },
  { num: 16, name: '3rd Molar (Wisdom)' },
];

const LOWER_TEETH = [
  { num: 32, name: '3rd Molar (Wisdom)' },
  { num: 31, name: '2nd Molar' },
  { num: 30, name: '1st Molar' },
  { num: 29, name: '2nd Premolar' },
  { num: 28, name: '1st Premolar' },
  { num: 27, name: 'Canine' },
  { num: 26, name: 'Lateral Incisor' },
  { num: 25, name: 'Central Incisor' },
  { num: 24, name: 'Central Incisor' },
  { num: 23, name: 'Lateral Incisor' },
  { num: 22, name: 'Canine' },
  { num: 21, name: '1st Premolar' },
  { num: 20, name: '2nd Premolar' },
  { num: 19, name: '1st Molar' },
  { num: 18, name: '2nd Molar' },
  { num: 17, name: '3rd Molar (Wisdom)' },
];

const CONDITIONS = [
  { id: 'healthy', label: 'Healthy', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'caries', label: 'Caries / Decay', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  { id: 'filled', label: 'Restored / Filled', color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  { id: 'crown', label: 'Crown / Cap', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { id: 'root_canal', label: 'Root Canal (Endo)', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { id: 'missing', label: 'Missing / Extracted', color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100 border-slate-300' },
  { id: 'implant', label: 'Dental Implant', color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
];

const SURFACES = ['Occlusal', 'Mesial', 'Distal', 'Buccal', 'Lingual', 'Whole Tooth'];

export default function DentalChart({ teethData = {}, onSaveRecord, onDeleteRecord, onAddToPlan }) {
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [condition, setCondition] = useState('caries');
  const [surface, setSurface] = useState('Occlusal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectTooth = (tooth) => {
    setSelectedTooth(tooth);
    const existing = teethData[tooth.num];
    if (existing && existing.length > 0) {
      const latest = existing[0];
      setCondition(latest.condition || 'caries');
      setSurface(latest.surface || 'Occlusal');
      setNotes(latest.notes || '');
    } else {
      setCondition('caries');
      setSurface('Occlusal');
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

  const getToothStatus = (toothNum) => {
    const list = teethData[toothNum];
    if (!list || list.length === 0) return null;
    return list[0]; // latest condition
  };

  const renderToothBox = (tooth) => {
    const status = getToothStatus(tooth.num);
    const condConfig = status ? CONDITIONS.find(c => c.id === status.condition) : null;
    const isSelected = selectedTooth?.num === tooth.num;

    return (
      <button
        key={tooth.num}
        type="button"
        onClick={() => handleSelectTooth(tooth)}
        className={`group relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 border text-center ${
          isSelected
            ? 'ring-2 ring-sky-500 ring-offset-2 border-sky-400 bg-sky-50/50 shadow-md scale-105 z-10'
            : status
            ? `${condConfig?.bg || 'bg-slate-50 border-slate-200'} hover:shadow-md hover:scale-102`
            : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50 hover:shadow'
        }`}
      >
        {/* Tooth Number */}
        <span className="text-xs font-bold font-mono text-slate-700 group-hover:text-sky-600">
          #{tooth.num}
        </span>

        {/* Anatomical Visual Icon */}
        <div className="my-1.5 relative w-8 h-10 flex items-center justify-center">
          {status?.condition === 'missing' ? (
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </div>
          ) : (
            <div className={`w-8 h-10 rounded-t-lg rounded-b-md border-2 flex flex-col items-center justify-between p-1 transition-colors ${
              status
                ? `${condConfig?.color.replace('bg-', 'border-')} ${condConfig?.color.replace('bg-', 'bg-').replace('500', '100')}`
                : 'border-slate-300 bg-slate-100 group-hover:border-sky-400'
            }`}>
              <div className="w-full flex justify-between">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
              </div>
              {status && (
                <span className={`text-[9px] font-bold uppercase tracking-wider ${condConfig?.text}`}>
                  {status.surface ? status.surface[0] : '•'}
                </span>
              )}
              <div className="w-3 h-1 rounded-full bg-slate-400/40" />
            </div>
          )}
        </div>

        {/* Status text badge */}
        <span className={`text-[10px] font-medium truncate max-w-[65px] ${condConfig ? condConfig.text : 'text-slate-400'}`}>
          {condConfig ? condConfig.label.split(' ')[0] : 'Healthy'}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🦷 Interactive Dental Chart (Universal 1–32)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on any tooth to record caries, restorations, or create immediate treatment plan items.
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {CONDITIONS.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
              <span className="text-slate-600 font-medium">{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Mouth Diagram Layout */}
      <div className="py-8 space-y-8">
        {/* Upper Arch (Maxilla) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Upper Right (UR)
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
              Maxillary Arch (Upper Teeth 1 - 16)
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Upper Left (UL)
            </span>
          </div>

          <div className="grid grid-cols-8 md:grid-cols-16 gap-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {UPPER_TEETH.map(renderToothBox)}
          </div>
        </div>

        {/* Arch Divider Line */}
        <div className="relative flex items-center justify-center">
          <div className="border-t-2 border-dashed border-slate-200 w-full" />
          <span className="absolute bg-white px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Occlusal Plane
          </span>
        </div>

        {/* Lower Arch (Mandible) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Lower Right (LR)
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
              Mandibular Arch (Lower Teeth 32 - 17)
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              Lower Left (LL)
            </span>
          </div>

          <div className="grid grid-cols-8 md:grid-cols-16 gap-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {LOWER_TEETH.map(renderToothBox)}
          </div>
        </div>
      </div>

      {/* Tooth Action Drawer / Modal */}
      {selectedTooth && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Tooth #{selectedTooth.num} — {selectedTooth.name}
                </h3>
                <p className="text-xs text-slate-500">Record diagnosis or add directly to treatment plan</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTooth(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {/* Condition Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Clinical Condition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCondition(c.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        condition === c.id
                          ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-400/30 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.color} shrink-0`} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Affected Surface
                </label>
                <div className="flex flex-wrap gap-2">
                  {SURFACES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSurface(s)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        surface === s
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Notes / Findings
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deep caries, sensitivity to percussion, needs composite restoration..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Existing History if any */}
              {teethData[selectedTooth.num] && teethData[selectedTooth.num].length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700 block mb-1.5">History on Tooth #{selectedTooth.num}:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {teethData[selectedTooth.num].map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between text-slate-600 bg-white px-2.5 py-1.5 rounded border border-slate-100">
                        <span>
                          <strong>{rec.condition}</strong> ({rec.surface || 'Whole'}) - {rec.notes || 'No notes'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(rec.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onAddToPlan({
                      tooth_number: selectedTooth.num,
                      condition,
                      notes
                    });
                    setSelectedTooth(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add to Treatment Plan
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTooth(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
                  >
                    <Check className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Save Condition'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
