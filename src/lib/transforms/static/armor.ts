import { Transform } from "../transform";
import { Rectangle } from "tesseract.js";

export class ArmorTransform extends Transform {
  constructor(name: string, rect: Rectangle) {
    super(rect);
    this.name = name;
  }

  deserialize(input: string): string {
    let output = '';

    for (const char of input) {
      let outChar = char;
      if (char === 'o' || char === 'O' || char === 'D') {
        outChar = '0';
      }

      output += outChar;
    }

    return output;
  }
}