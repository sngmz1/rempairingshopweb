import React from 'react';
import { X, Printer, Download, ExternalLink } from 'lucide-react';
import { RepairOrder, ShopSettings } from '../../types';

interface PrintJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RepairOrder;
  settings: ShopSettings;
}

export const PrintJobCardModal: React.FC<PrintJobCardModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-5 text-white shadow-2xl my-auto max-h-[95vh] overflow-y-auto border border-slate-700">
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Print Job Card / Bill</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
            <a
              href={`/api/repairs/${order.orderId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper (Clean Black/White or High Contrast) */}
        <div
          id="printable-area"
          className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl font-sans text-xs space-y-4 print:p-0 print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-900">
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-950 font-heading">
              {settings.shopName}
            </h1>
            <p className="font-semibold text-slate-800 mt-1">
              {settings.contact1Name}: {settings.contact1Number} &nbsp;|&nbsp; {settings.contact2Name}: {settings.contact2Number}
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">{settings.address}</p>
            <p className="text-slate-500 text-[10px] mt-0.5">{settings.serviceDescription}</p>
          </div>

          {/* Title Bar */}
          <div className="flex items-center justify-between bg-slate-100 p-2 rounded border border-slate-300 font-bold">
            <span className="uppercase text-[11px]">
              {order.status === 'Delivered' ? 'Repair Invoice / Receipt' : 'Job Card / Repair Slip'}
            </span>
            <span className="font-mono text-blue-700 text-sm">ORDER: {order.orderId}</span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer:</span>
              <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
              <p className="font-mono text-slate-700">{order.customerMobile}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Date: {new Date(order.receivedAt).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Device:</span>
              <p className="font-bold text-sm text-slate-900">
                {order.brand} {order.model}
              </p>
              <p className="text-slate-700">{order.deviceType || 'Mobile Phone'}</p>
              {order.expectedDelivery && (
                <p className="text-[10px] text-slate-600 mt-1">
                  Expected: <strong>{order.expectedDelivery}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Complaint */}
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-rose-700 text-[10px] uppercase block">Problem / Complaint:</span>
            <p className="text-slate-800 font-medium text-xs mt-0.5">{order.complaint}</p>
          </div>

          {/* Parts Used */}
          {order.partsUsed && order.partsUsed.length > 0 && (
            <div>
              <span className="font-bold text-[10px] text-slate-600 uppercase block mb-1">
                Parts Installed / Replaced:
              </span>
              <div className="space-y-1 border border-slate-200 p-2 rounded">
                {order.partsUsed.map((p) => (
                  <div key={p.partId} className="flex justify-between text-[11px]">
                    <span>• {p.partName} (Qty: {p.quantity})</span>
                    <span className="font-mono">₹{p.unitPrice * p.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing Table */}
          <div className="border border-slate-300 rounded p-3 space-y-1.5 bg-slate-50">
            <div className="flex justify-between text-slate-600">
              <span>Estimated Repair Amount:</span>
              <span className="font-mono">₹{order.estimatedAmount}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-800">
              <span>Final Repair Amount:</span>
              <span className="font-mono">₹{order.finalAmount || order.estimatedAmount}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- ₹{order.discount}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-700">
              <span>Advance Paid ({order.paymentMode || 'Cash'}):</span>
              <span className="font-mono">₹{order.advance}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-950 pt-1.5 border-t border-slate-300">
              <span>BALANCE DUE:</span>
              <span className="font-mono text-rose-700">₹{order.balance}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 text-[10px] text-slate-500 space-y-1">
            <div className="flex justify-between items-end">
              <div>
                <p>Status: <strong className="text-slate-900 uppercase">{order.status}</strong></p>
                {settings.upiId && <p>Pay via UPI: <strong>{settings.upiId}</strong></p>}
                <p className="mt-1 text-[9px] text-slate-400">{settings.receiptInformation}</p>
              </div>
              <div className="text-right">
                <p className="border-t border-slate-400 pt-1 w-32 text-center text-slate-600">
                  Authorized Sign
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
