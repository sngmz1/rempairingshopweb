import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import {
  RepairOrder,
  StockItem,
  Customer,
  ShopSettings,
  DashboardStats,
} from './types';

// Components
import { Header } from './components/Header';
import { DashboardView } from './components/repair/DashboardView';
import { OrdersListView } from './components/repair/OrdersListView';
import { CustomersListView } from './components/repair/CustomersListView';
import { OnlineBillsSheetView } from './components/repair/OnlineBillsSheetView';
import { NewRepairModal } from './components/repair/NewRepairModal';
import { OrderDetailModal } from './components/repair/OrderDetailModal';
import { BillingQuickModal } from './components/repair/BillingQuickModal';
import { StockListView } from './components/stock/StockListView';
import { StockInModal } from './components/stock/StockInModal';
import { StockOutModal } from './components/stock/StockOutModal';
import { StockItemModal } from './components/stock/StockItemModal';
import { StockMovementsView } from './components/stock/StockMovementsView';
import { SuppliersView } from './components/stock/SuppliersView';
import { SheetSyncModal } from './components/stock/SheetSyncModal';
import { GlobalSearchModal } from './components/shared/GlobalSearchModal';
import { SettingsModal } from './components/shared/SettingsModal';
import { PinModal } from './components/shared/PinModal';
import { PrintJobCardModal } from './components/shared/PrintJobCardModal';

import {
  Wrench,
  LayoutDashboard,
  ClipboardList,
  Users,
  Plus,
  Loader2,
  Package,
} from 'lucide-react';

