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
