# Architecture

## Overview

EAMS is a two-tier application: a **React SPA** (`client/`) talking to a **stateless
REST API** (`server/`) backed by **PostgreSQL** via Prisma. Authentication is
JWT-based; authorization is granular RBAC evaluated on every request.

```
┌────────────┐    HTTPS / JSON      ┌──────────────────────────────┐    SQL    ┌────────────┐
│  React SPA │ ───────────────────► │  Express API (TypeScript)     │ ────────► │ PostgreSQL │
│  (Vite)    │ ◄─────────────────── │  JWT · RBAC · Zod · Prisma    │ ◄──────── │            │
└────────────┘                      └──────────────────────────────┘           └────────────┘
        │                                          │
        │ VITE_USE_MOCK=true                       │ audit log (immutable)
        └── in-memory mock API (offline demo)      └── every mutation recorded
```

## Backend layering (strict separation of concerns)

```
Request
  → routes/            (HTTP wiring, attaches middleware)
  → middlewares/       (authenticate → requirePermission → validate)
  → controllers/       (parse req, shape res — NO business logic)
  → services/          (business rules, transactions, audit)
  → repositories/      (the ONLY layer that queries the DB via Prisma)
  → PostgreSQL
```

- **No business logic in controllers.** Controllers only translate HTTP ⇄ service calls.
- **No DB access outside repositories.** Services orchestrate; repositories persist.
- **Generic CRUD factory** (`crudRepository` → `crudService` → `crudController`) powers
  simple resources (vendors, categories, departments, locations, employees, maintenance,
  requests) so they share identical validation, pagination, org-scoping and auditing.
- **Bespoke modules** (auth, assets, assignments, dashboard) implement custom logic such
  as code/QR generation, atomic assign/return transactions and KPI aggregation.

## Frontend layering

```
api/         axios + in-memory mock (unified `http` transport)
store/       Zustand auth store (token, user, permission checks)
hooks/       reusable hooks (useDebounce …)
components/  ui primitives · common composites · charts · layout
pages/       feature screens (lazy-loaded for fast first paint)
routes/      AppRoutes + ProtectedRoute (permission-aware)
layouts/     MainLayout (sidebar + topbar) · auth shell
```

Data fetching uses **TanStack Query** (caching, background refetch, optimistic
invalidation). Forms use **React Hook Form**; client state uses **Zustand**.

## Security

- JWT access tokens (+ refresh token issuance), `Authorization: Bearer`.
- RBAC: roles → permissions (`module:action`); `requirePermission()` guards each route;
  the UI hides navigation and actions the user lacks permission for.
- Input validation with Zod on every write endpoint.
- Helmet security headers, CORS allow-list, rate limiting (stricter on `/auth`).
- Passwords hashed with bcrypt; secrets sourced only from environment variables.
- Immutable audit log persisted for every create/update/delete/assign/login.

## Multi-tenancy

Core entities carry `organizationId`. The authenticated principal's organization is
derived from the JWT and applied at the repository layer, isolating tenant data.

## Scalability notes

- Stateless API → horizontally scalable behind a load balancer.
- Indexed hot paths (`assets(organizationId,status)`, `assets(qrCode)`, audit `createdAt`).
- Pagination everywhere; aggregation endpoints for dashboards avoid N+1 fetches.
