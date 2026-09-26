import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Printer,
  CheckCircle2,
  Package,
  Plus,
  RotateCcw,
  IndianRupee,
  Loader2,
  FileText,
  Wrench,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { RepairOrder, RepairStatus, PaymentMode, StockItem } from '../../types';

interface OrderDetailModalProps {
  order: RepairOrder;
  stockItems: StockItem[];
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: RepairOrder) => void;
  onOpenPrint: (order: RepairOrder) => void;
}

const STATUS_LIST: RepairStatus[] = [
  'Received',
  'Checking',
  'Waiting for Approval',
  'Approved',
  'Repairing',
  'Waiting for Part',
  'Ready',
  'Delivered',
  'Cancelled',
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  stockItems,
  isOpen,
  onClose,
  onOrderUpdated,
  onOpenPrint,
}) => {
  const [loading, setLoading] = useState(false);

  // Add Part state
  const [showAddPart, setShowAddPart] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState(stockItems[0]?.itemId || '');
  const [partQty, setPartQty] = useState(1);

  // Add Payment state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Edit Final Billing state
  const [showEditBilling, setShowEditBilling] = useState(false);
  const [editFinalAmount, setEditFinalAmount] = useState(order.finalAmount || order.estimatedAmount);
  const [editDiscount, setEditDiscount] = useState(order.discount || 0);

  if (!isOpen) return null;

  // Handle Status Update
  const handleUpdateStatus = async (newStatus: RepairStatus) => {
    try {
      setLoading(true);
      const updated = await api.updateRepairStatus(order.orderId, newStatus, 'Staff');
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Mark as Delivered
  const handleMarkDelivered = () => {
    handleUpdateStatus('Delivered');
  };

  // Attach Part
  const handleAttachPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) return;

    try {
      setLoading(true);
      const updated = await api.addPartToOrder(order.orderId, selectedPartId, partQty);
      setShowAddPart(false);
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to add part');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Part Used / Consumed
  const handleConfirmPartUsed = async (partId: string) => {
    try {
      setLoading(true);
      const updated = await api.confirmPartUsed(order.orderId, partId);
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to consume part');
    } finally {
      setLoading(false);
    }
  };

  // Return Consumed Part back to stock
  const handleReturnPart = async (partId: string) => {
    if (!confirm('Return this part back to shop inventory?')) return;
    try {
      setLoading(true);
      const updated = await api.returnConsumedPart(order.orderId, partId);
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to return part');
    } finally {
      setLoading(false);
    }
  };

  // Add Payment
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof paymentAmount !== 'number' || paymentAmount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }

    try {
      setLoading(true);
      const updated = await api.addPayment(order.orderId, paymentAmount, paymentMode, 'Staff', paymentNotes);
      setShowAddPayment(false);
      setPaymentAmount('');
      setPaymentNotes('');
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // Update Billing
  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updated = await api.updateBilling(order.orderId, editFinalAmount, editDiscount);
      setShowEditBilling(false);
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update billing');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Message
  const whatsappUrl = `https://wa.me/91${order.customerMobile}?text=${encodeURIComponent(
    `Jai Mataji Mobile Repairing, Talod\nOrder: ${order.orderId}\nCustomer: ${order.customerName}\nDevice: ${order.brand} ${order.model}\nStatus: ${order.status}\nRemaining Balance: ₹${order.balance}\nContact: Ashok Bhai 9974298866 / Mitesh 9327394978`
  )}`;

  // Calculations
  const partsTotal = order.partsUsed
    ? order.partsUsed.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
    : 0;
  const finalTotal = order.finalAmount || order.estimatedAmount;
  const serviceAmount = Math.max(0, finalTotal - partsTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-4 sm:p-6 text-white shadow-2xl my-auto max-h-[94vh] overflow-y-auto border border-slate-700 space-y-4">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs sm:text-sm font-extrabold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-xl border border-blue-900 lowercase break-all">
              #{order.orderId}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                order.status === 'Ready'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                  : order.status === 'Delivered'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : order.status === 'Cancelled'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                  : 'bg-blue-950 text-blue-300 border-blue-500/60'
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Bill Button (Opens Clean Printable / Shareable Bill) */}
            <button
              onClick={() => onOpenPrint(order)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition active:scale-95"
              title="View Clean Bill"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Bill</span>
            </button>

            {/* Print Icon Button */}
            <button
              onClick={() => onOpenPrint(order)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Print Job Card"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. Customer Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer</span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{order.customerName}</h3>
              <p className="text-xs font-mono text-slate-300 mt-0.5">{order.customerMobile}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${order.customerMobile}`}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                title="Call Customer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                title="Send WhatsApp Bill"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. Device Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Device</span>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="font-bold text-sm text-white">
                {order.brand} {order.model}
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              {order.deviceType || 'Mobile Phone'}
            </span>
          </div>
          {order.imeiOrSerial && (
            <p className="text-xs font-mono text-slate-400 mt-1">
              IMEI/Serial: <span className="text-slate-300">{order.imeiOrSerial}</span>
            </p>
          )}
        </div>

        {/* 3. Problem Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Problem / Complaint</span>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium">{order.complaint}</p>
        </div>

        {/* 4. Extra Parts Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Extra Parts</span>
            </div>

            <button
              onClick={() => setShowAddPart(!showAddPart)}
              className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddPart ? 'Cancel' : '+ Add Part'}</span>
            </button>
          </div>

          {/* Add Part Form */}
          {showAddPart && (
            <form onSubmit={handleAttachPart} className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Select Part</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  {stockItems.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.itemName} — ₹{item.sellingPrice} (In Stock: {item.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-slate-300 font-semibold">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || stockItems.length === 0}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                >
                  Add Part
                </button>
              </div>
            </form>
          )}

          {/* Parts List */}
          {(!order.partsUsed || order.partsUsed.length === 0) ? (
            <p className="text-xs text-slate-500">No extra parts added.</p>
          ) : (
            <div className="space-y-1.5">
              {order.partsUsed.map((part) => (
                <div
                  key={part.partId}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{part.partName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Qty: <span className="text-white font-mono">{part.quantity}</span> × ₹{part.unitPrice} = <strong className="text-blue-400 font-mono">₹{part.unitPrice * part.quantity}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!part.consumed ? (
                      <button
                        onClick={() => handleConfirmPartUsed(part.partId)}
                        disabled={loading}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                        title="Mark consumed from stock"
                      >
                        Use Part
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReturnPart(part.partId)}
                        disabled={loading}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition"
                        title="Return part to stock"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Return</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-1.5 text-xs text-slate-400 font-semibold">
                <span>Parts Total:</span>
                <span className="font-mono text-white font-bold">₹{partsTotal}</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Amount & Repair Pricing */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Amount</span>
            </div>

            <button
              onClick={() => setShowEditBilling(!showEditBilling)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              {showEditBilling ? 'Cancel' : 'Edit Amount'}
            </button>
          </div>

          {/* Edit Amount Form */}
          {showEditBilling && (
            <form onSubmit={handleUpdateBilling} className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Total Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFinalAmount}
                    onChange={(e) => setEditFinalAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Save Amount
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1 text-xs text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Repair / Service Charge:</span>
              <span className="font-mono">₹{serviceAmount}</span>
            </div>
            {partsTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Parts Total:</span>
                <span className="font-mono">₹{partsTotal}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">- ₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800 text-sm">
              <span>Total Bill:</span>
              <span className="font-mono">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* 6. Payment Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Payment</span>

            <button
              onClick={() => setShowAddPayment(!showAddPayment)}
              className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddPayment ? 'Cancel' : '+ Add Payment'}</span>
            </button>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <form onSubmit={handleAddPayment} className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Advance / Paid:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">₹{order.advance}</span>
          </div>
        </div>

        {/* 7. Remaining Balance (Large & Prominent) */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            order.balance > 0
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-emerald-950/30 border-emerald-500/40'
          }`}
        >
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Remaining Balance</span>
            <span
              className={`text-2xl sm:text-3xl font-extrabold font-mono mt-0.5 block ${
                order.balance > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              ₹{order.balance}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              order.balance > 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {order.balance > 0 ? 'Payment Pending' : 'Fully Paid ✓'}
          </span>
        </div>

        {/* 8. Repair Status Section */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Repair Status</span>
            <span className="text-xs text-blue-400 font-semibold">{order.status}</span>
          </div>

          {/* Quick Mark Delivered button if Ready */}
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <button
              onClick={handleMarkDelivered}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Mark as Delivered ✓</span>
            </button>
          )}

          {/* Status Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STATUS_LIST.map((st) => (
              <button
                key={st}
                disabled={loading || order.status === st}
                onClick={() => handleUpdateStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  order.status === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 9. Expected Delivery Section */}
        {order.expectedDelivery && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-500">Expected Delivery:</span>
              <p className="font-semibold text-white mt-0.5">{order.expectedDelivery}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
