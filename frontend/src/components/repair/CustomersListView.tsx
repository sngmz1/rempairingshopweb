import React, { useState } from 'react';
import { Customer, RepairOrder } from '../../types';
import { Search, User, Phone, Wrench, Calendar, ChevronRight, X } from 'lucide-react';
import { api } from '../../services/api';

interface CustomersListViewProps {
  customers: Customer[];
  onSelectOrder: (order: RepairOrder) => void;
}

export const CustomersListView: React.FC<CustomersListViewProps> = ({
  customers,
  onSelectOrder,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<RepairOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.customerId.toLowerCase().includes(q)
    );
  });

  const handleOpenCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      setLoadingHistory(true);
      const res = await api.getCustomerDetails(cust.customerId);
      setHistory(res.repairHistory || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers by Name, Mobile Number, or Customer ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm shadow-sm"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cust) => (
          <div
            key={cust.customerId}
            onClick={() => handleOpenCustomer(cust)}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                  {cust.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{cust.mobile}</p>
                <span className="text-[10px] text-slate-500 font-mono">{cust.customerId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${cust.mobile}`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
              >
                <Phone className="w-4 h-4" />
              </a>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-10 rounded-2xl text-center border-slate-800">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-semibold text-base">No customers found</p>
          <p className="text-slate-500 text-xs mt-1">Customers are auto-saved when new repairs are created.</p>
        </div>
      )}

      {/* Customer Detail & Repair History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-modal w-full max-w-xl rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                <p className="text-xs font-mono text-slate-400">{selectedCustomer.mobile}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span>Previous Repair History ({history.length})</span>
              </h4>

              {loadingHistory ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading repair history...</div>
              ) : history.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                  No previous repairs found for this customer.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map((order) => (
                    <div
                      key={order.orderId}
                      onClick={() => {
                        setSelectedCustomer(null);
                        onSelectOrder(order);
                      }}
                      className="cursor-pointer p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">{order.orderId}</span>
                          <span className="px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {order.status}
                          </span>
                        </div>
                        <p className="font-semibold text-white mt-1">
                          {order.brand} {order.model}
                        </p>
                        <p className="text-slate-400 text-[11px] line-clamp-1">{order.complaint}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-white">₹{order.finalAmount || order.estimatedAmount}</div>
                        <span className="text-[11px] text-blue-400">View →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
