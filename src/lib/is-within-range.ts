export function isWithinRange(
  a: number,
  topRange: number,
  bottomRange: number
): boolean {
  if (a <= topRange && a >= bottomRange) {
    return true;
  }

  return false;
}