# ProPOS - Professional Point of Sale System

## Overview

ProPOS is a modern, professional Point of Sale (POS) web application built as a high-fidelity prototype. Originally designed as a Flutter Android application specification, this implementation is a React-based web mockup that validates UI/UX patterns and user flows for retail and business sales operations.

The system provides cashier operations, product management, sales transactions, reporting dashboards, and administrative settings with role-based access control (Admin vs Employee).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side navigation
- **State Management**: 
  - Zustand for global client state (cart, shift management)
  - TanStack React Query for server state and API caching
- **UI Components**: Shadcn UI component library with Radix primitives
- **Styling**: Tailwind CSS v4 with custom "Teal" theme inspired by Material Design 3
- **Icons**: Lucide React icons

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Style**: RESTful JSON endpoints under `/api/*`
- **Session Management**: Express sessions with memory store (MemoryStore)
- **Authentication**: Custom session-based auth with bcrypt password hashing

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (Shadcn + custom)
    pages/        # Route pages (auth, dashboard, pos, products, settings)
    hooks/        # Custom React hooks (auth, cart, shift, mobile detection)
    lib/          # Utilities, API client, query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database operations layer
  auth.ts         # Authentication middleware and routes
  seed.ts         # Database seeding script
shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema definitions
```

### Authentication Flow
- Session-based authentication stored server-side
- Two roles: `admin` (full access) and `employee` (POS-only access)
- Protected routes redirect unauthenticated users to `/auth`
- Demo credentials seeded: `admin@pos.com` / `admin123` and `kasir@pos.com` / `kasir123`

### Key Data Models
- **Users**: Authentication and role management
- **Products**: Inventory with categories, pricing, stock levels
- **Shifts**: Cashier shift tracking (open/close with cash counts)
- **Transactions**: Sales records with line items

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **zustand**: Lightweight global state management
- **recharts**: Chart visualizations for dashboard
- **date-fns**: Date formatting and manipulation
- **react-hook-form** + **zod**: Form handling with validation

### Backend Libraries
- **express-session** + **memorystore**: Session management
- **bcryptjs**: Password hashing
- **connect-pg-simple**: PostgreSQL session store (available but currently using memory store)

### Build Tools
- **Vite**: Frontend bundling and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development