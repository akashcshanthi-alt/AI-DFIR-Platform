# TRACE AI — Digital Forensics & Incident Response (DFIR) Platform

An enterprise-grade Digital Forensics and Incident Response (DFIR) platform featuring real-time incident telemetry, case management, AI investigation assistance, evidence chain-of-custody, and production-ready authentication.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **MongoDB**: Locally running MongoDB Community Server or MongoDB service (`mongodb://127.0.0.1:27017/arclight_dfir`)

### 2. Installation
Install dependencies in both the root, client, and server folders:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Start Frontend & Backend Together
From the project root:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

*(Optional) Run separately:*
```bash
# Terminal 1 - Backend
node server/src/server.js

# Terminal 2 - Frontend
npm run dev --prefix client
```

---

## 🔐 Authentication System

The platform includes a production-ready, secure authentication system:

| Flow | Endpoint / Route | Description |
|---|---|---|
| **Registration** | `POST /api/auth/register` | Registers operator with password complexity enforcement, creates hashed verification token, dispatches verification email. |
| **Email Verification** | `POST /api/auth/verify-email` | Verifies account using single-use cryptographic token (`/verify?token=...`). |
| **Resend Verification** | `POST /api/auth/resend-verification` | Resends verification link with 60-second anti-spam cooldown. |
| **Login** | `POST /api/auth/login` | Validates credentials, verifies email verification status, issues JWT access token + refresh token. |
| **Google SSO** | `POST /api/auth/google` | Cryptographically validates Google ID token. Fails closed on invalid or arbitrary email attempts. |
| **Forgot Password** | `POST /api/auth/forgot-password` | Generates 1-hour single-use hashed reset token, dispatches reset link. Prevents account enumeration. |
| **Reset Password** | `POST /api/auth/reset-password` | Validates reset token, updates password, immediately invalidates token. |
| **Logout** | `POST /api/auth/logout` | Clears client session and tokens. |
| **Protected Routes** | Client `<ProtectedRoute />` | Blocks unauthenticated access and validates JWT expiry. |
| **RBAC** | `authorizeRoles(...)` | Server and client role-based access control (`Super Admin`, `Admin`, `Investigator`, `Analyst`). |

---

## ⚙️ Environment Variables

Create or update `server/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB URI (Local or Remote)
MONGO_URI=mongodb://127.0.0.1:27017/arclight_dfir

# JWT Secrets (Minimum 32 characters)
JWT_SECRET=trace_dfir_sec_dev_9f4b1a82c6e3d5708192a4b7c8d9e0f123456789abcdef0123456789abcdef
JWT_REFRESH_SECRET=trace_dfir_ref_dev_7e3a9c2b4d1f8065a9182b3c4d5e6f70123456789abcdef0123456789abcdef
JWT_EXPIRES_IN=7d

# Frontend Base URL (for verification & password reset links)
FRONTEND_URL=http://localhost:5173

# Email / SMTP Configuration (Optional in development: links are printed to server console)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false
EMAIL_FROM="TRACE AI Security" <no-reply@trace.ai>
```

---

## 🧪 Running Tests

### 1. Authentication Test Suite (31 Automated Tests)
Runs full security and functional test coverage (registration, verification, login, Google SSO, password reset, token replay, RBAC):
```bash
node server/src/scratch/test_auth_suite.js
```
*Expected: `ALL AUTHENTICATION TESTS PASSED CLEANLY (31/31)`*

### 2. Core Platform Tests
```bash
# Case Management Tests
node server/src/scratch/test_cases.js

# Dashboard Analytics Tests
node server/src/scratch/test_dashboard.js

# Audit Log Tests
node server/src/scratch/test_audit.js
```

### 3. Frontend Production Build
```bash
npm run build --prefix client
```

---

## 📁 Project Structure

```
AI-DFIR-Platform/
├── client/                     # React 19 + Vite frontend
│   ├── src/
│   │   ├── pages/              # Login, Register, Verify, ForgotPassword, ResetPassword, Dashboard...
│   │   ├── services/           # auth.service.js, firebase.js, cases.service.js...
│   │   ├── components/         # Layout (Sidebar, Header), shared UI components
│   │   └── App.jsx             # Client routing & ProtectedRoute wrappers
├── server/                     # Express.js REST API
│   ├── src/
│   │   ├── controllers/        # auth.controller.js, cases.controller.js...
│   │   ├── middleware/         # auth.js (JWT & RBAC), logger.js, errorHandler.js
│   │   ├── models/             # User.js, Case.js, Evidence.js, AuditLog.js...
│   │   ├── routes/             # auth.routes.js, cases.routes.js...
│   │   ├── services/           # email.service.js, socket.service.js
│   │   └── server.js           # Server entry point
└── README.md                   # Project documentation
```
