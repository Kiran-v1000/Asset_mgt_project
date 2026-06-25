import { z } from 'zod';

/** Validation schemas for the simple CRUD resources (create + update pairs). */

const vendorCreate = z.object({
  vendorName: z.string().min(2),
  code: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
});
export const vendorSchema = { create: vendorCreate, update: vendorCreate.partial() };

const categoryCreate = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'NONE']).optional(),
  depreciationRate: z.coerce.number().min(0).max(100).optional(),
  usefulLifeYears: z.coerce.number().int().min(0).optional(),
  icon: z.string().optional(),
});
export const categorySchema = { create: categoryCreate, update: categoryCreate.partial() };

const departmentCreate = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  costCenter: z.string().optional(),
});
export const departmentSchema = { create: departmentCreate, update: departmentCreate.partial() };

const locationCreate = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});
export const locationSchema = { create: locationCreate, update: locationCreate.partial() };

const employeeCreate = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export const employeeSchema = { create: employeeCreate, update: employeeCreate.partial() };

const maintenanceCreate = z.object({
  assetId: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'AMC', 'WARRANTY_CLAIM', 'INSPECTION']),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledDate: z.coerce.date().optional().nullable(),
  completedDate: z.coerce.date().optional().nullable(),
  nextDueDate: z.coerce.date().optional().nullable(),
  cost: z.coerce.number().min(0).optional(),
  performedBy: z.string().optional(),
});
export const maintenanceSchema = { create: maintenanceCreate, update: maintenanceCreate.partial() };

const requestCreate = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['NEW_ASSET', 'REPLACEMENT', 'RETURN', 'REPAIR']).optional(),
  categoryName: z.string().optional(),
  justification: z.string().optional(),
});
const requestUpdate = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED']).optional(),
  approverNote: z.string().optional(),
});
export const requestSchema = { create: requestCreate, update: requestUpdate };
