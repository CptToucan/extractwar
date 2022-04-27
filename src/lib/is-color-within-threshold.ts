import { isWithinRange } from './is-within-range';
import { rgbaColor } from '../var/colors';

export function isColorWithinThreshold(
  testColor: rgbaColor,
  matchColor: rgbaColor,
  threshold: number
): boolean {
  if (
    isWithinRange(
      testColor.r,
      matchColor.r + threshold,
      matchColor.r - threshold
    ) &&
    isWithinRange(
      testColor.g,
      matchColor.g + threshold,
      matchColor.g - threshold
    ) &&
    isWithinRange(
      testColor.b,
      matchColor.b + threshold,
      matchColor.b - threshold
    ) &&
    isWithinRange(
      testColor.a,
      matchColor.a + threshold,
      matchColor.a - threshold
    )
  ) {
    return true;
  }

  return false;
}