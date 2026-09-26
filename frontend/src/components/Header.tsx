import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Package,
  Search,
  Settings,
  RefreshCw,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { ShopSettings } from '../types';

interface HeaderProps {
  currentSide: 'repair' | 'stock';
  onSwitchSide: (side: 'repair' | 'stock') => void;
  settings: ShopSettings | null;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenSync: () => void;
  onOpenOnlineSheet?: () => void;
  role: 'employee' | 'owner';
  onOpenPinModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSide,
  onSwitchSide,
  settings,
  onOpenSearch,
  onOpenSettings,
  onOpenSync,
  onOpenOnlineSheet,
  role,
  onOpenPinModal,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if running in standalone PWA window
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(!!standaloneMode);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      alert(
        "📱 Install Jai Mataji Repair as Chrome Web App & Desktop Shortcut:\n\n" +
        "• Google Chrome on Computer (Windows/Mac):\n" +
        "  1. Look at the right side of the address bar for the 'Install' icon (computer monitor with download arrow) and click it.\n" +
        "  2. Or click the 3 vertical dots (⋮) in the top-right -> 'Save and share' -> 'Install Jai Mataji Mobile Repairing...'\n" +
        "  3. Click 'Install' — Chrome will immediately create a desktop shortcut with the official shop icon and launch it in app mode!\n\n" +
        "• Chrome on Android Phone / Tablet:\n" +
        "  1. Tap the 3 dots (⋮) menu in Chrome\n" +
        "  2. Tap 'Install app' or 'Add to Home screen'\n\n" +
        "• Safari on iPhone / iPad:\n" +
        "  1. Tap the Share button at bottom\n" +
        "  2. Tap 'Add to Home Screen'"
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-3 py-2 sm:px-6 sm:py-3 space-y-2.5">
        {/* ROW 1: Branding & Action Icons (Never collides or overlaps) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Shop Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight truncate leading-tight">
                {settings?.shopName || 'Jai Mataji Mobile Repairing'}
              </h1>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                <span>Talod</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Ashok Bhai: 9974298866</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Utility Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Online / Offline Sync Badge */}
            <div
              className={`hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
              }`}
              title={isOnline ? 'Online: Auto-saving every bill' : 'Offline: Changes queued locally'}
            >
              {isOnline ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? 'Auto-Sync' : 'Offline'}</span>
            </div>

            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 text-xs font-semibold transition"
              title="Search (Order ID, Customer, Mobile, Model, Part)"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Search</span>
            </button>

            {/* Install Web App & Desktop Shortcut Button */}
            {!isStandalone && (
              <button
                onClick={handleInstallApp}
                className={`px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 shadow-md shadow-blue-500/20 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition active:scale-95 ${
                  deferredPrompt ? 'animate-pulse' : ''
                }`}
                title="Install Jai Mataji Repair as Chrome Web App & Desktop Shortcut"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenSync}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700/80 transition"
              title="Google Cloud Sync & Key Manager"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Role Switcher Pill */}
            <button
              onClick={onOpenPinModal}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition ${
                role === 'owner'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Click to switch Staff / Owner PIN"
            >
              {role === 'owner' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">{role === 'owner' ? 'Owner' : 'Staff'}</span>
            </button>

            {/* Shop Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/80 transition"
              title="Shop Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROW 2: The Two Main Sides Switcher (Auto-Adjusts 50/50 on Mobile & Tablet, Never Overlaps!) */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-800/90 border border-slate-700/70 shadow-inner">
          <button
            type="button"
            onClick={() => onSwitchSide('repair')}
            className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentSide === 'repair'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span className="truncate">1. Repair & Billing</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchSide('stock')}
            className={`flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentSide === 'stock'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="truncate">2. Stock & Management</span>
            {role === 'employee' && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900/60 text-slate-300 font-mono">
                PIN
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
