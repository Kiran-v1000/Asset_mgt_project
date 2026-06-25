import { prisma } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { comparePassword } from '../utils/encryption.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { recordAudit } from './auditService.js';
import type { AuthContext } from '../models/types.js';

interface LoginMeta { ipAddress?: string; userAgent?: string }

const publicUser = (u: {
  id: string; name: string; email: string; avatarUrl: string | null;
  role: { id: string; name: string }; organizationId: string;
  permissions: string[];
}) => ({
  id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl,
  role: u.role, organizationId: u.organizationId, permissions: u.permissions,
});

export const authService = {
  async login(email: string, password: string, meta: LoginMeta) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    // Constant-ish failure path — same message whether email or password is wrong.
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const permissions = user.role.permissions.map((rp) => rp.permission.key);
    const tokenPayload = {
      sub: user.id, organizationId: user.organizationId, roleId: user.roleId, email: user.email,
    };

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const actor: AuthContext = {
      userId: user.id, organizationId: user.organizationId, roleId: user.roleId,
      email: user.email, name: user.name, permissions,
    };
    await recordAudit(actor, {
      action: 'LOGIN', module: 'Auth', entity: 'User', entityId: user.id,
      summary: `${user.name} signed in`, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
    });

    return {
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
      user: publicUser({
        id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl,
        role: { id: user.role.id, name: user.role.name },
        organizationId: user.organizationId, permissions,
      }),
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        department: true, location: true, organization: true,
      },
    });
    if (!user) throw AppError.notFound('User');
    return publicUser({
      id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl,
      role: { id: user.role.id, name: user.role.name },
      organizationId: user.organizationId,
      permissions: user.role.permissions.map((rp) => rp.permission.key),
    });
  },
};
