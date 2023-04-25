import { search } from '@izohek/ndf-parser';
import { AbstractManager } from './abstract-manager';
import { NdfManager } from './ndf-manager';

export type Missile = {
  maxMissileSpeed: number;
  maxMissileAcceleration: number;
}

export class MissileManager extends AbstractManager {
  parse(): Missile {
    const maxMissileSpeed = this.getConfigAttribute('MaxSpeed');
    const maxMissileAcceleration = this.getConfigAttribute('MaxAcceleration');

    return {
      maxMissileSpeed,
      maxMissileAcceleration,
    }
  }

  getConfigAttribute(attribute: string): number {
    const defaultConfig = this.getFirstSearchResult('DefaultConfig');

    const value = NdfManager.parseSpeedNumberFromMetre(
      NdfManager.extractValueFromSearchResult(
        search(defaultConfig, attribute)[0]
      )
    );

    return Math.round(value);
  }
}
