import { AbstractManager } from './abstract-manager';
import { NdfManager } from './ndf-manager';

export type Smoke = {
  altitude: number;
  lifeSpan: number;
  radius: number;
};

export class SmokeManager extends AbstractManager {
  parse(): Smoke {
    let altitude = 0;

    if (this.getFirstSearchResult('AltitudeGRU')) {
      altitude = Number(this.getValueFromSearch('AltitudeGRU'));
    } else {
      Math.round(
        NdfManager.parseNumberFromMetre(this.getValueFromSearch('Altitude'))
      );
    }

    let radius = 0;

    if (this.getFirstSearchResult('RadiusGRU')) {
      radius = Number(this.getValueFromSearch('RadiusGRU'));
    } else {
      Math.round(
        NdfManager.parseNumberFromMetre(this.getValueFromSearch('Radius'))
      );
    }

    const lifeSpan = Math.round(
      NdfManager.parseNumberFromSecond(this.getValueFromSearch('TimeToLive'))
    );

    return {
      altitude,
      lifeSpan,
      radius,
    };
  }
}
