import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { MFASetup } from '@pace/shared'

const APP_NAME = 'Kaduri Connection CRM'
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'your-32-char-secret-key-here!!' // Should be 32 chars
const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypt MFA secret before storing in database
 */
function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt MFA secret when retrieving from database
 */
function decryptSecret(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = parts[1]
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Generate backup codes for MFA recovery
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
  }
  return codes
}

/**
 * Setup MFA for a user
 */
export async function setupMFA(userId: string): Promise<MFASetup> {
  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error('User not found')
  }

  if (user.mfaEnabled) {
    throw new Error('MFA is already enabled for this user')
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${user.email})`,
    issuer: APP_NAME,
    length: 32,
  })

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  // Generate backup codes
  const backupCodes = generateBackupCodes()

  // Encrypt and store secret (but don't enable MFA yet - user must verify first)
  const encryptedSecret = encryptSecret(secret.base32)

  await db
    .update(users)
    .set({
      mfaSecret: encryptedSecret,
      mfaBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  }
}

/**
 * Verify MFA token and enable MFA
 */
export async function verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error('User not found')
  }

  if (!user.mfaSecret) {
    throw new Error('MFA not set up for this user')
  }

  // Decrypt secret
  const secret = decryptSecret(user.mfaSecret)

  // Verify token
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after for clock skew
  })

  if (!verified) {
    return false
  }

  // Enable MFA
  await db
    .update(users)
    .set({
      mfaEnabled: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return true
}

/**
 * Verify MFA token for login
 */
export async function verifyMFAToken(userId: string, token: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error('User not found')
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new Error('MFA not enabled for this user')
  }

  // Decrypt secret
  const secret = decryptSecret(user.mfaSecret)

  // Verify token
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  })
}

/**
 * Verify backup code and disable it
 */
export async function verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error('User not found')
  }

  if (!user.mfaEnabled || !user.mfaBackupCodes) {
    throw new Error('MFA not enabled or no backup codes available')
  }

  const backupCodes: string[] = JSON.parse(user.mfaBackupCodes)
  const codeIndex = backupCodes.indexOf(backupCode.toUpperCase())

  if (codeIndex === -1) {
    return false
  }

  // Remove used backup code
  backupCodes.splice(codeIndex, 1)

  await db
    .update(users)
    .set({
      mfaBackupCodes: JSON.stringify(backupCodes),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return true
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  return user?.mfaEnabled ?? false
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user || !user.mfaBackupCodes) {
    return 0
  }
  const codes: string[] = JSON.parse(user.mfaBackupCodes)
  return codes.length
}
