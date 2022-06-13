import { PlatoonTransform } from "./platoon";

export class AutonomyTransform extends PlatoonTransform {
  name: string = "autonomy";

  deserialize(input: string): string {

    if(input && input !== "") {
      return input.split("km")[0].trim();
    }

    return input;
  }
}