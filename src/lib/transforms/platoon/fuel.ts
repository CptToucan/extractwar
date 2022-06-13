import { PlatoonTransform } from "./platoon";

export class FuelTransform extends PlatoonTransform {
  name: string = "fuel";

  deserialize(input: string): string {

    if(input && input !== "") {
      return input.split("L")[0].trim();
    }

    return input;
  }
}