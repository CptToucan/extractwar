import { WeaponTransform, Pos } from "./weapon";
import { Rectangle } from "tesseract.js";

export class TargetRangeTransform extends WeaponTransform {
  constructor(name: string, rect: Rectangle, startPos: Pos) {
    super(rect, startPos);
    this.name = name;
  }

  deserialize(input: string): string {
    const output = input.replace("- ", "");
    return output;
  }
}