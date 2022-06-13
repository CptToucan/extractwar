import { PlatoonTransform } from "./platoon";

export class EcmTransform extends PlatoonTransform {
  name: string = "ecm";

  deserialize(input: string): string {

    if(input && input !== "") {
      const output = Number.parseFloat(input);
      const decimalPercentage = output / 100;
      return `${decimalPercentage}`
    }

    return input;
  }
}