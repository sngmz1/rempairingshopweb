import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  ExternalLink,
  Printer,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  RotateCcw,
  IndianRupee,
  Clock,
  ChevronDown,
  Loader2,
  Smartphone,
  ShieldAlert,
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
  'Unable to Repair',
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
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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
      setShowStatusDropdown(false);
      const updated = await api.updateRepairStatus(order.orderId, newStatus, 'Staff', statusNotes);
      setStatusNotes('');
      onOrderUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Section 11: Mark as Delivered
  const handleMarkDelivered = () => {
    handleUpdateStatus('Delivered');
  };

  // Section 16: Attach Part
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

  // Section 16: Confirm Part Used / Consumed (Deducts stock!)
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

  // Section 16: Return Consumed Part
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[94vh] overflow-y-auto border border-slate-700">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm sm:text-base font-extrabold text-blue-400 bg-blue-950/80 px-3 py-1 rounded-xl border border-blue-900">
              {order.orderId}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
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

          <div className="flex items-center gap-1.5">
            {/* View PDF Bill button */}
            <a
              href={`/api/repairs/${order.orderId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition"
              title="View PDF Bill / Job Card"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>📄 View Bill</span>
            </a>

            {/* Print button */}
            <button
              onClick={() => onOpenPrint(order)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Print Job Card"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer & Device Information Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{order.customerName}</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{order.customerMobile}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.customerMobile}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Dedicated Auto Timestamps Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            {/* Auto Pickup Time */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Pickup / Received Time (Auto)
                </span>
                <span className="text-white font-mono font-semibold">
                  {new Date(order.receivedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Auto Delivery Time */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  order.deliveredAt || order.status === 'Delivered'
                    ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-600/20 border-amber-500/30 text-amber-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Delivery Time (Auto)
                </span>
                {order.deliveredAt ? (
                  <span className="text-emerald-300 font-mono font-bold flex items-center gap-1.5 flex-wrap">
                    <span>
                      {new Date(order.deliveredAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-sans">
                      Delivered ✓
                    </span>
                  </span>
                ) : order.status === 'Delivered' ? (
                  <span className="text-emerald-300 font-mono font-bold flex items-center gap-1.5 flex-wrap">
                    <span>
                      {new Date(order.updatedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                    <span className="text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-sans">
                      Delivered ✓
                    </span>
                  </span>
                ) : (
                  <span className="text-amber-300 font-mono font-medium">
                    {order.expectedDelivery
                      ? `Pending (Exp: ${order.expectedDelivery})`
                      : 'Pending Handover (Auto-recorded on delivery)'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-500">Device:</span>
              <p className="font-semibold text-white">
                {order.brand} {order.model}
              </p>
            </div>
            {order.imeiOrSerial && (
              <div>
                <span className="text-slate-500">IMEI:</span>
                <p className="font-mono text-slate-300">{order.imeiOrSerial}</p>
              </div>
            )}
            {order.accessoriesReceived && (
              <div>
                <span className="text-slate-500">Accessories:</span>
                <p className="text-slate-300">{order.accessoriesReceived}</p>
              </div>
            )}
            {order.technician && (
              <div>
                <span className="text-slate-500">Technician:</span>
                <p className="text-slate-300">{order.technician}</p>
              </div>
            )}
          </div>

          {/* Problem */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-rose-400 font-semibold block mb-0.5">Reported Complaint:</span>
            <span className="text-slate-200">{order.complaint}</span>
          </div>
        </div>

        {/* Section 11: Mark as Delivered Button (Prominent when Ready or non-delivered) */}
        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
          <div className="mt-4">
            <button
              onClick={handleMarkDelivered}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition transform active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Mark as Delivered ✓</span>
            </button>
          </div>
        )}

        {/* Status Dropdown / Changer */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Update Predefined Status:</span>
            <span className="text-[11px] text-slate-500">Current: {order.status}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_LIST.map((st) => (
              <button
                key={st}
                disabled={loading || order.status === st}
                onClick={() => handleUpdateStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  order.status === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Section 15 & 16: Parts Used & Critical Stock Rule */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Parts Installed / Used
              </h4>
            </div>

            <button
              onClick={() => setShowAddPart(!showAddPart)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddPart ? 'Cancel' : '+ Attach Part'}</span>
            </button>
          </div>

          {/* Attach Part Form */}
          {showAddPart && (
            <form onSubmit={handleAttachPart} className="mb-3 p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Select Part from Inventory</label>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    {stockItems.map((item) => (
                      <option key={item.itemId} value={item.itemId}>
                        {item.itemName} (Available: {item.availableQuantity}) - ₹{item.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={partQty}
                    onChange={(e) => setPartQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || stockItems.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                >
                  Attach Part to Order
                </button>
              </div>
            </form>
          )}

          {/* Parts List */}
          {(!order.partsUsed || order.partsUsed.length === 0) ? (
            <p className="text-xs text-slate-500 py-2">No parts attached to this repair yet.</p>
          ) : (
            <div className="space-y-2">
              {order.partsUsed.map((part) => (
                <div
                  key={part.partId}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{part.partName}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                      <span>Qty: {part.quantity}</span>
                      <span>•</span>
                      <span>₹{part.unitPrice * part.quantity}</span>
                      <span>•</span>
                      {part.consumed ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Consumed from Stock
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          Attached (Not Deducted Yet)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Critical Rule 16: Part Used / Consumed button */}
                    {!part.consumed ? (
                      <button
                        onClick={() => handleConfirmPartUsed(part.partId)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition"
                        title="Deduct from shop stock"
                      >
                        Part Used / Consumed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReturnPart(part.partId)}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition"
                        title="Return part back to stock"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Return Part</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 10: Billing & Payments */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Billing & Payments
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditBilling(!showEditBilling)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                {showEditBilling ? 'Close' : 'Edit Amount'}
              </button>
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Payment</span>
              </button>
            </div>
          </div>

          {/* Edit Final Amount Form */}
          {showEditBilling && (
            <form onSubmit={handleUpdateBilling} className="mb-3 p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Final Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFinalAmount}
                    onChange={(e) => setEditFinalAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount (₹)</label>
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
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-xs"
                >
                  Save Billing
                </button>
              </div>
            </form>
          )}

          {/* Add Payment Form */}
          {showAddPayment && (
            <form onSubmit={handleAddPayment} className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="₹ e.g. 500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          )}

          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500">Total Amount:</span>
              <p className="text-sm font-bold text-white">₹{order.finalAmount || order.estimatedAmount}</p>
            </div>
            <div>
              <span className="text-slate-500">Discount:</span>
              <p className="text-sm font-bold text-slate-300">₹{order.discount || 0}</p>
            </div>
            <div>
              <span className="text-slate-500">Total Paid:</span>
              <p className="text-sm font-bold text-emerald-400">₹{order.advance}</p>
            </div>
            <div>
              <span className="text-slate-500">Remaining Balance:</span>
              <p className={`text-sm font-extrabold ${order.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ₹{order.balance}
              </p>
            </div>
          </div>
        </div>

        {/* Status History Audit Trail */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1.5">Status History Audit:</span>
            <div className="space-y-1">
              {order.statusHistory.slice(-4).map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <span>
                    • {h.oldStatus ? `${h.oldStatus} → ` : ''}
                    <strong className="text-blue-400">{h.newStatus}</strong> by {h.changedBy}
                  </span>
                  <span className="text-slate-500">
                    {new Date(h.changedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
