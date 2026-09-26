import React, { useState, useEffect } from 'react';
import { StockMovement } from '../../types';
import { api } from '../../services/api';
import { History, X, ArrowDownLeft, ArrowUpRight, RotateCcw, Search } from 'lucide-react';

interface StockMovementsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({ isOpen, onClose }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await api.getMovements();
      setMovements(data);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      m.movementId.toLowerCase().includes(q) ||
      m.itemName.toLowerCase().includes(q) ||
      (m.orderId && m.orderId.toLowerCase().includes(q)) ||
      m.reason.toLowerCase().includes(q) ||
      m.user.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[92vh] overflow-y-auto border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Stock Movement Audit Log</h2>
              <p className="text-xs text-slate-400">Section 18: Every change is recorded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Movement ID, Part, Order ID, or User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* List */}
        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading movements...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No stock movements recorded yet.</div>
          ) : (
            filtered.map((m) => {
              const isOut = m.type === 'OUT';
              const isReturn = m.type === 'RETURN';

              return (
                <div
                  key={m.movementId}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                          isOut
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isReturn
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isOut ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : isReturn ? (
                          <RotateCcw className="w-3 h-3" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3" />
                        )}
                        <span>{m.type}</span>
                      </span>

                      <span className="font-semibold text-white truncate">{m.itemName}</span>

                      {m.orderId && (
                        <span className="font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded text-[10px] border border-blue-900">
                          {m.orderId}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 text-[11px]">{m.reason}</p>

                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>By: {m.user}</span>
                      <span>•</span>
                      <span>{new Date(m.date).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-extrabold font-mono ${
                        isOut ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {isOut ? `-${m.quantity}` : `+${m.quantity}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.beforeQuantity} → {m.afterQuantity}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
