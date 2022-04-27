import { Rectangle } from "tesseract.js";

export class Transform {
  rectangle: Rectangle;
  name: string =  "transform";


  constructor(rect: Rectangle) {
    this.rectangle = rect;
  }

  deserialize(input: string): string {
    const output = input;
    return output;
  }

  
}