export function App() {
  // Navigation State
  const [currentSide, setCurrentSide] = useState<'repair' | 'stock'>('repair');
  const [side1Tab, setSide1Tab] = useState<'dashboard' | 'orders' | 'customers' | 'sheet'>('dashboard');
  const [role, setRole] = useState<'employee' | 'owner'>('owner'); // Default owner for seamless full control

  // Core Data
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Modals
  const [isNewRepairOpen, setIsNewRepairOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetRole, setPinTargetRole] = useState<'employee' | 'owner'>('owner');

  // Stock Modals
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [selectedStockItemForAction, setSelectedStockItemForAction] = useState<StockItem | undefined>();
  const [isAddEditPartOpen, setIsAddEditPartOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<StockItem | null>(null);
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);
  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);

  // Print Modal
  const [orderToPrint, setOrderToPrint] = useState<RepairOrder | null>(null);

  // Initial Load
  useEffect(() => {
    api.ensureSession().finally(() => {
      loadAllData();
    });
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [fetchedSettings, fetchedStats, fetchedOrders, fetchedStock, fetchedCustomers] =
        await Promise.all([
          api.getSettings(),
          api.getDashboardStats(),
          api.getRepairs(),
          api.getStock(),
          api.getCustomers(),
        ]);

      setSettings(fetchedSettings);
      setStats(fetchedStats);
      setOrders(fetchedOrders);
      setStock(fetchedStock);
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    try {
      const [fetchedStats, fetchedOrders, fetchedStock] = await Promise.all([
        api.getDashboardStats(),
        api.getRepairs(),
        api.getStock(),
      ]);
      setStats(fetchedStats);
      setOrders(fetchedOrders);
      setStock(fetchedStock);
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  };

  const refreshStock = async () => {
    try {
      const [fetchedStock, fetchedStats] = await Promise.all([
        api.getStock(),
        api.getDashboardStats(),
      ]);
      setStock(fetchedStock);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to refresh stock:', err);
    }
  };

  // Switch Side handler
  const handleSwitchSide = (side: 'repair' | 'stock') => {
    if (side === 'stock' && role === 'employee') {
      setPinTargetRole('owner');
      setIsPinModalOpen(true);
      return;
    }
    setCurrentSide(side);
  };

  const handlePinSuccess = (newRole: 'employee' | 'owner') => {
    setRole(newRole);
    if (newRole === 'owner') {
      setCurrentSide('stock');
    }
  };

  // Order created handler
  const handleOrderCreated = async (newOrder: RepairOrder) => {
    await refreshOrders();
    // Open order details directly so user can print job card or view bill
    setSelectedOrder(newOrder);
  };

  // Order updated handler
  const handleOrderUpdated = async (updatedOrder: RepairOrder) => {
    setSelectedOrder(updatedOrder);
    await refreshOrders();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        currentSide={currentSide}
        onSwitchSide={handleSwitchSide}
        settings={settings}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        role={role}
        onOpenPinModal={() => {
          setPinTargetRole(role === 'owner' ? 'employee' : 'owner');
          setIsPinModalOpen(true);
        }}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-semibold">Loading Jai Mataji Repair Shop SaaS...</p>
          </div>
        ) : (
          <>
            {/* SIDE 1: REPAIR / BILLING */}
            {currentSide === 'repair' && (
              <div className="space-y-5">
                {/* Secondary Sub-Tabs for Side 1 (Responsive, Never Overlaps) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      onClick={() => setSide1Tab('dashboard')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                        side1Tab === 'dashboard'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => setSide1Tab('orders')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                        side1Tab === 'orders'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Orders ({orders.length})</span>
                    </button>

                    <button
                      onClick={() => setSide1Tab('customers')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                        side1Tab === 'customers'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Customers</span>
                    </button>

                    <button
                      onClick={() => setSide1Tab('sheet')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                        side1Tab === 'sheet'
                          ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                          : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-800/80 border border-emerald-900/40'
                      }`}
                    >
                      <span className="text-base">📄</span>
                      <span>Online Sheet (1-Row Bills)</span>
                    </button>
                  </div>

                  {/* Prominent Quick + New Repair button */}
                  <button
                    onClick={() => setIsNewRepairOpen(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition transform active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ New Repair</span>
                  </button>
                </div>

                {/* Tab Views */}
                {side1Tab === 'dashboard' && (
                  <DashboardView
                    stats={stats}
                    recentOrders={orders}
                    onOpenNewRepair={() => setIsNewRepairOpen(true)}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onOpenQuickPayment={() => setIsQuickPaymentOpen(true)}
                    onSwitchToStock={() => handleSwitchSide('stock')}
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                    onViewBill={(ord) => setOrderToPrint(ord)}
                    onFilterStatus={(st) => {
                      setSelectedStatusFilter(st);
                      setSide1Tab('orders');
                    }}
                  />
                )}

                {side1Tab === 'orders' && (
                  <OrdersListView
                    orders={
                      selectedStatusFilter === 'all'
                        ? orders.filter(
                            (o) =>
                              !orderSearchQuery ||
                              o.orderId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                              o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                              o.customerMobile.includes(orderSearchQuery) ||
                              o.model.toLowerCase().includes(orderSearchQuery.toLowerCase())
                          )
                        : orders
                            .filter(
                              (o) =>
                                o.status.toLowerCase() === selectedStatusFilter.toLowerCase()
                            )
                            .filter(
                              (o) =>
                                !orderSearchQuery ||
                                o.orderId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                                o.customerMobile.includes(orderSearchQuery) ||
                                o.model.toLowerCase().includes(orderSearchQuery.toLowerCase())
                            )
                    }
                    selectedStatus={selectedStatusFilter}
                    onSelectStatus={setSelectedStatusFilter}
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                    onViewBill={(ord) => setOrderToPrint(ord)}
                    searchQuery={orderSearchQuery}
                    onSearchChange={setOrderSearchQuery}
                  />
                )}

                {side1Tab === 'customers' && (
                  <CustomersListView
                    customers={customers}
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                  />
                )}

                {side1Tab === 'sheet' && (
                  <OnlineBillsSheetView
                    onSelectOrder={(ord) => setSelectedOrder(ord)}
                    onOpenNewRepair={() => setIsNewRepairOpen(true)}
                  />
                )}
              </div>
            )}

            {/* SIDE 2: STOCK / MANAGEMENT */}
            {currentSide === 'stock' && (
              <div className="space-y-5">
                <StockListView
                  stock={stock}
                  onOpenStockIn={(item) => {
                    setSelectedStockItemForAction(item);
                    setIsStockInOpen(true);
                  }}
                  onOpenStockOut={(item) => {
                    setSelectedStockItemForAction(item);
                    setIsStockOutOpen(true);
                  }}
                  onOpenAddPart={() => {
                    setEditingPart(null);
                    setIsAddEditPartOpen(true);
                  }}
                  onOpenEditPart={(item) => {
                    setEditingPart(item);
                    setIsAddEditPartOpen(true);
                  }}
                  onOpenMovements={() => setIsMovementsOpen(true)}
                  onOpenSuppliers={() => setIsSuppliersOpen(true)}
                  onOpenSync={() => setIsSyncOpen(true)}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Quick Bar for Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 flex items-center justify-around">
        <button
          onClick={() => {
            setCurrentSide('repair');
            setSide1Tab('dashboard');
          }}
          className={`flex flex-col items-center p-1 text-[11px] font-semibold ${
            currentSide === 'repair' && side1Tab === 'dashboard' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setCurrentSide('repair');
            setSide1Tab('orders');
          }}
          className={`flex flex-col items-center p-1 text-[11px] font-semibold ${
            currentSide === 'repair' && side1Tab === 'orders' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setIsNewRepairOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 -mt-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/40 border-2 border-slate-900"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => {
            setCurrentSide('repair');
            setSide1Tab('sheet');
          }}
          className={`flex flex-col items-center p-1 text-[10px] font-semibold transition ${
            currentSide === 'repair' && side1Tab === 'sheet' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <span className="text-lg leading-none">📄</span>
          <span>Sheet</span>
        </button>

        <button
          onClick={() => handleSwitchSide('stock')}
          className={`flex flex-col items-center p-1 text-[10px] font-semibold transition ${
            currentSide === 'stock' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Stock</span>
        </button>
      </div>

      {/* MODALS */}
      {/* 1. New Repair */}
      <NewRepairModal
        isOpen={isNewRepairOpen}
        onClose={() => setIsNewRepairOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* 2. Order Detail / Job Card */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          stockItems={stock}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
          onOpenPrint={(ord) => setOrderToPrint(ord)}
        />
      )}

      {/* 3. Quick Payment */}
      <BillingQuickModal
        isOpen={isQuickPaymentOpen}
        onClose={() => setIsQuickPaymentOpen(false)}
        orders={orders}
        onPaymentRecorded={(ord) => {
          refreshOrders();
          setSelectedOrder(ord);
        }}
      />

      {/* 4. Global Search */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      {/* 5. Shop Settings */}
      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSettingsSaved={(updated) => setSettings(updated)}
        />
      )}

      {/* 6. PIN Access */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        targetRole={pinTargetRole}
        onSuccess={handlePinSuccess}
      />

      {/* 7. Printable Job Card */}
      {orderToPrint && settings && (
        <PrintJobCardModal
          isOpen={!!orderToPrint}
          onClose={() => setOrderToPrint(null)}
          order={orderToPrint}
          settings={settings}
        />
      )}

      {/* 8. Stock In */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => {
          setIsStockInOpen(false);
          setSelectedStockItemForAction(undefined);
        }}
        stock={stock}
        preselectedItem={selectedStockItemForAction}
        onStockUpdated={refreshStock}
      />

      {/* 9. Stock Out */}
      <StockOutModal
        isOpen={isStockOutOpen}
        onClose={() => {
          setIsStockOutOpen(false);
          setSelectedStockItemForAction(undefined);
        }}
        stock={stock}
        preselectedItem={selectedStockItemForAction}
        onStockUpdated={refreshStock}
      />

      {/* 10. Add / Edit Part */}
      <StockItemModal
        isOpen={isAddEditPartOpen}
        onClose={() => {
          setIsAddEditPartOpen(false);
          setEditingPart(null);
        }}
        existingItem={editingPart}
        onSaved={refreshStock}
      />

      {/* 11. Stock Movements */}
      <StockMovementsView
        isOpen={isMovementsOpen}
        onClose={() => setIsMovementsOpen(false)}
      />

      {/* 12. Suppliers Directory */}
      <SuppliersView
        isOpen={isSuppliersOpen}
        onClose={() => setIsSuppliersOpen(false)}
      />

      {/* 13. Google Sheets & Drive Sync */}
      <SheetSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSyncComplete={loadAllData}
        onOpenOnlineSheet={() => {
          setCurrentSide('repair');
          setSide1Tab('sheet');
        }}
      />
    </div>
  );
}

export default App;
