import { Transform } from "../transform";
import { nameRect } from "../../../var/unit-card-rects";

export class NameTransform extends Transform {
  name = "name";
  rectangle = nameRect;
  deserialize(input: string): string {
    const output = input;
    return output;
  }
}