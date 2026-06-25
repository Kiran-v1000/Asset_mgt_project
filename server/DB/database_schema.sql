-- ============================================================================
--  EAMS — PostgreSQL reference schema
--  NOTE: Prisma (prisma/schema.prisma) is the SOURCE OF TRUTH. Generate real
--  migrations with `npm run prisma:migrate`. This file documents the resulting
--  relational model for DBAs / review and is kept in sync manually.
-- ============================================================================

-- ---- Enumerated types -------------------------------------------------------
CREATE TYPE asset_status AS ENUM ('AVAILABLE','ASSIGNED','IN_MAINTENANCE','IN_TRANSIT','RESERVED','RETIRED','DISPOSED','LOST','DAMAGED');
CREATE TYPE asset_condition AS ENUM ('NEW','EXCELLENT','GOOD','FAIR','POOR');
CREATE TYPE assignment_status AS ENUM ('ACTIVE','RETURNED','OVERDUE','LOST');
CREATE TYPE maintenance_type AS ENUM ('PREVENTIVE','CORRECTIVE','AMC','WARRANTY_CLAIM','INSPECTION');
CREATE TYPE maintenance_status AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE request_status AS ENUM ('PENDING','APPROVED','REJECTED','FULFILLED','CANCELLED');
CREATE TYPE depreciation_method AS ENUM ('STRAIGHT_LINE','DECLINING_BALANCE','NONE');

-- ---- Tenancy & access control ----------------------------------------------
CREATE TABLE organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  domain      TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  is_system        BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (organization_id, name)
);

CREATE TABLE permissions (
  id          TEXT PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  module      TEXT NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id        TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  role_id          TEXT NOT NULL REFERENCES roles(id),
  department_id    TEXT,
  location_id      TEXT,
  avatar_url       TEXT,
  phone            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sso_provider     TEXT,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_org ON users(organization_id);

-- ---- Organisational structure ----------------------------------------------
CREATE TABLE departments (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  cost_center      TEXT,
  UNIQUE (organization_id, code)
);

CREATE TABLE locations (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  type             TEXT,
  address          TEXT,
  city             TEXT,
  country          TEXT,
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  UNIQUE (organization_id, code)
);

CREATE TABLE employees (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_code    TEXT NOT NULL,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  designation      TEXT,
  department_id    TEXT REFERENCES departments(id),
  location_id      TEXT REFERENCES locations(id),
  manager_id       TEXT REFERENCES employees(id),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (organization_id, employee_code)
);

-- ---- Procurement & catalog -------------------------------------------------
CREATE TABLE vendors (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name      TEXT NOT NULL,
  code             TEXT NOT NULL,
  contact_person   TEXT,
  email            TEXT,
  phone            TEXT,
  address          TEXT,
  rating           DOUBLE PRECISION DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (organization_id, code)
);

CREATE TABLE categories (
  id                  TEXT PRIMARY KEY,
  organization_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  code                TEXT NOT NULL,
  parent_id           TEXT REFERENCES categories(id),
  depreciation_method depreciation_method NOT NULL DEFAULT 'STRAIGHT_LINE',
  depreciation_rate   DOUBLE PRECISION NOT NULL DEFAULT 0,
  useful_life_years   INTEGER NOT NULL DEFAULT 5,
  UNIQUE (organization_id, code)
);

-- ---- Assets & lifecycle ----------------------------------------------------
CREATE TABLE assets (
  id                  TEXT PRIMARY KEY,
  organization_id     TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_code          TEXT NOT NULL,
  name                TEXT NOT NULL,
  category_id         TEXT NOT NULL REFERENCES categories(id),
  serial_number       TEXT,
  qr_code             TEXT,
  purchase_date       TIMESTAMPTZ,
  purchase_cost       DOUBLE PRECISION NOT NULL DEFAULT 0,
  current_value       DOUBLE PRECISION NOT NULL DEFAULT 0,
  vendor_id           TEXT REFERENCES vendors(id),
  warranty_expiry     TIMESTAMPTZ,
  amc_expiry          TIMESTAMPTZ,
  status              asset_status NOT NULL DEFAULT 'AVAILABLE',
  condition           asset_condition NOT NULL DEFAULT 'NEW',
  location_id         TEXT REFERENCES locations(id),
  assigned_to_id      TEXT REFERENCES employees(id),
  specifications      JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, asset_code)
);
CREATE INDEX idx_assets_org_status ON assets(organization_id, status);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_qr ON assets(qr_code);

CREATE TABLE asset_assignments (
  id                   TEXT PRIMARY KEY,
  asset_id             TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id          TEXT NOT NULL REFERENCES employees(id),
  assigned_by_id       TEXT REFERENCES users(id),
  assigned_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date   TIMESTAMPTZ,
  status               assignment_status NOT NULL DEFAULT 'ACTIVE',
  condition_on_assign  asset_condition,
  condition_on_return  asset_condition
);
CREATE INDEX idx_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX idx_assignments_employee ON asset_assignments(employee_id);

CREATE TABLE maintenance_records (
  id              TEXT PRIMARY KEY,
  asset_id        TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  vendor_id       TEXT REFERENCES vendors(id),
  type            maintenance_type NOT NULL,
  status          maintenance_status NOT NULL DEFAULT 'SCHEDULED',
  title           TEXT NOT NULL,
  scheduled_date  TIMESTAMPTZ,
  completed_date  TIMESTAMPTZ,
  next_due_date   TIMESTAMPTZ,
  cost            DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX idx_maintenance_asset ON maintenance_records(asset_id);

CREATE TABLE asset_requests (
  id             TEXT PRIMARY KEY,
  request_code   TEXT UNIQUE NOT NULL,
  employee_id    TEXT NOT NULL REFERENCES employees(id),
  status         request_status NOT NULL DEFAULT 'PENDING',
  approved_by_id TEXT REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Cross-cutting ---------------------------------------------------------
CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  actor_name  TEXT,
  action      TEXT NOT NULL,
  module      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  summary     TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_module ON audit_logs(module);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
