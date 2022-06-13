import { WeaponTransform, Pos } from "./weapon";
import { Rectangle } from "tesseract.js";

export class TimeTransform extends WeaponTransform {
  constructor(name: string, rect: Rectangle, startPos: Pos) {
    super(rect, startPos);
    this.name = name;
  }

  deserialize(input: string): string {
    let output = input.split("s")[0].trim();

    if(output.startsWith("0")) {
      output = `0.${output.slice(1)}`;
    }
    else if(output.length > 2 && !output.includes(".")) {
      output = `${output[0]}.${output.slice(1)}`;
    }

    return output;
  }
}