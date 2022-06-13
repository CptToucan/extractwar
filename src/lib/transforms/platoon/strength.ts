import { PlatoonTransform } from "./platoon";

export class StrengthTransform extends PlatoonTransform {
  name: string = "strength";

  deserialize(input: string): string {
    let output = input;

    if(input === "©") {
      output = "9";
    }
    
    return output;
  }
}