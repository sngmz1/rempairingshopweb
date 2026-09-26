# Jai Mataji Mobile Repairing — Shop Management SaaS

A mobile-first, lightweight, and reliable PWA web application tailored for electronics & mobile repair shops. Built with React (Vite) and Node.js (Express TypeScript).

---

## Key Features

1. **Two Core Operating Modes**:
   * **Side 1 — Repair & Billing**: Customer intake, device complaint logging, automatic pickup/delivery timestamps, advance payments, balance tracking, PDF invoices, and thermal job card printing.
   * **Side 2 — Stock & Management**: Inventory catalog, low-stock threshold alerts, stock-in/stock-out movements, and supplier tracking.

2. **Online Google Sheets & Drive Sync**:
   * Auto-stores each repair bill online in single-row spreadsheet format (1 customer = 1 row) for easy business reporting and Excel/Google Sheets export.
   * Direct CSV export and Google Drive PDF upload integration.

3. **Security & Privacy by Design**:
   * **Authenticated Encryption**: Sensitive tokens encrypted with AES-256-GCM.
   * **Rate-Limited Authentication**: 4-digit PIN protection (Pre-set: `9974`) backed by bcrypt hashing and in-memory rate limiting against brute-force attacks.
   * **Short-Lived Signed JWT Sessions**: Safe session management stored in browser `sessionStorage`.
   * **Security Headers & Atomic Writes**: Hardened with CSP, `nosniff`, `SAMEORIGIN`, and crash-resilient file persistence (`.tmp` -> atomic rename).
   * **Zero Paid Dependencies**: Built completely on open-source, free tools.

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── db/              # Atomic JSON database
│   │   ├── middleware/      # Security headers, rate limiting, JWT & owner guards
│   │   ├── routes/          # Express API endpoints (repairs, stock, auth, sync)
│   │   ├── services/        # PDF generation, sheets sync, stock services
│   │   ├── tests/           # Automated security test suite
│   │   └── utils/           # AES-256-GCM, bcrypt, JWT utilities
│   ├── .env.example         # Environment template with placeholders
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Repair, stock, and shared UI components
│   │   ├── services/        # API service with auto-session management
│   │   └── App.tsx          # Dual-side state and navigation
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── package.json             # Root runner scripts
├── README.md
└── SECURITY.md              # Security policy, secret rotation, and reporting
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your desired configuration (default owner PIN is set to `9974`).

### 3. Run the Development Servers
In separate terminals:

```bash
# Terminal 1: Backend API (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Frontend PWA (http://localhost:5173)
cd frontend
npm run dev
```

### 4. Run Automated Security Tests
```bash
cd backend
npm test
```

---

## Default Access Credentials
* **Pre-set 4-digit PIN:** `9974` (Works for both Owner and Staff roles, configurable in `.env` or Settings).

---

## License
MIT License. Crafted for Jai Mataji Mobile Repairing, Talod.
