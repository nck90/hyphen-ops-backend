import { Prisma } from '@prisma/client'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM field encryption.
// Stores { v: 1, alg: 'aes-256-gcm', iv, tag, ct } in JSON.

const ALG = 'aes-256-gcm'

const getKey = () => {
  const raw = process.env.PII_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('Missing env: PII_ENCRYPTION_KEY')
  }

  // Accept base64 (recommended) or hex.
  const key = /^[0-9a-fA-F]+$/.test(raw.trim()) ? Buffer.from(raw.trim(), 'hex') : Buffer.from(raw.trim(), 'base64')
  if (key.length !== 32) {
    throw new Error('PII_ENCRYPTION_KEY must be 32 bytes (base64 or hex)')
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

export const encryptField = (plaintext?: string | null): EncryptedField | null => {
  if (plaintext == null) {
    return null
  }

  const text = String(plaintext)
  if (text.trim() === '') {
    return null
  }

  const key = getKey()
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
export const toPrismaJson = (value: EncryptedField | null) => {
  return value ?? Prisma.JsonNull
}

export const decryptField = (field?: unknown): string | null => {
  if (!field) {
    return null
  }

  const value = field as Partial<EncryptedField>
  if (value.alg !== ALG || value.v !== 1 || !value.iv || !value.tag || !value.ct) {
    return null
  }

  const key = getKey()
  const iv = Buffer.from(value.iv, 'base64')
  const tag = Buffer.from(value.tag, 'base64')
  const ct = Buffer.from(value.ct, 'base64')

  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString('utf8')
}

