import { PlatoonTransform } from "./platoon";

export class SpeedTransform extends PlatoonTransform {
  name: string = "speed";

  deserialize(input: string): string {

    if(input && input !== "") {
      return input.split("km/h")[0].trim();
    }

    return input;
  }
}