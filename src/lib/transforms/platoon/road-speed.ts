import { PlatoonTransform } from "./platoon";

export class RoadSpeedTransform extends PlatoonTransform {
  name: string = "roadSpeed";

  deserialize(input: string): string {

    if(input && input !== "") {
      return input.split("km/h")[0].trim();
    }

    return input;
  }
}