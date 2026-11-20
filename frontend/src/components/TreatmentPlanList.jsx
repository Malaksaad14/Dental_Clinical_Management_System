import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, FileText, Check } from 'lucide-react';

const DENTAL_SERVICES = [
  { id: 1, code: 'D0120', name: 'Periodic Oral Evaluation', price: 150 },
  { id: 2, code: 'D1110', name: 'Dental Prophylaxis / Scaling', price: 300 },
  { id: 3, code: 'D2391', name: 'Composite Resin Filling (1 Surface)', price: 450 },
  { id: 4, code: 'D2392', name: 'Composite Resin Filling (2 Surfaces)', price: 600 },
  { id: 5, code: 'D3330', name: 'Root Canal Therapy (Molar)', price: 1800 },
  { id: 6, code: 'D2740', name: 'Porcelain / Ceramic Crown', price: 2500 },
  { id: 7, code: 'D7140', name: 'Simple Tooth Extraction', price: 400 },
];

export default function TreatmentPlanList({ plans = [], onCreatePlan, onUpdateItemStatus }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState([
    { service_id: 2, tooth_number: '', notes: 'Full mouth scaling' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddItemRow = () => {
    setSelectedItems([...selectedItems, { service_id: 3, tooth_number: '', notes: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter a plan title');
    setSubmitting(true);
    try {
      await onCreatePlan({
        title,
        notes,
        status: 'proposed',
        items: selectedItems.map(item => ({
          service_id: parseInt(item.service_id),
          tooth_number: item.tooth_number ? parseInt(item.tooth_number) : undefined,
          status: 'pending',
          notes: item.notes || undefined
        }))
      });
      setShowCreateModal(false);
      setTitle('');
      setNotes('');
      setSelectedItems([{ service_id: 2, tooth_number: '', notes: '' }]);
    } catch (err) {
      alert('Error creating plan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>;
      case 'in_progress':
        return <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      default:
        return <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">📋 Treatment Plans & Procedures</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize multi-visit dental procedures, estimate costs, and track completion progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-sky-600/30"
        >
          <Plus className="w-4 h-4" />
          New Treatment Plan
        </button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No treatment plans yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Treatment Plan" to start a treatment pathway.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const totalPrice = plan.items?.reduce((sum, item) => sum + (Number(item.service?.price) || 0), 0) || 0;
            const completedCount = plan.items?.filter(i => i.status === 'completed').length || 0;
            const totalCount = plan.items?.length || 0;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div key={plan.id} className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-base">{plan.title}</h3>
                      {getStatusBadge(plan.status)}
                    </div>
                    {plan.notes && <p className="text-xs text-slate-500 mt-1">{plan.notes}</p>}
                  </div>

                  {/* Summary progress & cost */}
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase">Estimated Total</span>
                      <span className="text-sm font-bold text-slate-800">{totalPrice.toLocaleString()} EGP</span>
                    </div>
                    <div className="w-28">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items / Procedures Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Procedure / Service</th>
                        <th className="py-2.5 px-3">Target Tooth</th>
                        <th className="py-2.5 px-3">Cost (EGP)</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plan.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {item.service?.name || `Service #${item.service_id}`}
                            {item.notes && <span className="block text-[10px] text-slate-400">{item.notes}</span>}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {item.tooth_number ? `#${item.tooth_number}` : 'General'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {Number(item.service?.price || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            {item.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={() => onUpdateItemStatus(item.id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold inline-flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Mark Done
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onUpdateItemStatus(item.id, 'pending')}
                                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                              >
                                Undo
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Treatment Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Create New Treatment Plan</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tooth 14 Root Canal Therapy & Crown"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Clinical Overview Notes
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Patient agreed to 2-stage treatment..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Procedures Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Procedures Included
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Procedure
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={item.service_id}
                        onChange={(e) => handleItemChange(idx, 'service_id', e.target.value)}
                        className="text-xs p-2 rounded-lg border border-slate-200 bg-white flex-1 font-medium"
                      >
                        {DENTAL_SERVICES.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.price} EGP)</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        max="32"
                        placeholder="Tooth #"
                        value={item.tooth_number}
                        onChange={(e) => handleItemChange(idx, 'tooth_number', e.target.value)}
                        className="w-20 text-xs p-2 rounded-lg border border-slate-200 bg-white"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={selectedItems.length === 1}
                        className="text-rose-500 hover:text-rose-700 p-1.5 text-xs font-bold disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Treatment Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
