import { WeaponTransform, Pos } from "./weapon";
import { Rectangle } from "tesseract.js";

export class AccuracyTransform extends WeaponTransform {
  constructor(name: string, rect: Rectangle, startPos: Pos) {
    super(rect, startPos);
    this.name = name;
  }

  deserialize(input: string): string {

    if(input && input !== "") {
      const output = Number.parseFloat(input);
      const decimalPercentage = output / 100;
      return `${decimalPercentage}`
    }

    return input;
  }
}