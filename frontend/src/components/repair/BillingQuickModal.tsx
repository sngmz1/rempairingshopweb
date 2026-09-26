import React, { useState } from 'react';
import { X, CreditCard, Check, Loader2, IndianRupee } from 'lucide-react';
import { RepairOrder, PaymentMode } from '../../types';
import { api } from '../../services/api';

interface BillingQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: RepairOrder[];
  onPaymentRecorded: (order: RepairOrder) => void;
}

export const BillingQuickModal: React.FC<BillingQuickModalProps> = ({
  isOpen,
  onClose,
  orders,
  onPaymentRecorded,
}) => {
  const pendingOrders = orders.filter((o) => o.balance > 0 && o.status !== 'Cancelled');
  const [selectedOrderId, setSelectedOrderId] = useState(pendingOrders[0]?.orderId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrder = orders.find((o) => o.orderId === selectedOrderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || typeof amount !== 'number' || amount <= 0) {
      setError('Please select an order and enter valid payment amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await api.addPayment(selectedOrderId, amount, paymentMode, 'Staff', notes);
      onPaymentRecorded(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-md rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Quick Add Payment</h2>
              <p className="text-xs text-slate-400">Record customer counter payment</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Select Repair Order with Balance
            </label>
            {pendingOrders.length === 0 ? (
              <p className="text-slate-400 p-3 rounded-xl bg-slate-900 border border-slate-800">
                No orders currently have pending balance!
              </p>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  const ord = orders.find((o) => o.orderId === e.target.value);
                  if (ord) setAmount(ord.balance);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
              >
                {pendingOrders.map((ord) => (
                  <option key={ord.orderId} value={ord.orderId}>
                    {ord.orderId} - {ord.customerName} ({ord.brand} {ord.model}) - Bal: ₹{ord.balance}
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentOrder && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">CUSTOMER</span>
                <span className="font-bold text-white text-sm">{currentOrder.customerName}</span>
                <span className="text-[11px] text-slate-400 block">{currentOrder.brand} {currentOrder.model}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">CURRENT BALANCE</span>
                <span className="font-extrabold text-amber-400 text-base">₹{currentOrder.balance}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">Payment Amount (₹)</label>
              {currentOrder && (
                <button
                  type="button"
                  onClick={() => setAmount(currentOrder.balance)}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  Pay Full Balance (₹{currentOrder.balance})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              placeholder="₹ Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-base focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Payment Mode</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'] as PaymentMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition ${
                    paymentMode === mode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay / PhonePe"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || pendingOrders.length === 0 || !amount}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Record Payment of ₹{amount || 0}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
