import { Prisma } from '@prisma/client'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM field encryption.
// Stores either:
// - Encrypted: { v: 1, alg: 'aes-256-gcm', iv, tag, ct }
// - Plain fallback (no key configured): { v: 0, alg: 'plain', pt }
//
// Rationale: service must keep working even when env is not configured.

const ALG = 'aes-256-gcm'

const getKeyOptional = () => {
  const raw = process.env.PII_ENCRYPTION_KEY
  if (!raw) {
    return null
  }

  // Accept base64 (recommended) or hex.
  const key = /^[0-9a-fA-F]+$/.test(raw.trim()) ? Buffer.from(raw.trim(), 'hex') : Buffer.from(raw.trim(), 'base64')
  if (key.length !== 32) {
    // Misconfigured key should not crash the whole app; treat as absent.
    return null
  }

  return key
}

export type EncryptedField = {
  v: 1
  alg: 'aes-256-gcm'
  iv: string
  tag: string
  ct: string
}

export type PlainField = {
  v: 0
  alg: 'plain'
  pt: string
}

export type StoredField = EncryptedField | PlainField

export const encryptField = (plaintext?: string | null): StoredField | null => {
  if (plaintext == null) {
    return null
  }

  const text = String(plaintext)
  if (text.trim() === '') {
    return null
  }

  const key = getKeyOptional()
  if (!key) {
    return { v: 0, alg: 'plain', pt: text }
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv(ALG, key, iv)
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    v: 1,
    alg: ALG,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64')
  }
}

// Prisma JSON fields can't be assigned JS null directly in a typed way; use Prisma.JsonNull.
export const toPrismaJson = (value: StoredField | null) => {
  return value ?? Prisma.JsonNull
}

export const decryptField = (field?: unknown): string | null => {
  if (!field) {
    return null
  }

  if (typeof field === 'string') {
    return field
  }

  const value = field as any
  if (value?.alg === 'plain' && value?.v === 0 && typeof value?.pt === 'string') {
    return value.pt
  }

  if (value?.alg !== ALG || value?.v !== 1 || !value?.iv || !value?.tag || !value?.ct) {
    return null
  }

  const key = getKeyOptional()
  if (!key) {
    // Can't decrypt without a key.
    return null
  }
  const iv = Buffer.from(value.iv, 'base64')
  const tag = Buffer.from(value.tag, 'base64')
  const ct = Buffer.from(value.ct, 'base64')

  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString('utf8')
}
