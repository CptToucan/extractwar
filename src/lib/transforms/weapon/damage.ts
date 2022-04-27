import { WeaponTransform, Pos } from "./weapon";
import { Rectangle } from "tesseract.js";

export class DamageTransform extends WeaponTransform {
  constructor(name: string, rect: Rectangle, startPos: Pos) {
    super(rect, startPos);
    this.name = name;
  }
}