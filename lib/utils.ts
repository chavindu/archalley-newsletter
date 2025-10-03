// Utility functions that don't require server-side dependencies

// Utility function to strip HTML tags and decode entities
export function stripHtmlTags(html: string): string {
  const noTags = html.replace(/<[^>]*>/g, '').trim()
  return decodeHtmlEntities(noTags)
}

// Decode common HTML entities including numeric codes
export function decodeHtmlEntities(input: string): string {
    if (!input) return ''
  
    const named: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: ' ',
      ndash: '–',
      mdash: '—',
      hellip: '…',
      rsquo: "'",
      lsquo: "'",
      rdquo: '"',
      ldquo: '"',
      copy: '©',
      reg: '®',
      trade: '™'
    }
  return input
    // numeric decimal and hex entities
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = parseInt(dec, 10)
      try { return String.fromCodePoint(code) } catch { return _m }
    })
    .replace(/&#x([\da-fA-F]+);/g, (_m, hex) => {
      const code = parseInt(hex, 16)
      try { return String.fromCodePoint(code) } catch { return _m }
    })
    // named entities
    .replace(/&([a-zA-Z]+);/g, (_m, name) => (name in named ? named[name] : _m))
}

// AES-256-GCM encryption helpers for OAuth tokens
export async function encryptToken(plaintext: string): Promise<string> {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
  }

  const keyBuffer = Buffer.from(key, 'base64')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const algorithm = { name: 'AES-GCM', iv }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  const encrypted = await crypto.subtle.encrypt(
    algorithm,
    cryptoKey,
    new TextEncoder().encode(plaintext)
  )

  // Combine IV + encrypted data + auth tag
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)

  return Buffer.from(combined).toString('base64')
}

export async function decryptToken(encryptedData: string): Promise<string> {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
  }

  const keyBuffer = Buffer.from(key, 'base64')
  const combined = Buffer.from(encryptedData, 'base64')
  
  const iv = combined.subarray(0, 12)
  const encrypted = combined.subarray(12)
  
  const algorithm = { name: 'AES-GCM', iv }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    algorithm,
    cryptoKey,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}