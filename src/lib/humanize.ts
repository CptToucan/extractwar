export function humanize(str: string): string {
  return str
      .replace(/^[\s_]+|[\s_]+$/g, '')
      .replace(/[\s_]+/g, ' ')
      .replace(/^[a-z]/, function(m: string) { return m.toUpperCase(); });
}