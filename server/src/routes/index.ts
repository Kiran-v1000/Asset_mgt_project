import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { PERMISSIONS } from '../models/permissions.js';

import { authController } from '../controllers/authController.js';
import { assetController } from '../controllers/assetController.js';
import { assignmentController } from '../controllers/assignmentController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { auditController } from '../controllers/auditController.js';
import { userController } from '../controllers/userController.js';
import { resourceRouters } from './crudRoutes.js';

import { loginSchema } from '../validations/authValidation.js';
import { createAssetSchema, updateAssetSchema } from '../validations/assetValidation.js';
import { assignAssetSchema, returnAssetSchema } from '../validations/assignmentValidation.js';

const router = Router();

// ---- Public ----
router.post('/auth/login', validate({ body: loginSchema }), authController.login);

// ---- Everything below requires a valid token ----
router.use(authenticate);

router.get('/auth/me', authController.me);
router.post('/auth/logout', authController.logout);

// Dashboard
router.get('/dashboard/overview', requirePermission(PERMISSIONS.DASHBOARD_VIEW.key), dashboardController.overview);
router.get('/dashboard/trend', requirePermission(PERMISSIONS.DASHBOARD_VIEW.key), dashboardController.trend);

// Assets
router.get('/assets', requirePermission(PERMISSIONS.ASSET_VIEW.key), assetController.list);
router.get('/assets/:id', requirePermission(PERMISSIONS.ASSET_VIEW.key), assetController.get);
router.post('/assets', requirePermission(PERMISSIONS.ASSET_CREATE.key), validate({ body: createAssetSchema }), assetController.create);
router.patch('/assets/:id', requirePermission(PERMISSIONS.ASSET_UPDATE.key), validate({ body: updateAssetSchema }), assetController.update);
router.delete('/assets/:id', requirePermission(PERMISSIONS.ASSET_DELETE.key), assetController.remove);

// Assignments (assign / return)
router.get('/assignments', requirePermission(PERMISSIONS.ASSET_VIEW.key), assignmentController.list);
router.post('/assignments', requirePermission(PERMISSIONS.ASSET_ASSIGN.key), validate({ body: assignAssetSchema }), assignmentController.assign);
router.post('/assignments/:id/return', requirePermission(PERMISSIONS.ASSET_ASSIGN.key), validate({ body: returnAssetSchema }), assignmentController.return);

// Audit & compliance
router.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_VIEW.key), auditController.list);

// Administration — users & roles
router.get('/users', requirePermission(PERMISSIONS.ADMIN_USERS.key), userController.list);
router.post('/users', requirePermission(PERMISSIONS.ADMIN_USERS.key), userController.create);
router.patch('/users/:id', requirePermission(PERMISSIONS.ADMIN_USERS.key), userController.update);
router.delete('/users/:id', requirePermission(PERMISSIONS.ADMIN_USERS.key), userController.remove);
router.get('/roles', requirePermission(PERMISSIONS.ADMIN_ROLES.key), userController.roles);

// Registry-driven resources
router.use('/categories', resourceRouters.categories);
router.use('/vendors', resourceRouters.vendors);
router.use('/departments', resourceRouters.departments);
router.use('/locations', resourceRouters.locations);
router.use('/employees', resourceRouters.employees);
router.use('/maintenance', resourceRouters.maintenance);
router.use('/requests', resourceRouters.requests);

export default router;
