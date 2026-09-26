import React from 'react';
import { X, Printer, Download, MessageCircle, Phone } from 'lucide-react';
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

  const partsTotal = order.partsUsed
    ? order.partsUsed.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)
    : 0;
  const finalTotal = order.finalAmount || order.estimatedAmount;
  const serviceAmount = Math.max(0, finalTotal - partsTotal);

  const whatsappBillText = encodeURIComponent(
    `*${settings.shopName}*\n` +
    `-------------------------\n` +
    `*CUSTOMER BILL / RECEIPT*\n` +
    `Order ID: #${order.orderId}\n` +
    `Customer: ${order.customerName}\n` +
    `Mobile: ${order.customerMobile}\n` +
    `Device: ${order.brand} ${order.model} (${order.deviceType || 'Mobile Phone'})\n` +
    (order.imeiOrSerial ? `IMEI/Serial: ${order.imeiOrSerial}\n` : '') +
    `Problem: ${order.complaint}\n` +
    (order.partsUsed && order.partsUsed.length > 0
      ? `Parts: ${order.partsUsed.map((p) => `${p.partName} (₹${p.unitPrice * p.quantity})`).join(', ')}\n`
      : '') +
    `Repair/Service: ₹${serviceAmount}\n` +
    (partsTotal > 0 ? `Parts Total: ₹${partsTotal}\n` : '') +
    (order.discount ? `Discount: ₹${order.discount}\n` : '') +
    `Total Amount: ₹${finalTotal}\n` +
    `Advance Paid: ₹${order.advance}\n` +
    `*BALANCE DUE: ₹${order.balance}*\n` +
    `Status: ${order.status}\n` +
    (order.expectedDelivery ? `Expected: ${order.expectedDelivery}\n` : '') +
    `-------------------------\n` +
    `Contact: ${settings.contact1Name || 'Shop'}: ${settings.contact1Number || ''}\n` +
    `Address: ${settings.address || 'Talod'}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-4 sm:p-5 text-white shadow-2xl my-auto max-h-[96vh] overflow-y-auto border border-slate-700">
        
        {/* Top Actions Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Customer Bill</h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp Bill */}
            <a
              href={`https://wa.me/91${order.customerMobile}?text=${whatsappBillText}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
              title="Share Bill via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Print Now */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/30 transition"
              title="Print Bill"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* PDF link */}
            <a
              href={`/api/repairs/${order.orderId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Card */}
        <div
          id="printable-area"
          className="bg-white text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xl font-sans text-xs space-y-3.5 print:p-0 print:shadow-none print:rounded-none"
        >
          {/* Shop Header */}
          <div className="text-center pb-2.5 border-b-2 border-slate-900">
            <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-950 font-heading">
              {settings.shopName}
            </h1>
            <p className="font-semibold text-slate-800 text-[11px] sm:text-xs mt-0.5">
              {settings.contact1Name}: {settings.contact1Number} {settings.contact2Name && `| ${settings.contact2Name}: ${settings.contact2Number}`}
            </p>
            {settings.address && (
              <p className="text-slate-600 text-[10px] mt-0.5">{settings.address}</p>
            )}
          </div>

          {/* Receipt Title Bar */}
          <div className="flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-300 font-bold">
            <span className="uppercase text-[11px] text-slate-700">
              {order.status === 'Delivered' ? 'Repair Receipt' : 'Repair Job Bill'}
            </span>
            <span className="font-mono text-blue-700 font-extrabold text-xs sm:text-sm">
              ORDER #{order.orderId}
            </span>
          </div>

          {/* Customer & Device Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2.5 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Customer:</span>
              <p className="font-bold text-sm text-slate-950">{order.customerName}</p>
              <p className="font-mono text-slate-700 font-semibold">{order.customerMobile}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Device:</span>
              <p className="font-bold text-sm text-slate-950">
                {order.brand} {order.model}
              </p>
              <p className="text-slate-600 text-[11px]">{order.deviceType || 'Mobile Phone'}</p>
              {order.imeiOrSerial && (
                <p className="text-[10px] font-mono text-slate-600">IMEI: {order.imeiOrSerial}</p>
              )}
            </div>
          </div>

          {/* Problem Section */}
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-rose-700 text-[10px] uppercase block">Problem / Complaint:</span>
            <p className="text-slate-800 font-medium text-xs mt-0.5">{order.complaint}</p>
          </div>

          {/* Parts Added Section */}
          {order.partsUsed && order.partsUsed.length > 0 && (
            <div>
              <span className="font-bold text-[10px] text-slate-600 uppercase block mb-1">
                Parts Installed / Replaced:
              </span>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-left font-bold">
                    <tr>
                      <th className="p-1.5 pl-2">Part Name</th>
                      <th className="p-1.5 text-center">Qty</th>
                      <th className="p-1.5 text-right">Price</th>
                      <th className="p-1.5 pr-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.partsUsed.map((p) => (
                      <tr key={p.partId} className="border-b border-slate-100">
                        <td className="p-1.5 pl-2 font-medium">{p.partName}</td>
                        <td className="p-1.5 text-center font-mono">{p.quantity}</td>
                        <td className="p-1.5 text-right font-mono">₹{p.unitPrice}</td>
                        <td className="p-1.5 pr-2 text-right font-mono font-bold">
                          ₹{p.unitPrice * p.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Billing & Balance Section */}
          <div className="border border-slate-300 rounded-lg p-2.5 sm:p-3 space-y-1.5 bg-slate-50">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Service / Repair Charge:</span>
              <span className="font-mono font-semibold">₹{serviceAmount}</span>
            </div>

            {partsTotal > 0 && (
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Parts Total:</span>
                <span className="font-mono font-semibold">₹{partsTotal}</span>
              </div>
            )}

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- ₹{order.discount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-slate-900 text-xs sm:text-sm pt-1 border-t border-slate-200">
              <span>Total Bill Amount:</span>
              <span className="font-mono">₹{finalTotal}</span>
            </div>

            <div className="flex justify-between text-slate-700 text-xs">
              <span>Advance Paid ({order.paymentMode || 'Cash'}):</span>
              <span className="font-mono font-semibold text-emerald-700">₹{order.advance}</span>
            </div>

            <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-950 pt-1.5 border-t-2 border-slate-300">
              <span>BALANCE DUE:</span>
              <span className={`font-mono ${order.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ₹{order.balance}
              </span>
            </div>
          </div>

          {/* Status & Delivery Footer */}
          <div className="pt-1 text-[10px] text-slate-500 space-y-1 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span>Status: <strong className="text-slate-900 uppercase">{order.status}</strong></span>
              {order.expectedDelivery && (
                <span>Expected: <strong className="text-slate-900">{order.expectedDelivery}</strong></span>
              )}
            </div>

            {settings.upiId && (
              <p className="text-[10px] text-slate-600">UPI Payment ID: <strong className="text-slate-900">{settings.upiId}</strong></p>
            )}

            {settings.receiptInformation && (
              <p className="text-[9px] text-slate-400 italic pt-1">{settings.receiptInformation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
