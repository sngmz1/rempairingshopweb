import React, { useState } from 'react';
import { X, Smartphone, Check, Loader2, Sparkles, ChevronDown, ChevronUp, Clock, Calendar, Truck } from 'lucide-react';
import { api } from '../../services/api';
import { RepairOrder, PaymentMode } from '../../types';
import confetti from 'canvas-confetti';

interface NewRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: RepairOrder) => void;
}

const COMMON_BRANDS = ['Samsung', 'Vivo', 'Oppo', 'Realme', 'Apple', 'OnePlus', 'Xiaomi', 'Motorola'];
const COMMON_COMPLAINTS = [
  'Display Broken / Folder Change',
  'Touch Not Working',
  'Battery Draining Fast / Battery Dead',
  'Charging Port Issue / Not Charging',
  'Water Damage / Dead Handset',
  'Network / SIM Not Working',
  'Speaker / Mic Not Working',
  'Software / Hanging / Password Lock',
];

export const NewRepairModal: React.FC<NewRepairModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [deviceType, setDeviceType] = useState('Mobile');
  const [brand, setBrand] = useState('Samsung');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [complaint, setComplaint] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState<number | ''>('');
  const [advance, setAdvance] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');

  // Optional Fields
  const [imeiOrSerial, setImeiOrSerial] = useState('');
  const [deviceCondition, setDeviceCondition] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [technician, setTechnician] = useState('Ashok Bhai');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    const selectedBrand = brand === 'Other' ? customBrand.trim() : brand;
    if (!selectedBrand) {
      setError('Device brand is required');
      return;
    }

    if (!model.trim()) {
      setError('Device model is required');
      return;
    }

    if (!complaint.trim()) {
      setError('Customer complaint is required');
      return;
    }

    try {
      setLoading(true);
      const newOrder = await api.createRepair({
        customerName: customerName.trim(),
        customerMobile: cleanMobile,
        deviceType,
        brand: selectedBrand,
        model: model.trim(),
        complaint: complaint.trim(),
        estimatedAmount: typeof estimatedAmount === 'number' ? estimatedAmount : 0,
        advance: typeof advance === 'number' ? advance : 0,
        paymentMode,
        imeiOrSerial: imeiOrSerial.trim() || undefined,
        deviceCondition: deviceCondition.trim() || undefined,
        accessoriesReceived: accessoriesReceived.trim() || undefined,
        expectedDelivery: expectedDelivery.trim() || undefined,
        technician: technician.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      onOrderCreated(newOrder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create repair order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[92vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">+ New Repair Intake</h2>
              <p className="text-xs text-slate-400">Fast Job Card Creation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Automatic Pickup Date & Time Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Device Pickup / Received Date & Time (Auto)
                </span>
                <span className="text-white font-mono font-semibold">
                  {new Date().toLocaleString('en-IN', {
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
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              Auto-Stamped
            </span>
          </div>

          {/* Customer Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Patel"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Device Brand Quick Select Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Device Brand <span className="text-rose-400">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_BRANDS.map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBrand(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    brand === b
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/80'
                  }`}
                >
                  {b}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBrand('Other')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  brand === 'Other'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/80'
                }`}
              >
                Other
              </button>
            </div>

            {brand === 'Other' && (
              <input
                type="text"
                required
                placeholder="Enter Brand name (e.g. Infinix, Techno, Laptop)"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
              />
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Model Name / Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Galaxy A55 5G, Vivo Y20, iPhone 13"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Customer Complaint */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer Complaint / Problem <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Display not working, screen flickering, charging slow"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />

            {/* Quick Complaint Tags */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_COMPLAINTS.slice(0, 4).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setComplaint(c)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Date & Time (Schedule & Auto Delivery Record) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Delivery Date & Time Schedule</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Auto-stamped on handover
              </span>
            </div>

            {/* Quick Delivery Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Today (2 Hours)',
                'Today Evening (7:00 PM)',
                'Tomorrow Morning (11:00 AM)',
                'Tomorrow Evening (7:00 PM)',
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setExpectedDelivery(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    expectedDelivery === preset
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/80'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="e.g. Today evening 7:00 PM / Tomorrow 11:00 AM"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400">
              💡 Exact delivery timestamp will be permanently recorded automatically when you click "Mark as Delivered".
            </p>
          </div>

          {/* Pricing & Advance */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="₹ e.g. 3500"
                value={estimatedAmount}
                onChange={(e) =>
                  setEstimatedAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="₹ e.g. 1000"
                value={advance}
                onChange={(e) =>
                  setAdvance(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {typeof advance === 'number' && advance > 0 && (
              <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Payment Mode:</span>
                {(['Cash', 'UPI', 'Card'] as PaymentMode[]).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      paymentMode === mode
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional Fields Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>{showOptional ? 'Hide Optional Details' : '+ Show Optional Details (IMEI, Delivery Date, Notes)'}</span>
              {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showOptional && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">IMEI / Serial Number</label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI"
                    value={imeiOrSerial}
                    onChange={(e) => setImeiOrSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Customer Notes / Special Request</label>
                  <input
                    type="text"
                    placeholder="e.g. Keep old parts, call before delivery"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Accessories Received</label>
                  <input
                    type="text"
                    placeholder="e.g. Back Cover, SIM Tray, Memory Card"
                    value={accessoriesReceived}
                    onChange={(e) => setAccessoriesReceived(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Technician / Handled By</label>
                  <input
                    type="text"
                    placeholder="e.g. Ashok Bhai / Mitesh"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Device Physical Condition / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Scratched back, dent on right corner"
                  value={deviceCondition}
                  onChange={(e) => setDeviceCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Order & Job Card...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Receive Device & Create Job Card</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Order ID will be automatically generated. PDF bill created automatically.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
