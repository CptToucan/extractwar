import { Transform } from "../transform";
import { Rectangle } from "tesseract.js";

export interface Pos {
  top: number,
  left: number
}

export class WeaponTransform extends Transform {
  constructor(rect: Rectangle, startPos: Pos) {
    const translatedRect: Rectangle = {
      height: rect.height,
      width: rect.width,
      top: rect.top + startPos.top,
      left: rect.left + startPos.left
    }
    super(translatedRect);
  }
}