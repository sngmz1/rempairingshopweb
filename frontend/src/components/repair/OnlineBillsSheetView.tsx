import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Search,
  Phone,
  Wifi,
  WifiOff,
  Check,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api';

interface SingleRowBill {
  rowNumber: number;
  orderId: string;
  customerName: string;
  customerMobile: string;
  device: string;
  complaint: string;
  pickupReceivedDateTime: string;
  deliveryDateTime: string;
  status: string;
  estimatedAmount: number;
  finalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentMode: string;
  paymentStatus: string;
  partsUsed: string;
  billPdfLink: string;
  technician: string;
  syncStatus: string;
}

interface OnlineBillsSheetViewProps {
  onSelectOrder?: (order: any) => void;
  onOpenNewRepair?: () => void;
}

export const OnlineBillsSheetView: React.FC<OnlineBillsSheetViewProps> = ({
  onSelectOrder,
  onOpenNewRepair,
}) => {
  const [rows, setRows] = useState<SingleRowBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Monitor live internet connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadOnlineBills();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOnlineBills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/online-bills').then((r) => r.json());
      if (res.success && res.data) {
        setRows(res.data.rows || []);
      }
    } catch (err) {
      console.error('Failed to load customer bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      setSyncSuccessMsg(null);
      const res = await fetch('/api/online-bills/sync-all', { method: 'POST' }).then((r) =>
        r.json()
      );
      if (res.success) {
        setSyncSuccessMsg(res.message);
        await loadOnlineBills();
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRowClick = async (orderId: string) => {
    if (onSelectOrder) {
      try {
        const order = await api.getRepairById(orderId);
        onSelectOrder(order);
      } catch (err) {
        console.error('Failed to open order:', err);
      }
    }
  };

  const handleCopyTable = () => {
    if (rows.length === 0) return;

    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Mobile',
      'Device (Brand & Model)',
      'Reported Problem',
      'Pickup/Received Date & Time (Auto)',
      'Delivered Date & Time (Auto)',
      'Current Status',
      'Repair Amount (₹)',
      'Advance Paid (₹)',
      'Remaining Balance (₹)',
      'Payment Mode',
      'Parts Replaced / Installed',
      'Technician / Handled By',
      'Bill PDF Link',
    ];

    const tsvRows = rows.map((r) =>
      [
        r.orderId,
        r.customerName,
        r.customerMobile,
        r.device,
        r.complaint,
        r.pickupReceivedDateTime,
        r.deliveryDateTime,
        r.status,
        r.finalAmount,
        r.advancePaid,
        r.balanceDue,
        r.paymentMode,
        r.partsUsed,
        r.technician,
        window.location.origin + r.billPdfLink,
      ].join('\t')
    );

    const tsvData = [headers.join('\t'), ...tsvRows].join('\n');
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.customerMobile.includes(q) ||
      r.orderId.toLowerCase().includes(q) ||
      r.device.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  const totalAmount = rows.reduce((acc, r) => acc + r.finalAmount, 0);
  const totalAdvance = rows.reduce((acc, r) => acc + r.advancePaid, 0);
  const totalBalance = rows.reduce((acc, r) => acc + r.balanceDue, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner: Shop Customer Data & Auto-Storage Status */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Shop Customer Repair Bills (1 Row Per Customer)
                </h2>
                {/* Live Online Connection Badge */}
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                    isOnline
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>Online • Auto-Saving Bills</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-400" />
                      <span>Offline (Queued)</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every repair records customer details, automatic pickup timestamp, and delivery timestamp in one clean row.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy for Google Sheets */}
            <button
              onClick={handleCopyTable}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition active:scale-95"
              title="Copy customer rows to clipboard to paste straight into Google Sheets or Excel"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Customer Data!' : 'Copy Customer Rows'}</span>
            </button>

            {/* Download CSV */}
            <a
              href="/api/online-bills/csv"
              download
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel/CSV</span>
            </a>

            {/* Open blank Google Sheet */}
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Open a new blank Google Sheet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Google Sheet</span>
            </a>

            {/* Force Sync */}
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              title="Sync now"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {syncSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Customer Data Assurance & Quick Action */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="text-xl">📱</span>
          <div>
            <p className="font-bold text-white text-sm">Jai Mataji Mobile Repairing — Customer Bills & Records</p>
            <p className="text-[11px] text-slate-400">
              100% genuine shop customer data (no test/student templates). Automatically tracks Counter Pickup & Handover Delivery times.
            </p>
          </div>
        </div>
        {onOpenNewRepair && (
          <button
            onClick={onOpenNewRepair}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Customer Repair Bill</span>
          </button>
        )}
      </div>

      {/* KPI Stats for Shop Owner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="glass-card p-3 rounded-xl border-slate-800">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Customer Repairs</span>
          <span className="text-xl font-extrabold text-white mt-0.5 block">{rows.length}</span>
        </div>
        <div className="glass-card p-3 rounded-xl border-slate-800">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Bill Amount</span>
          <span className="text-xl font-extrabold text-blue-400 mt-0.5 block">₹{totalAmount}</span>
        </div>
        <div className="glass-card p-3 rounded-xl border-slate-800">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Advance Received</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">₹{totalAdvance}</span>
        </div>
        <div className="glass-card p-3 rounded-xl border-slate-800">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Balance Due</span>
          <span className="text-xl font-extrabold text-amber-400 mt-0.5 block">₹{totalBalance}</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Customer Name, Mobile Number, Order ID, Device Model, or Status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* The Single-Row Customer Bills Table (Clean Shop Data) */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[65vh] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-700 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Customer Mobile</th>
                <th className="py-3 px-3">Device (Brand & Model)</th>
                <th className="py-3 px-3 max-w-xs">Reported Problem</th>
                <th className="py-3 px-3">Pickup/Received Time (Auto)</th>
                <th className="py-3 px-3">Delivery Time (Auto)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Repair Amount (₹)</th>
                <th className="py-3 px-3 text-right">Paid (₹)</th>
                <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Parts Replaced</th>
                <th className="py-3 px-3">Handled By</th>
                <th className="py-3 px-3 text-center">PDF Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-10 text-center text-slate-400">
                    Loading customer repair bills...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-10 text-center text-slate-400">
                    No customer repairs found matching your search.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.orderId}
                    onClick={() => handleRowClick(row.orderId)}
                    className="hover:bg-slate-800/70 transition-colors group cursor-pointer"
                    title="Click to view or edit customer repair order & job card"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">{row.rowNumber}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400 bg-blue-950/20 underline decoration-blue-500/40">{row.orderId}</td>
                    <td className="py-2.5 px-3 font-bold text-white group-hover:text-blue-300">{row.customerName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      <a
                        href={`tel:${row.customerMobile}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{row.customerMobile}</span>
                      </a>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{row.device}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={row.complaint}>
                      {row.complaint}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>{row.pickupReceivedDateTime}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {row.deliveryDateTime.startsWith('Pending') ? (
                        <span className="text-amber-400 font-medium">{row.deliveryDateTime}</span>
                      ) : row.deliveryDateTime === 'In Progress' ? (
                        <span className="text-blue-300 font-medium">In Progress</span>
                      ) : (
                        <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{row.deliveryDateTime}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.status === 'Delivered'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : row.status === 'Ready'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : 'bg-blue-950 text-blue-300 border-blue-500/50'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white font-mono">₹{row.finalAmount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">₹{row.advancePaid}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span
                        className={`font-extrabold ${
                          row.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        ₹{row.balanceDue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{row.paymentMode}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={row.partsUsed}>
                      {row.partsUsed}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{row.technician}</td>
                    <td className="py-2.5 px-3 text-center">
                      <a
                        href={row.billPdfLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.8 rounded bg-slate-800 hover:bg-slate-750 text-blue-400 text-[11px] font-semibold border border-slate-700 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
