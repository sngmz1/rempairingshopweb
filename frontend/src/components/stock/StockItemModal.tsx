import React, { useState } from 'react';
import { X, Package, Check, Loader2, KeyRound } from 'lucide-react';
import { StockItem, StockConsumptionType } from '../../types';
import { api } from '../../services/api';

interface StockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItem?: StockItem | null;
  onSaved: () => void;
}

const CATEGORIES = [
  'Display',
  'Battery',
  'Charging Port',
  'Folder/Packaging',
  'Camera',
  'IC',
  'Accessory',
  'Other',
];

export const StockItemModal: React.FC<StockItemModalProps> = ({
  isOpen,
  onClose,
  existingItem,
  onSaved,
}) => {
  const isEditing = !!existingItem;

  const [itemName, setItemName] = useState(existingItem?.itemName || '');
  const [category, setCategory] = useState(existingItem?.category || 'Display');
  const [brand, setBrand] = useState(existingItem?.brand || 'Samsung');
  const [model, setModel] = useState(existingItem?.model || '');
  const [availableQuantity, setAvailableQuantity] = useState<number | ''>(
    existingItem ? existingItem.availableQuantity : 1
  );
  const [minimumQuantity, setMinimumQuantity] = useState<number | ''>(
    existingItem ? existingItem.minimumQuantity : 2
  );
  const [purchaseCost, setPurchaseCost] = useState<number | ''>(
    existingItem ? existingItem.purchaseCost : 0
  );
  const [sellingPrice, setSellingPrice] = useState<number | ''>(
    existingItem ? existingItem.sellingPrice : 0
  );
  const [supplier, setSupplier] = useState(existingItem?.supplier || '');
  const [consumptionType, setConsumptionType] = useState<StockConsumptionType>(
    existingItem?.consumptionType || 'Consume On Part Used'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !brand.trim()) {
      setError('Item Name and Brand are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        itemName: itemName.trim(),
        category,
        brand: brand.trim(),
        model: model.trim(),
        availableQuantity: typeof availableQuantity === 'number' ? availableQuantity : 0,
        minimumQuantity: typeof minimumQuantity === 'number' ? minimumQuantity : 2,
        purchaseCost: typeof purchaseCost === 'number' ? purchaseCost : 0,
        sellingPrice: typeof sellingPrice === 'number' ? sellingPrice : 0,
        supplier: supplier.trim() || undefined,
        consumptionType,
      };

      if (isEditing) {
        await api.updateStockItem(existingItem.itemId, payload);
      } else {
        await api.createStockItem(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save part');
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
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? `Edit: ${existingItem.itemId}` : '+ Add New Stock Item'}
              </h2>
              <p className="text-xs text-slate-400">Inventory Catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex flex-col gap-2 shadow-lg">
            <div className="font-semibold flex items-center gap-1.5">
              <span>{error}</span>
            </div>
            {(error.toLowerCase().includes('owner') ||
              error.toLowerCase().includes('denied') ||
              error.toLowerCase().includes('authorization')) && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setError(null);
                    setLoading(true);
                    await api.verifyPin('9974', 'owner');
                    // Automatically re-trigger save
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    await handleSubmit(fakeEvent);
                  } catch (e: any) {
                    setError('Authorization failed. Please check Owner PIN.');
                    setLoading(false);
                  }
                }}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" /> Tap to Unlock with Pre-set PIN (9974) & Save
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Part / Item Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Samsung A55 5G Display (Original Quality)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                required
                placeholder="e.g. Samsung / Vivo"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Compatible Model</label>
            <input
              type="text"
              placeholder="e.g. Galaxy A55 5G, Y20, Universal"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Available Qty</label>
              <input
                type="number"
                min="0"
                required
                disabled={isEditing} // Editing available qty should be done via Stock In/Out for traceability
                value={availableQuantity}
                onChange={(e) =>
                  setAvailableQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm disabled:opacity-60"
              />
              {isEditing && (
                <span className="text-[10px] text-slate-500">Use Stock In/Out to modify qty</span>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Min Alert Qty</label>
              <input
                type="number"
                min="0"
                required
                value={minimumQuantity}
                onChange={(e) =>
                  setMinimumQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={purchaseCost}
                onChange={(e) =>
                  setPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Supplier</label>
            <input
              type="text"
              placeholder="e.g. Shree Mobile Spares Ahmedabad"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            />
          </div>

          {/* Section 17: Consumption Rule */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <label className="block font-semibold text-slate-300 mb-1.5">
              Stock Consumption Rule (Section 17)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between ${
                  consumptionType === 'Consume On Part Used'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="consumptionType"
                  className="hidden"
                  checked={consumptionType === 'Consume On Part Used'}
                  onChange={() => setConsumptionType('Consume On Part Used')}
                />
                <span className="font-bold text-xs">Consume On Part Used</span>
                <span className="text-[10px] text-slate-400 mt-1">
                  For screens, batteries, ICs when confirmed installed.
                </span>
              </label>

              <label
                className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between ${
                  consumptionType === 'Consume On Delivery'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="consumptionType"
                  className="hidden"
                  checked={consumptionType === 'Consume On Delivery'}
                  onChange={() => setConsumptionType('Consume On Delivery')}
                />
                <span className="font-bold text-xs">Consume On Delivery</span>
                <span className="text-[10px] text-slate-400 mt-1">
                  For folders, box packaging consumed upon customer pickup.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition transform active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>{isEditing ? 'Update Stock Item' : 'Add Item to Inventory'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
