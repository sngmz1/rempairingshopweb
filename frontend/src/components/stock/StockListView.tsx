import React, { useState } from 'react';
import { StockItem } from '../../types';
import {
  Package,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  AlertTriangle,
  Search,
  Users,
  RefreshCw,
  Edit2,
} from 'lucide-react';

interface StockListViewProps {
  stock: StockItem[];
  onOpenStockIn: (item?: StockItem) => void;
  onOpenStockOut: (item?: StockItem) => void;
  onOpenAddPart: () => void;
  onOpenEditPart: (item: StockItem) => void;
  onOpenMovements: () => void;
  onOpenSuppliers: () => void;
  onOpenSync: () => void;
}

const CATEGORIES = [
  'All',
  'Display',
  'Battery',
  'Charging Port',
  'Folder/Packaging',
  'Camera',
  'IC',
  'Accessory',
  'Other',
];

export const StockListView: React.FC<StockListViewProps> = ({
  stock,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAddPart,
  onOpenEditPart,
  onOpenMovements,
  onOpenSuppliers,
  onOpenSync,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  const lowStockItems = stock.filter((s) => s.availableQuantity <= s.minimumQuantity);
  const totalValue = stock.reduce((acc, s) => acc + s.availableQuantity * s.purchaseCost, 0);

  const filtered = stock.filter((s) => {
    const matchesCat =
      selectedCategory === 'All' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.itemName.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.model.toLowerCase().includes(q) ||
      s.itemId.toLowerCase().includes(q);
    const matchesLowStock = !showOnlyLowStock || s.availableQuantity <= s.minimumQuantity;

    return matchesCat && matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddPart}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Part</span>
          </button>

          <button
            onClick={() => onOpenStockIn()}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Stock In</span>
          </button>

          <button
            onClick={() => onOpenStockOut()}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Stock Out</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMovements}
            className="p-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Stock Movement Log"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Movements</span>
          </button>

          <button
            onClick={onOpenSuppliers}
            className="p-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Suppliers"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Suppliers</span>
          </button>

          <button
            onClick={onOpenSync}
            className="p-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Google Sheet Sync"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sheets Sync</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3.5 rounded-2xl border-slate-800">
          <div className="text-slate-400 text-xs font-semibold">Total Stock Items</div>
          <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stock.length}</div>
        </div>

        <div
          onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
          className={`cursor-pointer glass-card p-3.5 rounded-2xl border transition ${
            showOnlyLowStock || lowStockItems.length > 0
              ? 'border-yellow-500/50 bg-yellow-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-yellow-400 text-xs font-semibold">
            <span>Low Stock Alert</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-300 mt-1">
            {lowStockItems.length}
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border-slate-800">
          <div className="text-slate-400 text-xs font-semibold">Stock Valuation</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">₹{totalValue}</div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parts by Name, Brand, Model, or Part ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Cards (Mobile First) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const isLow = item.availableQuantity <= item.minimumQuantity;

          return (
            <div
              key={item.itemId}
              className={`glass-card p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isLow ? 'border-yellow-500/50 bg-yellow-950/10' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] text-slate-400">{item.itemId}</span>
                    <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.brand} {item.model} • <span className="text-blue-400">{item.category}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenEditPart(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Edit Part"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stock Quantity Highlight */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">AVAILABLE</span>
                    <span
                      className={`text-xl font-extrabold ${
                        isLow ? 'text-yellow-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.availableQuantity}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      (Min: {item.minimumQuantity})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">SELL PRICE</span>
                    <span className="text-sm font-bold text-white">₹{item.sellingPrice}</span>
                    <span className="text-[10px] text-slate-500 block">Cost: ₹{item.purchaseCost}</span>
                  </div>
                </div>

                {/* Consumption rule tag */}
                <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Rule:</span>
                  <span className="text-blue-300 bg-slate-800 px-2 py-0.5 rounded">
                    {item.consumptionType}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => onOpenStockIn(item)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ In</span>
                </button>

                <button
                  onClick={() => onOpenStockOut(item)}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>- Out</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-10 rounded-2xl text-center border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-semibold text-base">No parts match criteria</p>
          <p className="text-slate-500 text-xs mt-1">Tap "+ Add Part" to add new inventory.</p>
        </div>
      )}
    </div>
  );
};
