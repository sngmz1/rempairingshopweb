import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HardDrive,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  ExternalLink,
  Key,
  Link,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { api } from '../../services/api';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
  onOpenOnlineSheet?: () => void;
}

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  onOpenOnlineSheet,
}) => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'push' | 'pull' | 'save' | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Direct Sheet URL / ID Input
  const [sheetInput, setSheetInput] = useState('');
  const [showCredentialsInput, setShowCredentialsInput] = useState(false);
  const [credentialsJson, setCredentialsJson] = useState('');
  const [copiedData, setCopiedData] = useState(false);

  const handleCopyCustomerSheet = async () => {
    try {
      const res = await fetch('/api/online-bills').then((r) => r.json());
      if (res.success && res.data && res.data.rows) {
        const rows = res.data.rows;
        const headers = [
          'Order ID',
          'Customer Name',
          'Customer Mobile',
          'Device (Brand & Model)',
          'Reported Problem',
          'Pickup/Received Time (Auto)',
          'Delivery Time (Auto)',
          'Current Status',
          'Repair Amount (₹)',
          'Advance Paid (₹)',
          'Balance Due (₹)',
          'Payment Mode',
          'Parts Replaced',
          'Technician',
          'PDF Bill Link',
        ];
        const tsvRows = rows.map((r: any) =>
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
        const tsv = [headers.join('\t'), ...tsvRows].join('\n');
        navigator.clipboard.writeText(tsv);
        setCopiedData(true);
        setTimeout(() => setCopiedData(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getSyncStatus();
      if (data) {
        setSyncStatus(data);
        if (data.sheetId) {
          setSheetInput(data.sheetId);
        }
      }
    } catch (err: any) {
      console.error('Error fetching sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSheetId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) {
      setMessage({ text: 'Please enter a Google Sheet URL or ID', type: 'error' });
      return;
    }

    try {
      setActionLoading('save');
      setMessage(null);
      const res = await api.saveSheetId(sheetInput.trim());

      if (res && res.success) {
        setMessage({
          text: `Google Sheet connected successfully! (ID: ${res.sheetId})`,
          type: 'success',
        });
        await loadStatus();
        if (onSyncComplete) onSyncComplete();
      } else {
        setMessage({ text: (res && res.message) || 'Failed to save Sheet ID', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error saving Google Sheet ID', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsJson.trim()) return;

    try {
      setActionLoading('save');
      setMessage(null);
      const res = await api.saveCredentials(credentialsJson.trim());

      if (res && res.success) {
        setMessage({ text: res.message, type: 'success' });
        setCredentialsJson('');
        setShowCredentialsInput(false);
        await loadStatus();
      } else {
        setMessage({ text: (res && res.message) || 'Invalid credentials format', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error saving credentials', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePush = async () => {
    if (!syncStatus?.sheetId) {
      setMessage({
        text: 'Please paste your Google Sheet URL or ID below and click "Save & Connect Sheet" first.',
        type: 'error',
      });
      return;
    }

    try {
      setActionLoading('push');
      setMessage(null);
      const res = await api.syncToGoogleSheets();
      setMessage({ text: res.message || 'Synced successfully to Google Sheets!', type: 'success' });
      await loadStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Unable to sync right now. Please check Sheet ID.',
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePull = async () => {
    if (!syncStatus?.sheetId) {
      setMessage({
        text: 'Please paste your Google Sheet URL or ID below and click "Save & Connect Sheet" first.',
        type: 'error',
      });
      return;
    }

    try {
      setActionLoading('pull');
      setMessage(null);
      const res = await api.pullFromGoogleSheets();
      setMessage({
        text: res.message || 'Successfully pulled latest changes from Google Sheets!',
        type: 'success',
      });
      await loadStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setMessage({ text: err.message || 'Unable to sync right now. Please try again.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[92vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Google Sheets & Drive Sync
              </h2>
              <p className="text-xs text-slate-400">Section 19-23: Safe Business Cloud Synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Direct Google Sheet Input Box (Connect Sheet in 1 Click) */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              <span>Connect Your Google Sheet</span>
            </label>
            {syncStatus?.sheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${syncStatus.sheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <form onSubmit={handleSaveSheetId} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Paste Google Sheet URL (https://docs.google.com/spreadsheets/d/...) or ID"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={actionLoading === 'save'}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition disabled:opacity-50"
              >
                {actionLoading === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save & Connect</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create New Sheet (sheets.new)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyCustomerSheet}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedData ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedData ? 'Copied Shop Customers!' : 'Copy Customer Rows to Clipboard'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              💡 100% Pure Shop Data: Connects strictly to Jai Mataji Mobile Repairing customer orders, auto pickup & delivery timestamps, and shop parts (no student or test templates).
            </p>
          </form>
        </div>

        {/* 2. Google Cloud Service Account Status */}
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Google Cloud Service Account</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                syncStatus?.hasServiceAccount
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}
            >
              {syncStatus?.hasServiceAccount ? 'Connected ✓' : 'Ready / Optional'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {syncStatus?.hasServiceAccount
              ? 'Secure server-side credentials active. Synchronization is performed safely over encrypted HTTPS.'
              : 'Add your service account JSON below or connect directly with Google Sheet link.'}
          </p>
        </div>

        {/* 3. Sync Action Buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handlePush}
            disabled={actionLoading !== null}
            className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
          >
            {actionLoading === 'push' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            )}
            <span>Sync to Google Sheets</span>
            <span className="text-[10px] font-normal text-emerald-100">Export local shop records</span>
          </button>

          <button
            onClick={handlePull}
            disabled={actionLoading !== null}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            {actionLoading === 'pull' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowDown className="w-5 h-5 text-blue-400 stroke-[2.5]" />
            )}
            <span>Pull from Google Sheets</span>
            <span className="text-[10px] font-normal text-slate-400">Import bulk edits/parts from sheet</span>
          </button>
        </div>

        {/* 4. One-Row Online Sheet Shortcut */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <h4 className="font-bold text-white">Online Bills Sheet (1 Row Per Customer)</h4>
            <p className="text-[11px] text-slate-400">View all customer repair bills in a simple, clean table</p>
          </div>
          {onOpenOnlineSheet && (
            <button
              onClick={() => {
                onClose();
                onOpenOnlineSheet();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-xs transition"
            >
              Open Sheet 📄
            </button>
          )}
        </div>

        {/* 5. Optional Advanced: Paste Service Account JSON */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowCredentialsInput(!showCredentialsInput)}
            className="text-[11px] text-slate-400 hover:text-slate-300 font-semibold flex items-center gap-1"
          >
            <span>{showCredentialsInput ? 'Hide' : '+ Advanced: Paste Google Service Account JSON'}</span>
            {showCredentialsInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showCredentialsInput && (
            <form onSubmit={handleSaveCredentials} className="mt-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <label className="block text-slate-300 font-semibold">
                Paste Service Account JSON Key:
              </label>
              <textarea
                rows={3}
                placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
                value={credentialsJson}
                onChange={(e) => setCredentialsJson(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading === 'save' || !credentialsJson.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
