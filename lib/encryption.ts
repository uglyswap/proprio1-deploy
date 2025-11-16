/**
 * Service de chiffrement pour les données sensibles
 * (API keys, mots de passe DB, etc.)
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

function getKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'default-secret-change-me'
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Chiffre une chaîne de caractères
 */
export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey(salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

/**
 * Déchiffre une chaîne de caractères
 */
export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64')

  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
  const encrypted = buffer.subarray(ENCRYPTED_POSITION)

  const key = getKey(salt)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(encrypted) + decipher.final('utf8')
}

/**
 * Hash une valeur (pour recherche sans déchiffrement)
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')
}
