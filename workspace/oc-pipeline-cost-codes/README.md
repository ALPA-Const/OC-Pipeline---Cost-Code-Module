# OC Pipeline - Cost Code Module

A comprehensive cost code management system for construction projects, built with React, TypeScript, Node.js, Express, and Supabase.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [TODO](#todo)

## ✨ Features

- **Cost Code Management**: Create, read, update, and delete cost codes
- **Hierarchical Structure**: Support for multi-level cost code hierarchies
- **Standard Database Import**: Import from CSI MasterFormat, Uniformat II, and R.S. Means
- **CSV Import**: Import custom cost codes from CSV files
- **Search & Filter**: Advanced filtering and search capabilities
- **Import History**: Track all import operations with detailed logs
- **Row Level Security**: Organization-level data isolation using Supabase RLS
- **RESTful API**: Well-documented API endpoints

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety

### Database
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Backend-as-a-Service
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions (future)

## 📁 Project Structure

```
oc-pipeline-cost-codes/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── features/
│   │   │   └── cost-codes/     # Cost code feature module
│   │   │       ├── components/ # React components
│   │   │       ├── hooks/      # Custom React hooks
│   │   │       ├── api/        # API client
│   │   │       └── types/      # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js backend API
│   ├── src/
│   │   ├── modules/
│   │   │   └── cost-codes/     # Cost code module
│   │   │       ├── *.controller.ts
│   │   │       ├── *.service.ts
│   │   │       └── *.routes.ts
│   │   ├── middleware/         # Express middleware
│   │   ├── config/             # Configuration files
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── database/                    # Database migrations and seeds
│   ├── migrations/             # SQL migration files
│   └── seeds/                  # Seed data
│
├── shared/                      # Shared code between frontend and backend
│   └── types/                  # Shared TypeScript types
│
├── .env.example                # Environment variables template
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- PostgreSQL (provided by Supabase)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd oc-pipeline-cost-codes
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## 🗄 Database Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy your project URL and keys

### 2. Run Migrations

Execute the SQL files in order:

```sql
-- In Supabase SQL Editor, run these files in order:
-- 1. database/migrations/001_create_cost_code_tables.sql
-- 2. database/migrations/002_create_indexes.sql
-- 3. database/migrations/003_enable_rls.sql
-- 4. database/seeds/seed-standard-databases.sql (optional)
```

### 3. Verify Setup

Check that the following tables exist:
- `cost_code_databases`
- `cost_codes`
- `cost_code_import_history`
- `cost_code_categories`
- `cost_code_category_mappings`

## 💻 Development

### Start Backend Server

```bash
cd backend
npm run dev
```

Server runs on http://localhost:3001

### Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📚 API Documentation

### Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Cost Codes

- `GET /api/cost-codes` - List all cost codes (with pagination)
- `GET /api/cost-codes/:id` - Get single cost code
- `POST /api/cost-codes` - Create new cost code
- `PUT /api/cost-codes/:id` - Update cost code
- `DELETE /api/cost-codes/:id` - Delete cost code
- `GET /api/cost-codes/tree` - Get hierarchical tree
- `GET /api/cost-codes/:id/children` - Get children of a cost code

#### Import

- `GET /api/cost-codes/import/databases` - List standard databases
- `GET /api/cost-codes/import/history` - Get import history
- `POST /api/cost-codes/import/standard` - Import from standard database
- `POST /api/cost-codes/import/csv` - Import from CSV file

### Query Parameters

**GET /api/cost-codes**
- `search` - Search in code and title
- `database_id` - Filter by database
- `parent_id` - Filter by parent
- `level` - Filter by level
- `is_active` - Filter by active status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `sort_by` - Sort field (default: code)
- `sort_order` - Sort direction (asc/desc)

## 📝 TODO

### High Priority

- [ ] Implement CSV parsing and validation
- [ ] Complete tree building algorithm
- [ ] Add bulk operations (update, delete)
- [ ] Implement proper modal components
- [ ] Add form validation with error messages
- [ ] Add loading skeletons and empty states

### Medium Priority

- [ ] Add React Router for navigation
- [ ] Implement authentication flow
- [ ] Add pagination controls
- [ ] Add export functionality (CSV, JSON, Excel)
- [ ] Implement drag-and-drop for CSV column mapping
- [ ] Add real-time updates with Supabase subscriptions

### Low Priority

- [ ] Add dark mode support
- [ ] Implement role-based access control
- [ ] Add audit logging
- [ ] Create admin dashboard
- [ ] Add data visualization charts
- [ ] Implement undo/redo functionality

### Testing

- [ ] Add unit tests (Jest)
- [ ] Add integration tests
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Add API tests

### Documentation

- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Create user guide
- [ ] Add code comments
- [ ] Create deployment guide

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## 📄 License

MIT

## 👥 Team

OC Pipeline Team - 2025

---

**Note**: This is a boilerplate structure with placeholder implementations. Many features are marked with TODO comments and need to be implemented for production use.