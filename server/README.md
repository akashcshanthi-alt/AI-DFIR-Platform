# TRACE AI DFIR Platform - Enterprise Backend

This directory houses the backend server for the TRACE AI Digital Forensics and Incident Response (DFIR) platform.

## Architecture

The backend follows clean enterprise separation rules:
- **`config/`**: System and integration parameters
- **`middleware/`**: Shared filter pipes (authentication, error logging, validations)
- **`controllers/`**: HTTP Request routers endpoints logic
- **`models/`**: Database documents schemas defined using Mongoose
- **`routes/`**: Express route forwarding mappings
- **`services/`**: Integration and core business layers
- **`utils/`**: Shared helper utility functions
- **`validators/`**: Request schema specifications
- **`sockets/`**: Realtime WebSockets stream events
- **`jobs/`**: Background system maintenance workers
- **`uploads/`**: Local disk caching for evidence files, report templates, and avatars

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server (v6.0+ or v7.0+) installed locally
- MongoDB Compass (optional GUI for browsing collections)

### Local MongoDB Configuration
The platform uses the local MongoDB Community Server database named `arclight_dfir`. No MongoDB Atlas or external cloud connection is required.

1. **Verify or Start MongoDB Locally**:
   - On Windows, MongoDB runs as a Windows Service:
     ```powershell
     # Check service status
     Get-Service MongoDB

     # Start service if stopped (Administrator PowerShell)
     Start-Service MongoDB
     ```
   - Alternatively, start `mongod` manually from terminal:
     ```powershell
     mongod --dbpath "C:\data\db"
     ```
   - Verify connection in PowerShell:
     ```powershell
     Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
     ```

2. **Environment Variables**:
   In `server/.env` (created from `server/.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/arclight_dfir
   ```

3. **Running the Server**:
   ```bash
   # From the server directory:
   npm start        # Standard start
   # or
   npm run dev      # Development with nodemon
   ```
   The backend will connect to `mongodb://127.0.0.1:27017/arclight_dfir`, verify seeding without duplicating records, and wait for a successful connection before opening the HTTP port.

### Running Backend Tests
```bash
npm run test:cases       # Case management integration tests
npm run test:dashboard   # Dashboard analytics integration tests
npm run test:audit       # Audit logging and export tests
node src/scratch/verify_persistence.js  # End-to-end local MongoDB persistence check
```
