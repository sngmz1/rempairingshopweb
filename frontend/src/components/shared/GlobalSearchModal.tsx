import React, { useState, useEffect } from 'react';
import { Search, X, Smartphone, User, Package, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { RepairOrder, Customer, StockItem } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: RepairOrder) => void;
  onSelectPart?: (part: StockItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onSelectPart,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    orders: RepairOrder[];
    customers: Customer[];
    parts: StockItem[];
  }>({ orders: [], customers: [], parts: [] });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ orders: [], customers: [], parts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults =
    results.orders.length > 0 || results.customers.length > 0 || results.parts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-5 text-white shadow-2xl mt-4 sm:mt-10 max-h-[85vh] overflow-y-auto border border-slate-700">
        {/* Search Input Bar */}
        <div className="relative flex items-center pb-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search Order ID, Customer Name, Mobile, Model, or Part Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white text-base sm:text-lg placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-2 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="mt-4 space-y-4">
          {!query.trim() && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type to search repairs by order number, mobile number, customer name, device brand/model, or parts.
            </div>
          )}

          {query.trim() && !loading && !hasResults && (
            <div className="p-6 text-center text-slate-400 text-xs">
              No matching orders, customers, or parts found for "{query}".
            </div>
          )}

          {/* Section 25: Matching Repair Orders */}
          {results.orders.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>Repair Orders ({results.orders.length})</span>
              </h4>

              <div className="space-y-2">
                {results.orders.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className="cursor-pointer p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900 lowercase">
                          {order.orderId}
                        </span>
                        <span className="font-semibold text-white group-hover:text-blue-300">
                          {order.customerName}
                        </span>
                        <span className="text-slate-400 font-mono">({order.customerMobile})</span>
                      </div>

                      <p className="text-slate-300 font-medium mt-1">
                        {order.brand} {order.model}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                          {order.status}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400">
                          Balance: <strong className={order.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}>₹{order.balance}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {order.billDriveLink && (
                        <a
                          href={order.billDriveLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Bill</span>
                        </a>
                      )}
                      <span className="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        Open →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Parts */}
          {results.parts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Stock Parts ({results.parts.length})</span>
              </h4>

              <div className="space-y-2">
                {results.parts.map((part) => (
                  <div
                    key={part.itemId}
                    onClick={() => {
                      if (onSelectPart) onSelectPart(part);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{part.itemName}</span>
                      <p className="text-slate-400 text-[11px]">
                        {part.brand} {part.model} • {part.category}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">Qty: {part.availableQuantity}</span>
                      <p className="text-slate-400 text-[11px]">Price: ₹{part.sellingPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
