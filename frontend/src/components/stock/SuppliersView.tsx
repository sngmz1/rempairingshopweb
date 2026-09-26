import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { api } from '../../services/api';
import { Users, X, Plus, Phone, Check, Loader2 } from 'lucide-react';

interface SuppliersViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ isOpen, onClose }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      setError('Supplier name and mobile are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.createSupplier({ name: name.trim(), mobile: mobile.trim(), notes: notes.trim() });
      setName('');
      setMobile('');
      setNotes('');
      setShowAdd(false);
      await loadSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Suppliers Directory</h2>
              <p className="text-xs text-slate-400">Parts Wholesalers & Vendors</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAdd ? 'Cancel' : '+ Add Supplier'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Supplier Form */}
        {showAdd && (
          <form onSubmit={handleAddSupplier} className="mt-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-3 text-xs">
            {error && <div className="text-rose-400">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shree Mobile Spares"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9825012345"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Notes / Location</label>
              <input
                type="text"
                placeholder="e.g. Main wholesaler for Samsung & OnePlus displays in Ahmedabad"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Supplier</span>
              </button>
            </div>
          </form>
        )}

        {/* Supplier Cards */}
        <div className="mt-4 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No suppliers recorded.</div>
          ) : (
            suppliers.map((sup) => (
              <div
                key={sup.supplierId}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sup.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{sup.supplierId}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{sup.notes || 'No notes'}</p>
                </div>

                <a
                  href={`tel:${sup.mobile}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-emerald-400 border border-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{sup.mobile}</span>
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
