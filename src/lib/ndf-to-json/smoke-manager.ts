import { AbstractManager } from "./abstract-manager";
import { NdfManager } from "./ndf-manager";

export type Smoke = {
  altitude: number;
  lifeSpan: number;
  radius: number;
}

export class SmokeManager extends AbstractManager {
  parse(): Smoke {
    const altitude = Math.round(NdfManager.parseNumberFromMetre(this.getValueFromSearch('Altitude')));
    const lifeSpan = Math.round(NdfManager.parseNumberFromSecond(this.getValueFromSearch('TimeToLive')));
    const radius = Math.round(NdfManager.parseNumberFromMetre(this.getValueFromSearch('Radius')));

    return {
      altitude,
      lifeSpan,
      radius
    }
  }
}