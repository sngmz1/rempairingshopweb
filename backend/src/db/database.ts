import fs from 'fs';
import path from 'path';
import { Customer, RepairOrder, StockItem, StockMovement, Supplier, ShopSettings } from '../types';

export interface DatabaseState {
  settings: ShopSettings;
  customers: Customer[];
  orders: RepairOrder[];
  parts: StockItem[];
  movements: StockMovement[];
  suppliers: Supplier[];
  lastOrderSequence: number;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const defaultSettings: ShopSettings = {
  shopName: 'Jai Mataji Mobile Repairing',
  contact1Name: 'Ashok Bhai',
  contact1Number: '9974298866',
  contact2Name: 'Mitesh',
  contact2Number: '9327394978',
  address: 'M. Tower Chowk, Opposite Market Yard, Modasa Road, Talod',
  serviceDescription: 'We accept mobile phones from every company and provide mobile phone, computer, and electronic-device repair services.',
  upiId: '9974298866@upi',
  receiptInformation: 'Thank you for choosing Jai Mataji Mobile Repairing! Devices tested before delivery. 30 days testing warranty on select folder replacements.',
  googleSheetId: process.env.GOOGLE_SHEET_ID || '',
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  autoSyncGoogleSheets: true,
  autoUploadDrive: true,
  updatedAt: new Date().toISOString(),
};

const initialParts: StockItem[] = [
  {
    itemId: 'PART-1001',
    itemName: 'Samsung A55 5G Display (Original Quality)',
    category: 'Display',
    brand: 'Samsung',
    model: 'Galaxy A55',
    availableQuantity: 5,
    minimumQuantity: 2,
    purchaseCost: 2200,
    sellingPrice: 3500,
    supplier: 'Shree Mobile Spares Ahmedabad',
    consumptionType: 'Consume On Part Used',
    updatedAt: new Date().toISOString(),
  },
  {
    itemId: 'PART-1002',
    itemName: 'Vivo Y20 / Y20G Original Battery',
    category: 'Battery',
    brand: 'Vivo',
    model: 'Y20 / Y20G',
    availableQuantity: 8,
    minimumQuantity: 3,
    purchaseCost: 650,
    sellingPrice: 1200,
    supplier: 'Star Electronics Himatnagar',
    consumptionType: 'Consume On Part Used',
    updatedAt: new Date().toISOString(),
  },
  {
    itemId: 'PART-1003',
    itemName: 'Type-C Fast Charging Port Sub-Board',
    category: 'Charging Port',
    brand: 'Universal',
    model: 'Type-C Universal Sub-Board',
    availableQuantity: 15,
    minimumQuantity: 5,
    purchaseCost: 90,
    sellingPrice: 350,
    supplier: 'Shree Mobile Spares Ahmedabad',
    consumptionType: 'Consume On Part Used',
    updatedAt: new Date().toISOString(),
  },
  {
    itemId: 'PART-1004',
    itemName: 'Premium Protective Repair Folder Box',
    category: 'Folder/Packaging',
    brand: 'Generic',
    model: 'Universal Handset Folder',
    availableQuantity: 20,
    minimumQuantity: 5,
    purchaseCost: 15,
    sellingPrice: 0,
    supplier: 'Local Packaging Modasa',
    consumptionType: 'Consume On Delivery',
    updatedAt: new Date().toISOString(),
  },
];

const initialSuppliers: Supplier[] = [
  {
    supplierId: 'SUP-001',
    name: 'Shree Mobile Spares Ahmedabad',
    mobile: '9825012345',
    notes: 'Main wholesaler for Samsung & OnePlus displays and parts',
    updatedAt: new Date().toISOString(),
  },
  {
    supplierId: 'SUP-002',
    name: 'Star Electronics Himatnagar',
    mobile: '9426098765',
    notes: 'Fast delivery for Vivo, Oppo & Realme batteries and ICs',
    updatedAt: new Date().toISOString(),
  },
];

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadData();
  }

  private loadData(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure defaults if missing keys
        return {
          settings: { ...defaultSettings, ...parsed.settings },
          customers: parsed.customers || [],
          orders: parsed.orders || [],
          parts: parsed.parts || initialParts,
          movements: parsed.movements || [],
          suppliers: parsed.suppliers || initialSuppliers,
          lastOrderSequence: parsed.lastOrderSequence || 481,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing defaults:', err);
    }

    const defaultState: DatabaseState = {
      settings: defaultSettings,
      customers: [],
      orders: [],
      parts: initialParts,
      movements: [],
      suppliers: initialSuppliers,
      lastOrderSequence: 481,
    };

    this.saveData(defaultState);
    return defaultState;
  }

  private saveData(stateToSave: DatabaseState): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(stateToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Error saving database file:', err);
    }
  }

  public getSettings(): ShopSettings {
    return { ...this.state.settings };
  }

  public updateSettings(updates: Partial<ShopSettings>): ShopSettings {
    this.state.settings = {
      ...this.state.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(this.state);
    return { ...this.state.settings };
  }

  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.state.customers.find((c) => c.customerId === id);
  }

  public getCustomerByMobile(mobile: string): Customer | undefined {
    return this.state.customers.find((c) => c.mobile === mobile);
  }

  public saveCustomer(customer: Customer): Customer {
    const index = this.state.customers.findIndex((c) => c.customerId === customer.customerId);
    if (index >= 0) {
      this.state.customers[index] = customer;
    } else {
      this.state.customers.push(customer);
    }
    this.saveData(this.state);
    return customer;
  }

  public getOrders(): RepairOrder[] {
    return [...this.state.orders];
  }

  public getOrderById(orderId: string): RepairOrder | undefined {
    return this.state.orders.find((o) => o.orderId === orderId);
  }

  public saveOrder(order: RepairOrder): RepairOrder {
    const index = this.state.orders.findIndex((o) => o.orderId === order.orderId);
    if (index >= 0) {
      this.state.orders[index] = order;
    } else {
      this.state.orders.push(order);
    }
    this.saveData(this.state);
    return order;
  }

  public getNextOrderId(): string {
    const year = new Date().getFullYear();
    this.state.lastOrderSequence += 1;
    const formattedSeq = String(this.state.lastOrderSequence).padStart(5, '0');
    this.saveData(this.state);
    return `ORD-${year}-${formattedSeq}`;
  }

  public getParts(): StockItem[] {
    return [...this.state.parts];
  }

  public getPartById(itemId: string): StockItem | undefined {
    return this.state.parts.find((p) => p.itemId === itemId);
  }

  public savePart(part: StockItem): StockItem {
    const index = this.state.parts.findIndex((p) => p.itemId === part.itemId);
    if (index >= 0) {
      this.state.parts[index] = part;
    } else {
      this.state.parts.push(part);
    }
    this.saveData(this.state);
    return part;
  }

  public getMovements(): StockMovement[] {
    return [...this.state.movements];
  }

  public addMovement(movement: StockMovement): StockMovement {
    this.state.movements.unshift(movement); // Most recent first
    this.saveData(this.state);
    return movement;
  }

  public getSuppliers(): Supplier[] {
    return [...this.state.suppliers];
  }

  public saveSupplier(supplier: Supplier): Supplier {
    const index = this.state.suppliers.findIndex((s) => s.supplierId === supplier.supplierId);
    if (index >= 0) {
      this.state.suppliers[index] = supplier;
    } else {
      this.state.suppliers.push(supplier);
    }
    this.saveData(this.state);
    return supplier;
  }

  public getAllData(): DatabaseState {
    return { ...this.state };
  }

  public replaceAllData(newState: DatabaseState): void {
    this.state = newState;
    this.saveData(this.state);
  }
}

export const db = new Database();
