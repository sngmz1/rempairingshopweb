import React, { useState } from 'react';
import {
  RepairOrder,
  RepairStatus,
} from '../../types';
import { Search, Phone, MessageCircle, ExternalLink, Calendar, Wrench, IndianRupee, FileText } from 'lucide-react';

interface OrdersListViewProps {
  orders: RepairOrder[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onSelectOrder: (order: RepairOrder) => void;
  onViewBill?: (order: RepairOrder) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ALL_STATUSES: { key: string; label: string; countColor: string }[] = [
  { key: 'all', label: 'All Orders', countColor: 'text-slate-300' },
  { key: 'Received', label: 'Received', countColor: 'text-blue-400' },
  { key: 'Checking', label: 'Checking', countColor: 'text-purple-400' },
  { key: 'Waiting for Approval', label: 'Waiting Approval', countColor: 'text-yellow-400' },
  { key: 'Approved', label: 'Approved', countColor: 'text-emerald-400' },
  { key: 'Repairing', label: 'Repairing', countColor: 'text-indigo-400' },
  { key: 'Waiting for Part', label: 'Waiting for Part', countColor: 'text-amber-400' },
  { key: 'Ready', label: 'Ready', countColor: 'text-emerald-400' },
  { key: 'Delivered', label: 'Delivered', countColor: 'text-slate-400' },
  { key: 'Cancelled', label: 'Cancelled', countColor: 'text-rose-400' },
  { key: 'Unable to Repair', label: 'Unable to Repair', countColor: 'text-rose-400' },
];

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  selectedStatus,
  onSelectStatus,
  onSelectOrder,
  onViewBill,
  searchQuery,
  onSearchChange,
}) => {
  const getStatusBadge = (status: RepairStatus) => {
    switch (status) {
      case 'Ready':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50';
      case 'Repairing':
        return 'bg-blue-950/70 text-blue-300 border-blue-500/50';
      case 'Waiting for Part':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/50';
      case 'Delivered':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'Cancelled':
      case 'Unable to Repair':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/50';
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name, Mobile Number, or Model..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontal Predefined Status Filter Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {ALL_STATUSES.map((st) => {
          const isSelected = selectedStatus.toLowerCase() === st.key.toLowerCase();
          const count =
            st.key === 'all'
              ? orders.length
              : orders.filter((o) => o.status.toLowerCase() === st.key.toLowerCase()).length;

          return (
            <button
              key={st.key}
              onClick={() => onSelectStatus(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750 border border-slate-700/60'
              }`}
            >
              <span>{st.label}</span>
              {st.key !== 'all' && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 ' + st.countColor
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List Cards (Mobile-first) */}
      {orders.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl text-center border-slate-800">
          <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-semibold text-base">No orders found</p>
          <p className="text-slate-500 text-xs mt-1">Try switching filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            return (
              <div
                key={order.orderId}
                onClick={() => onSelectOrder(order)}
                className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left Section */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.8 rounded-lg border border-blue-900/60">
                      {order.orderId}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.receivedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                      {order.customerName}
                    </h3>
                    <p className="text-xs font-semibold text-slate-300">
                      {order.brand} {order.model}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    <span className="text-slate-500">Problem:</span> {order.complaint}
                  </p>
                </div>

                {/* Right Section: Amounts & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 gap-1.5 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-slate-400">
                      Final: ₹{order.finalAmount || order.estimatedAmount}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">Balance:</span>
                      <span
                        className={`text-sm font-bold ${
                          order.balance > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        ₹{order.balance}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <a
                      href={`tel:${order.customerMobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/91${order.customerMobile.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewBill) {
                          onViewBill(order);
                        } else {
                          onSelectOrder(order);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                      title="View Bill"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Bill</span>
                    </button>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                      Details →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
