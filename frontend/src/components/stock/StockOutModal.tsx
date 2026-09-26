import React, { useState } from 'react';
import { X, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { StockItem } from '../../types';
import { api } from '../../services/api';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockItem[];
  preselectedItem?: StockItem;
  onStockUpdated: () => void;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  stock,
  preselectedItem,
  onStockUpdated,
}) => {
  const [selectedItemId, setSelectedItemId] = useState(preselectedItem?.itemId || stock[0]?.itemId || '');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('Direct counter sale / Replacement');
  const [userName, setUserName] = useState('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentItem = stock.find((s) => s.itemId === selectedItemId);
  const beforeQty = currentItem ? currentItem.availableQuantity : 0;
  const usedQty = typeof quantity === 'number' ? quantity : 0;
  const afterQty = Math.max(0, beforeQty - usedQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || usedQty <= 0) {
      setError('Please select an item and enter valid quantity');
      return;
    }

    if (beforeQty < usedQty) {
      setError(`Cannot stock out ${usedQty} units. Only ${beforeQty} available in stock.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.stockOut({
        itemId: selectedItemId,
        quantity: usedQty,
        reason: reason.trim(),
        orderId: orderId.trim() || undefined,
        userName: userName.trim() || 'Staff',
      });
      onStockUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-md rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Stock Out (Consume / Sale)</h2>
              <p className="text-xs text-slate-400">Deduct shop inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Stock Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
            >
              {stock.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.itemName} (Available: {item.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Quantity to Remove
            </label>
            <input
              type="number"
              min="1"
              max={beforeQty}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-base font-mono focus:border-amber-500"
            />
          </div>

          {/* Section 15: Clear Before / Used / After Visual Calculation */}
          {currentItem && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1.5">
              <span className="font-bold text-amber-400 block mb-1">{currentItem.itemName}</span>
              <div className="flex items-center justify-between text-slate-300 font-mono">
                <span>Before: {beforeQty}</span>
                <span className="text-amber-400 font-bold">- Used: {usedQty}</span>
                <span className="text-white font-extrabold text-sm">After: {afterQty}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Repair Order ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ORD-2026-00482 (if used for a repair)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || usedQty <= 0 || beforeQty < usedQty}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Confirm Stock Out (-{usedQty})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
