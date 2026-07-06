# REST API Reference

Base URL: `/api/v1` · All responses use a consistent envelope.

```jsonc
// Single resource
{ "success": true, "message": "Success", "data": { ... } }
// Paginated list
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 10, "total": 60, "totalPages": 6 } }
// Error
{ "success": false, "message": "…", "errors": [ { "path": "email", "message": "…" } ] }
```

Auth: send `Authorization: Bearer <accessToken>` for every endpoint except `POST /auth/login`.

List endpoints accept query params: `page`, `limit`, `search`, `sort`, `order` (`asc|desc`),
plus resource-specific filters.

---

## Auth
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/auth/login` | public | Exchange email/password for tokens |
| GET | `/auth/me` | authenticated | Current user + permissions |
| POST | `/auth/logout` | authenticated | Client-side token discard (audited) |

## Dashboard
| Method | Path | Permission |
|--------|------|-----------|
| GET | `/dashboard/overview` | `dashboard:view` |
| GET | `/dashboard/trend` | `dashboard:view` |

## Assets
| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/assets` | `asset:view` | filters: `status`, `categoryId`, `locationId` |
| GET | `/assets/:id` | `asset:view` | includes assignment & maintenance history |
| POST | `/assets` | `asset:create` | auto-generates `assetCode` + `qrCode` |
| PATCH | `/assets/:id` | `asset:update` | |
| DELETE | `/assets/:id` | `asset:delete` | blocked while `ASSIGNED` |

## Assignments
| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/assignments` | `asset:view` | filter: `status` |
| POST | `/assignments` | `asset:assign` | atomic: creates assignment + sets asset `ASSIGNED` |
| POST | `/assignments/:id/return` | `asset:assign` | atomic: closes assignment + frees asset |

## Reservations
| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/reservations` | `asset:view` | filter: `status` |
| POST | `/reservations` | `asset:assign` | atomic: creates reservation + sets asset `RESERVED` |
| POST | `/reservations/:id/cancel` | `asset:assign` | atomic: cancels + frees asset to `AVAILABLE` |

## Catalog & Procurement & People
| Resource | Path | View | Manage |
|----------|------|------|--------|
| Categories | `/categories` | `asset:view` | `category:manage` |
| Vendors | `/vendors` | `vendor:view` | `vendor:manage` |
| Employees | `/employees` | `employee:view` | `employee:manage` |
| Requests | `/requests` | `request:view` | `request:create` / `request:approve` |

Each supports `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.

## Maintenance
| Method | Path | Permission |
|--------|------|-----------|
| GET/POST/PATCH/DELETE | `/maintenance[/:id]` | `maintenance:view` / `maintenance:manage` |

## Audit & Administration
| Method | Path | Permission |
|--------|------|-----------|
| GET | `/audit-logs` | `audit:view` |
| GET/POST/PATCH/DELETE | `/users[/:id]` | `admin:users` |
| GET | `/roles` | `admin:roles` |
| GET/POST/PATCH/DELETE | `/departments[/:id]` | `employee:view` / `admin:settings` |
| GET/POST/PATCH/DELETE | `/locations[/:id]` | `asset:view` / `admin:settings` |

## Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe (no auth) |

---

### Example — login

```bash
curl -X POST http://localhost:4002/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@eams.io","password":"Admin@123"}'
```

### Example — list assets (filtered)

```bash
curl 'http://localhost:4002/api/v1/assets?status=ASSIGNED&page=1&limit=10' \
  -H "Authorization: Bearer $TOKEN"
```
