import { NdfObject } from '@izohek/ndf-parser/dist/src/types';
import { MappedNdf, NdfManager } from './ndf-manager';
import { AbstractManager } from './abstract-manager';
import { Ammo, AmmunitionManager } from './ammunition-manager';
import { NdfExtractAsJson } from '../../commands/ndf-to-json';

export type MountedWeapon = {
  showInterface: boolean;
  numberOfWeapons: number;
  ammo: Ammo;
  salvoIndex: number;
}

export class MountedWeaponManager extends AbstractManager {
  constructor(mountedWeaponDescriptor: NdfObject, mappedAmmo: MappedNdf, mappedSmoke: MappedNdf, mappedMissiles: MappedNdf, salvoMap: number[], bonusPrecision: number) {
    super(mountedWeaponDescriptor);
    this.mappedAmmo = mappedAmmo;
    this.mappedSmoke = mappedSmoke;
    this.mappedMissiles = mappedMissiles;
    this.salvoMap = salvoMap;
    this.bonusPrecision = bonusPrecision;

  }

  mappedAmmo: MappedNdf;
  mappedSmoke: MappedNdf;
  mappedMissiles: MappedNdf;
  salvoMap: number[];
  bonusPrecision: number;

  parse() {
    const showInterface = this.getValueFromSearch('ShowInInterface') === 'True';
    const ammunitionPath = this.getValueFromSearch<string>('Ammunition');
    const ammoDescriptorId = NdfManager.extractLastToken(ammunitionPath);
    const ammoDescriptor = this.mappedAmmo[ammoDescriptorId];
    const ammunitionManager = new AmmunitionManager(ammoDescriptor as NdfObject, this.mappedSmoke, this.mappedMissiles, this.salvoMap, this.bonusPrecision);
    const ammo = ammunitionManager.parse();


    const numberOfWeapons = Number(this.getValueFromSearch('NbWeapons'));
    const salvoIndex = Number(this.getValueFromSearch('SalvoStockIndex'));

    const mountedWeapon: MountedWeapon = {
      showInterface,
      numberOfWeapons,
      salvoIndex,
      ammo: ammo
    };

    return mountedWeapon;
  }
}
