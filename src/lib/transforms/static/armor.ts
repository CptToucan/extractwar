import { Transform } from "../transform";
import { Rectangle } from "tesseract.js";

export class ArmorTransform extends Transform {
  constructor(name: string, rect: Rectangle) {
    super(rect);
    this.name = name;
  }

  deserialize(input: string): string {
    let output = input;

    if(input === "aw") {
      output = "0"
    }
    else if(input === "<1") {
      output = "0.5"
    }

    return output;
  }
}