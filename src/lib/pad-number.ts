export function padNumber(number: number, padString: string = '00000'): string {
  const str = String(number);
  const ans =
    padString.slice(0, Math.max(0, padString.length - str.length)) + str;
  return ans;
}
