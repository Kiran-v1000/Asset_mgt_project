# Asset_mgt_project — Enterprise Asset Management System (EAMS)

A production-shaped, full-stack **Enterprise Asset Management System** for managing the
complete lifecycle of IT and non-IT assets — registration, assignment, maintenance,
procurement, compliance and analytics — with a premium dark UI, RBAC, multi-tenant
data model and a full audit trail.

> Built to the canonical `client/` · `server/` · `docs/` project standard with strict
> layer separation (controllers → services → repositories) and a security-first priority order.

---

## ✨ Highlights

| Area | What's included |
|------|-----------------|
| **Dashboard** | Executive KPIs, utilization, portfolio value, status & category charts, expiring warranties, live activity feed |
| **AI Smart Insights** | Predictive failure-risk watchlist, AI procurement recommendations, 24-month book-value projection |
| **Command Palette (⌘K)** | Global fuzzy search + jump-to across assets, people, vendors & pages |
| **Notifications** | Live center: expiring warranties, overdue returns, pending approvals |
| **Self-Service Portal** | "My Workspace" — my assets, raise requests, report damage |
| **Reservations** | Reserve available assets for a future date; atomic status sync |
| **Asset Management** | Registry with filters, lifecycle status, condition, QR/barcode tokens, depreciation, assign/return |
| **Assignments** | Atomic check-out / return that keeps asset status in sync |
| **Procurement & People** | Vendors, employees, self-service asset requests |
| **Maintenance** | Preventive/corrective/AMC/warranty records with scheduling & cost |
| **Audit & Compliance** | Immutable, searchable audit log for every action |
| **Reports & Analytics** | Depreciation, book value, asset aging, acquisition trend, CSV export |
| **Administration** | Users, RBAC roles & permissions, departments, locations |
| **Security** | JWT auth, granular RBAC, Zod validation, Helmet, rate limiting, hashed passwords |
| **UX** | Premium gradients, glassmorphism, framer-motion fade/stagger transitions, shimmer skeletons |

---

## 🧱 Tech Stack

**Frontend** — React 19 · TypeScript · Vite · TailwindCSS · Framer Motion · TanStack Query · Zustand · React Hook Form · Zod · Recharts · Lucide

**Backend** — Node.js · Express · TypeScript · Prisma ORM · PostgreSQL · JWT · Zod · Helmet

**Infra** — Docker · Docker Compose

---

## 📁 Structure

```
Asset_mgt_project/
├── client/                  # React frontend (api, components, pages, routes, store, layouts…)
├── server/                  # Express API (config, controllers, services, repositories, middlewares…)
│   ├── prisma/              # schema.prisma + seed
│   └── DB/                  # reference SQL schema
├── docs/                    # architecture, API reference, ER diagram
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Option A — Frontend only (zero backend, instant demo)

The client ships with an in-memory mock API, enabled by default (`VITE_USE_MOCK=true`).

```bash
cd client
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

**Login:** `admin@eams.io` / `Admin@123` (one-click demo accounts on the login screen).

### Option B — Full stack (Express + PostgreSQL)

```bash
# 1) Backend
cd server
cp .env.example .env                 # set DATABASE_URL + JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate               # create schema
npm run seed                         # load demo data
npm run dev                          # http://localhost:4002

# 2) Frontend (point it at the real API)
cd ../client
cp .env.example .env                 # set VITE_USE_MOCK=false
npm install
npm run dev
```

### Option C — Docker Compose

```bash
docker compose up --build
```

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@eams.io` | `Admin@123` |
| Asset Manager | `asset.manager@eams.io` | `Admin@123` |
| Procurement Officer | `procurement@eams.io` | `Admin@123` |
| Auditor | `auditor@eams.io` | `Admin@123` |
| Employee | `employee@eams.io` | `Admin@123` |

Each role sees a different navigation set, enforced by granular RBAC permissions.

---

## 📚 Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system & folder architecture
- [`docs/API.md`](docs/API.md) — REST endpoint reference
- [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) — entity-relationship model
- [`server/DB/database_schema.sql`](server/DB/database_schema.sql) — reference DDL

---

## 🛡️ Security & Standards

Follows a strict development priority order: **Security > Stability > Existing
Functionality > UI > Performance > Scalability > UX > New Features.** Inputs are
validated (Zod), passwords hashed (bcrypt), endpoints guarded by JWT + RBAC, secrets
are environment-driven, and every mutating action is written to an immutable audit log.

---

_© Enterprise Asset Management System. Built as a reference enterprise platform._
