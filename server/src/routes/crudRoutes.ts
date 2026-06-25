import { Router } from 'express';
import { prisma } from '../config/db.js';
import { createCrudRepository, type CrudDelegate, type CrudConfig } from '../repositories/crudRepository.js';
import { createCrudService, type CrudServiceConfig } from '../services/crudService.js';
import { createCrudController } from '../controllers/crudController.js';
import { validate } from '../middlewares/validate.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';
import { PERMISSIONS, type PermissionKey } from '../models/permissions.js';
import { generateCode } from '../utils/codes.js';
import {
  vendorSchema, categorySchema, departmentSchema, locationSchema,
  employeeSchema, maintenanceSchema, requestSchema,
} from '../validations/resourceValidation.js';
import type { ZodTypeAny } from 'zod';

interface ResourceDef {
  delegate: CrudDelegate;
  repo: CrudConfig;
  service: Omit<CrudServiceConfig, 'resource' | 'module'> & { resource: string; module: string };
  perms: { view: PermissionKey; write: PermissionKey; remove?: PermissionKey };
  schemas: { create: ZodTypeAny; update: ZodTypeAny };
  defaultSort?: string;
}

const buildRouter = (def: ResourceDef): Router => {
  const repo = createCrudRepository(def.delegate, def.repo);
  const service = createCrudService(repo, def.service);
  const c = createCrudController(service, def.defaultSort);
  const r = Router();
  const removePerm = def.perms.remove ?? def.perms.write;

  r.get('/', requirePermission(def.perms.view), c.list);
  r.get('/:id', requirePermission(def.perms.view), c.get);
  r.post('/', requirePermission(def.perms.write), validate({ body: def.schemas.create }), c.create);
  r.patch('/:id', requirePermission(def.perms.write), validate({ body: def.schemas.update }), c.update);
  r.delete('/:id', requirePermission(removePerm), c.remove);
  return r;
};

/** Declarative registry → every entry becomes a fully-guarded REST resource. */
export const resourceRouters: Record<string, Router> = {
  categories: buildRouter({
    delegate: prisma.category as unknown as CrudDelegate,
    repo: { orgScoped: true, searchFields: ['name', 'code'], include: { _count: { select: { assets: true } } } },
    service: { resource: 'Category', module: 'Assets', orgScoped: true },
    perms: { view: PERMISSIONS.ASSET_VIEW.key, write: PERMISSIONS.CATEGORY_MANAGE.key },
    schemas: categorySchema,
  }),

  vendors: buildRouter({
    delegate: prisma.vendor as unknown as CrudDelegate,
    repo: { orgScoped: true, searchFields: ['vendorName', 'code', 'contactPerson', 'email'] },
    service: { resource: 'Vendor', module: 'Procurement', orgScoped: true },
    perms: { view: PERMISSIONS.VENDOR_VIEW.key, write: PERMISSIONS.VENDOR_MANAGE.key },
    schemas: vendorSchema,
  }),

  departments: buildRouter({
    delegate: prisma.department as unknown as CrudDelegate,
    repo: { orgScoped: true, searchFields: ['name', 'code'], include: { _count: { select: { employees: true } } } },
    service: { resource: 'Department', module: 'Administration', orgScoped: true },
    perms: { view: PERMISSIONS.EMPLOYEE_VIEW.key, write: PERMISSIONS.ADMIN_SETTINGS.key },
    schemas: departmentSchema,
  }),

  locations: buildRouter({
    delegate: prisma.location as unknown as CrudDelegate,
    repo: { orgScoped: true, searchFields: ['name', 'code', 'city', 'country'], include: { _count: { select: { assets: true } } } },
    service: { resource: 'Location', module: 'Administration', orgScoped: true },
    perms: { view: PERMISSIONS.ASSET_VIEW.key, write: PERMISSIONS.ADMIN_SETTINGS.key },
    schemas: locationSchema,
  }),

  employees: buildRouter({
    delegate: prisma.employee as unknown as CrudDelegate,
    repo: {
      orgScoped: true,
      searchFields: ['name', 'employeeCode', 'email', 'designation'],
      include: { department: { select: { id: true, name: true } }, location: { select: { id: true, name: true } } },
    },
    service: { resource: 'Employee', module: 'Employees', orgScoped: true },
    perms: { view: PERMISSIONS.EMPLOYEE_VIEW.key, write: PERMISSIONS.EMPLOYEE_MANAGE.key },
    schemas: employeeSchema,
  }),

  // Maintenance & requests scope through their parent asset/employee relation.
  maintenance: buildRouter({
    delegate: prisma.maintenanceRecord as unknown as CrudDelegate,
    repo: {
      orgScoped: false,
      searchFields: ['title', 'description', 'performedBy'],
      include: { asset: { select: { id: true, name: true, assetCode: true } }, vendor: { select: { id: true, vendorName: true } } },
    },
    service: { resource: 'MaintenanceRecord', module: 'Maintenance' },
    perms: { view: PERMISSIONS.MAINTENANCE_VIEW.key, write: PERMISSIONS.MAINTENANCE_MANAGE.key },
    schemas: maintenanceSchema,
    defaultSort: 'scheduledDate',
  }),

  requests: buildRouter({
    delegate: prisma.assetRequest as unknown as CrudDelegate,
    repo: {
      orgScoped: false,
      searchFields: ['requestCode', 'categoryName', 'justification'],
      include: { employee: { select: { id: true, name: true, employeeCode: true } }, approvedBy: { select: { id: true, name: true } } },
    },
    service: {
      resource: 'AssetRequest', module: 'Procurement',
      prepareCreate: (data) => ({ ...data, requestCode: generateCode('REQ') }),
    },
    perms: { view: PERMISSIONS.REQUEST_VIEW.key, write: PERMISSIONS.REQUEST_CREATE.key, remove: PERMISSIONS.REQUEST_APPROVE.key },
    schemas: requestSchema,
  }),
};
