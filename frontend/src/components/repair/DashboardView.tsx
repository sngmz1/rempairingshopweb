import React from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Package,
  Plus,
  Search,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { DashboardStats, RepairOrder } from '../../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentOrders: RepairOrder[];
  onOpenNewRepair: () => void;
  onOpenSearch: () => void;
  onOpenQuickPayment: () => void;
  onSwitchToStock: () => void;
  onSelectOrder: (order: RepairOrder) => void;
  onViewBill?: (order: RepairOrder) => void;
  onFilterStatus: (status: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentOrders,
  onOpenNewRepair,
  onOpenSearch,
  onOpenQuickPayment,
  onSwitchToStock,
  onSelectOrder,
  onViewBill,
  onFilterStatus,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Big Quick Actions (Section 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenNewRepair}
          className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 transition-all transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">+ New Repair</span>
          <span className="text-xs text-blue-100 font-medium">Create Job Card</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 hover:border-slate-600 shadow-md transition-all transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-700/80 flex items-center justify-center mb-2.5">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">Search Order</span>
          <span className="text-xs text-slate-400">By Mobile or ID</span>
        </button>

        <button
          onClick={onOpenQuickPayment}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 hover:border-slate-600 shadow-md transition-all transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">Add Payment</span>
          <span className="text-xs text-emerald-400">Cash / UPI / Card</span>
        </button>

        <button
          onClick={onSwitchToStock}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 hover:border-slate-600 shadow-md transition-all transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-2.5">
            <Package className="w-6 h-6 text-amber-400" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">Stock</span>
          <span className="text-xs text-amber-400">Parts & Inventory</span>
        </button>
      </div>

      {/* Metrics Section (Section 5: Only required metrics) */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Shop Status Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Today's Repairs */}
          <div
            onClick={() => onFilterStatus('all')}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-blue-500/50 transition-all hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Today's Repairs</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.todaysRepairs ?? 0}
            </div>
            <div className="text-[11px] text-blue-400 mt-1 font-medium">Received today</div>
          </div>

          {/* Repairing */}
          <div
            onClick={() => onFilterStatus('Repairing')}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-indigo-500/50 transition-all hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Repairing</span>
              <Wrench className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.repairing ?? 0}
            </div>
            <div className="text-[11px] text-indigo-400 mt-1 font-medium">On the workbench</div>
          </div>

          {/* Ready for Pickup */}
          <div
            onClick={() => onFilterStatus('Ready')}
            className="cursor-pointer glass-card p-4 rounded-2xl border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold">Ready for Pickup</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
              {stats?.readyForPickup ?? 0}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Ready to deliver</div>
          </div>

          {/* Pending Pickup */}
          <div
            onClick={() => onFilterStatus('Approved')}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-amber-500/50 transition-all hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Pending Pickup</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
              {stats?.pendingPickup ?? 0}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 font-medium">Awaiting action</div>
          </div>

          {/* Pending Payment */}
          <div
            onClick={() => onFilterStatus('all')}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-rose-500/50 transition-all hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Pending Payment</span>
              <IndianRupee className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
              {stats?.pendingPayment ?? 0}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1 font-medium">Balance due</div>
          </div>

          {/* Low Stock */}
          <div
            onClick={onSwitchToStock}
            className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-yellow-500/50 transition-all hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Low Stock</span>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-yellow-300">
              {stats?.lowStockCount ?? 0}
            </div>
            <div className="text-[11px] text-yellow-400/80 mt-1 font-medium">Needs reorder</div>
          </div>
        </div>
      </div>

      {/* Active Work In Shop Feed */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Recent Repair Orders</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {recentOrders.length}
            </span>
          </h2>
          <button
            onClick={() => onFilterStatus('all')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center border-slate-800">
            <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-base">No repair orders in queue</p>
            <p className="text-slate-500 text-xs mt-1">Tap "+ New Repair" to receive a customer's device.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentOrders.slice(0, 6).map((order) => {
              const statusColor =
                order.status === 'Ready'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : order.status === 'Repairing'
                  ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                  : order.status === 'Delivered'
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300';

              return (
                <div
                  key={order.orderId}
                  onClick={() => onSelectOrder(order)}
                  className="cursor-pointer glass-card p-4 rounded-2xl border-slate-800 hover:border-slate-700 hover:bg-slate-800/90 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Header: ID + Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-900/60 lowercase tracking-tight">
                        {order.orderId}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Customer & Device */}
                    <div className="mt-2">
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                          {order.customerName}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${order.customerMobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition shadow-sm"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/91${order.customerMobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition shadow-sm"
                            title="WhatsApp Customer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 mt-0.5">
                        {order.brand} {order.model}
                      </p>
                    </div>

                    {/* Complaint */}
                    <div className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 font-medium">Problem: </span>
                      {order.complaint}
                    </div>
                  </div>

                  {/* Financial & Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Balance: </span>
                      <span
                        className={`font-bold ${
                          order.balance > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        ₹{order.balance}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
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
                        className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition active:scale-95 shadow-sm"
                        title="View Bill"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bill</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 border border-slate-700 transition"
                        title="Order Details"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
