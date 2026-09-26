import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'employee' | 'owner';
  onSuccess: (role: 'employee' | 'owner') => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (pinToTest?: string) => {
    const value = pinToTest !== undefined ? pinToTest : pin;
    if (!value) return;

    try {
      setLoading(true);
      setError(null);
      await api.verifyPin(value, targetRole);
      onSuccess(targetRole);
      setPin('');
      onClose();
    } catch (err: any) {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-xs rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-slate-700 text-center">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white">
          {targetRole === 'owner' ? 'Owner Access PIN' : 'Staff Verification'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {targetRole === 'owner' ? 'Enter 4-digit Owner PIN' : 'Enter 4-digit Staff PIN'}{' '}
          <span className="text-amber-400 font-semibold">(Pre-set: 9974)</span>
        </p>

        <button
          type="button"
          onClick={() => {
            setPin('9974');
            handleVerify('9974');
          }}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <KeyRound className="w-3.5 h-3.5" /> Quick Fill (9974)
        </button>

        {error && <div className="mt-2 text-rose-400 text-xs font-semibold">{error}</div>}

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 my-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > i
                  ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                  : 'border-slate-600 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-600 text-white font-bold text-lg border border-slate-700/80 shadow-sm transition active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-12 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs border border-slate-700/60 flex items-center justify-center transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-600 text-white font-bold text-lg border border-slate-700/80 shadow-sm transition active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || pin.length === 0}
            className="w-16 h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center transition disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter'}
          </button>
        </div>
      </div>
    </div>
  );
};
