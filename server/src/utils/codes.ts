import { randomBytes } from 'node:crypto';

/** Human-readable sequential-ish code, e.g. AST-7F3K9Q. */
export const generateCode = (prefix: string): string => {
  const token = randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `${prefix}-${token}`;
};

/** Opaque token embedded in a QR/scan payload. */
export const generateQrToken = (): string => randomBytes(12).toString('hex');
