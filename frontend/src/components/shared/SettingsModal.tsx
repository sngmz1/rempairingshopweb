import React, { useState } from 'react';
import { X, Settings, Check, Loader2, Store, Phone, MapPin, QrCode } from 'lucide-react';
import { ShopSettings } from '../../types';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSettingsSaved: (updated: ShopSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsSaved,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [contact1Name, setContact1Name] = useState(settings.contact1Name);
  const [contact1Number, setContact1Number] = useState(settings.contact1Number);
  const [contact2Name, setContact2Name] = useState(settings.contact2Name);
  const [contact2Number, setContact2Number] = useState(settings.contact2Number);
  const [address, setAddress] = useState(settings.address);
  const [serviceDescription, setServiceDescription] = useState(settings.serviceDescription);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [receiptInformation, setReceiptInformation] = useState(settings.receiptInformation);
  const [googleSheetId, setGoogleSheetId] = useState(settings.googleSheetId || '');
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState(settings.googleDriveFolderId || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const updated = await api.updateSettings({
        shopName: shopName.trim(),
        contact1Name: contact1Name.trim(),
        contact1Number: contact1Number.trim(),
        contact2Name: contact2Name.trim(),
        contact2Number: contact2Number.trim(),
        address: address.trim(),
        serviceDescription: serviceDescription.trim(),
        upiId: upiId.trim(),
        receiptInformation: receiptInformation.trim(),
        googleSheetId: googleSheetId.trim(),
        googleDriveFolderId: googleDriveFolderId.trim(),
      });
      setSuccess(true);
      onSettingsSaved(updated);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[92vh] overflow-y-auto border border-slate-700">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Shop Settings</h2>
              <p className="text-xs text-slate-400">Customizable shop details for bills & receipts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mt-3 p-3 rounded-xl bg-rose-950/50 text-rose-300 text-xs">{error}</div>}
        {success && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/50 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Shop Name</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact 1 Name</label>
              <input
                type="text"
                value={contact1Name}
                onChange={(e) => setContact1Name(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact 1 Number</label>
              <input
                type="tel"
                value={contact1Number}
                onChange={(e) => setContact1Number(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact 2 Name</label>
              <input
                type="text"
                value={contact2Name}
                onChange={(e) => setContact2Name(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact 2 Number</label>
              <input
                type="tel"
                value={contact2Number}
                onChange={(e) => setContact2Number(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Shop Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Service Description</label>
            <input
              type="text"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Shop UPI ID (for QR/Payment)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9974298866@upi"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Google Sheet ID</label>
              <input
                type="text"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
                placeholder="Spreadsheet ID from Google Sheets URL"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Receipt Footer Note</label>
            <textarea
              rows={2}
              value={receiptInformation}
              onChange={(e) => setReceiptInformation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              <span>Save Shop Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
