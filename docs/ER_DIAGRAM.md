# Entity-Relationship Model

Prisma (`server/prisma/schema.prisma`) is the source of truth. Diagram below (Mermaid).

```mermaid
erDiagram
  Organization ||--o{ User : has
  Organization ||--o{ Role : defines
  Organization ||--o{ Department : has
  Organization ||--o{ Location : has
  Organization ||--o{ Employee : employs
  Organization ||--o{ Vendor : contracts
  Organization ||--o{ Category : owns
  Organization ||--o{ Asset : owns

  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : in
  Role ||--o{ User : assigned

  Department ||--o{ Employee : contains
  Location ||--o{ Employee : based_at
  Location ||--o{ Asset : stored_at
  Employee ||--o{ Employee : manages

  Category ||--o{ Asset : classifies
  Category ||--o{ Category : parent_of
  Vendor ||--o{ Asset : supplies
  Vendor ||--o{ MaintenanceRecord : services
  Vendor ||--o{ PurchaseOrder : fulfills
  PurchaseOrder ||--o{ PurchaseOrderItem : contains

  Asset ||--o{ AssetAssignment : has
  Employee ||--o{ AssetAssignment : holds
  User ||--o{ AssetAssignment : created
  Asset ||--o{ MaintenanceRecord : undergoes
  Employee ||--o{ AssetRequest : raises
  User ||--o{ AssetRequest : approves

  User ||--o{ AuditLog : performs
  User ||--o{ Notification : receives
```

## Core entities

| Entity | Purpose | Key fields |
|--------|---------|-----------|
| **Organization** | Tenant boundary | `code` (unique) |
| **User** | Login principal | `email`, `passwordHash`, `roleId` |
| **Role / Permission / RolePermission** | RBAC | `permission.key = module:action` |
| **Department / Location** | Org structure | `code` per org |
| **Employee** | Asset holder | `employeeCode`, `managerId` (self-ref) |
| **Vendor** | Supplier | `code`, `rating` |
| **Category** | Asset class + depreciation policy | `depreciationRate`, `usefulLifeYears`, `parentId` |
| **Asset** | Tracked item | `assetCode`, `qrCode`, `status`, `condition`, `currentValue` |
| **AssetAssignment** | Check-out record | `status`, `assignedDate`, `actualReturnDate` |
| **MaintenanceRecord** | Service/AMC/warranty | `type`, `status`, `cost`, `nextDueDate` |
| **AssetRequest** | Self-service request | `requestCode`, `status` |
| **AuditLog** | Immutable trail | `action`, `module`, `entity`, `metadata` |

## Lifecycle (Asset.status)

```
AVAILABLE ──assign──► ASSIGNED ──return──► AVAILABLE
   │                                          │
   ├──► RESERVED ──► IN_TRANSIT               ├──► IN_MAINTENANCE ──► AVAILABLE
   │                                          │
   └──► RETIRED ──► DISPOSED        DAMAGED / LOST (exception states)
```
