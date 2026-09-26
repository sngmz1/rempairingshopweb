# Security Policy & Guidelines: Jai Mataji Mobile Repairing SaaS

## Overview
This document outlines security best practices, secret management procedures, and vulnerability response guidelines for the **Jai Mataji Mobile Repairing** system. The architecture is engineered around privacy-by-design, authenticated encryption, role-based authorization, rate limiting, and zero unnecessary cost.

---

## 1. Where Secrets Must Be Stored

All sensitive configuration parameters must **only** be stored in:
- **Server-side `.env` files** (for local development or self-hosted deployment).
- **Platform secret variables / Environment variables** (e.g. Render, Railway, AWS ECS, or Docker secret stores) for production environments.

### Storage Rules:
1. **Never store secrets in source code files** (`.ts`, `.tsx`, `.js`, `.json`, `.html`).
2. **Never expose secrets to client-side bundles**: Frontend code delivered to browsers must never contain API keys, private keys, service account JSON, or database credentials.
3. **Never store credentials or PINs in Google Sheets**: Google Sheets is strictly for business workflow data (customer repair rows, parts records).
4. **Encrypt persistent sensitive data at rest**: Any sensitive token or credential stored locally is encrypted using AES-256-GCM with a 256-bit key and random 96-bit initialization vectors (IVs).

---

## 2. Files That Must NEVER Contain Secrets

The following files are strictly prohibited from storing plain-text secrets and are blocked in `.gitignore`:
- `backend/.env` & `frontend/.env` (and any `.env.*` files)
- `backend/service-account*.json` (Google Cloud service account keys)
- `backend/data/store.json` (Local database containing customer orders and shop configuration)
- `backend/data/online_bills_sheet.csv` (Exported bill cache)
- `backend/bills/*.pdf` (Generated repair bills containing customer details)
- `*.pem`, `*.key`, `*.cert` (Private keys or certificates)
- Source files committed to Git repositories

---

## 3. How to Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Generate cryptographically strong random secrets:
   ```bash
   # Generate a 32-byte hex encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate a 64-character JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. Populate the variables in `backend/.env`:
   - `JWT_SECRET`: Random 256-bit string for signing session tokens.
   - `ENCRYPTION_KEY`: 64-character hex string (32 bytes) for AES-256-GCM encryption.
   - `OWNER_PIN`: 4-digit or longer master management PIN (defaults to 9974).
   - `EMPLOYEE_PIN`: Worker access PIN (defaults to 1234).
   - `CORS_ORIGIN`: Exact authorized client URL (e.g. `http://localhost:5173`).
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account JSON (kept out of git).

---

## 4. How to Rotate Credentials

If any key, token, or PIN is exposed or suspected to be compromised:

### A. Google Service Account Keys
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **IAM & Admin** > **Service Accounts**.
3. Select your service account, go to the **Keys** tab.
4. Click **Add Key** > **Create new key** (JSON) and download the new file.
5. Place the new file in your deployment environment and update `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.
6. Return to Google Cloud Console and **Delete / Revoke** the old compromised key ID immediately.

### B. JWT & Encryption Keys
1. Generate new 32-byte random hex/base64 strings using `crypto.randomBytes(32)`.
2. Update `JWT_SECRET` and `ENCRYPTION_KEY` in `backend/.env`.
3. Restart the backend service. (Existing client sessions will be cleanly logged out and require re-authentication).

### C. Access PINs
1. Owners can update the PIN in the **Settings** tab inside the app (requires existing Owner PIN authentication), or by updating `OWNER_PIN` in `backend/.env`.

---

## 5. Security Architecture Summary

- **Authentication & Rate Limiting**: Max 5 PIN attempts per 15 minutes per IP to eliminate 4-digit PIN brute forcing. Constant-time comparison (`crypto.timingSafeEqual`) prevents timing-based side-channel attacks.
- **Session Tokens**: Short-lived, signed JWT session tokens stored in browser `sessionStorage` (automatically cleared on tab closure).
- **Transport Security**: Security headers enforced (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **File System Integrity**: Atomic database writes via temporary file and atomic rename prevent data corruption during process interruption. Path traversal protections prevent file system scanning.
- **Zero Cost**: Built entirely with standard Node.js native `crypto`, `express`, `bcryptjs`, and `jsonwebtoken`. Zero paid SaaS fees or external service lock-in.

---

## 6. Reporting Security Vulnerabilities

If you discover a security vulnerability or credential leak:
- **Do not** post it in public GitHub issues or public forums.
- Contact the system administrators directly (Ashok Bhai / Mitesh) via private communication channels.
- Provide a clear description and reproduction steps so the issue can be verified and patched promptly.
