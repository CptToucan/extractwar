import { search } from '@izohek/ndf-parser';
import { AbstractManager } from './abstract-manager';
import { NdfManager } from './ndf-manager';

export type Missile = {
  maxMissileSpeed: number;
  maxMissileAcceleration: number;
};

export class MissileManager extends AbstractManager {
  parse(): Missile {
    const maxMissileSpeed = this.getConfigAttribute('MaxSpeedGRU', 'MaxSpeed');
    const maxMissileAcceleration = this.getConfigAttribute(
      'MaxAccelerationGRU',
      'MaxAcceleration'
    );

    return {
      maxMissileSpeed,
      maxMissileAcceleration,
    };
  }

  getConfigAttribute(attribute: string, backupAttribute: string): number {
    const defaultConfig = this.getFirstSearchResult('DefaultConfig');

    let returnValue = 0;
    try {
      const result = search(defaultConfig, attribute)[0];
      const value = NdfManager.extractValueFromSearchResult(result) as number;
      returnValue = Math.round(value);
    } catch {
      const result = search(defaultConfig, backupAttribute)[0];
      const value = NdfManager.extractValueFromSearchResult(result) as string;
      const valueInMetres = NdfManager.parseNumberFromMetre(value);
      returnValue = Math.round(valueInMetres);
    }

    return returnValue;
  }
}
