export function removeLinebreaks(str: string): string {
  return str.replace(/[\r\n]+/gm, "");
}