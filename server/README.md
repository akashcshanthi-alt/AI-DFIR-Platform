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
- MongoDB (Optional for Stage 1 stubs verification)

### Running Development Server
1. Install server dependencies:
   ```bash
   npm install
   ```
2. Start development watch server:
   ```bash
   npm run dev
   ```
