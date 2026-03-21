import crypto from 'crypto';

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function calculateExpiryDate(daysFromNow: number, fromDate: Date = new Date()): Date {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + daysFromNow);
  return expiry;
}
