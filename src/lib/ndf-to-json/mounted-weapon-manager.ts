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
};

export class MountedWeaponManager extends AbstractManager {
  constructor(
    mountedWeaponDescriptor: NdfObject,
    mappedAmmo: MappedNdf,
    mappedSmoke: MappedNdf,
    mappedMissiles: MappedNdf,
    salvoMap: number[],
    bonusPrecision: number,
    i18nMap?: { [key: string]: string }
  ) {
    super(mountedWeaponDescriptor);
    this.mappedAmmo = mappedAmmo;
    this.mappedSmoke = mappedSmoke;
    this.mappedMissiles = mappedMissiles;
    this.salvoMap = salvoMap;
    this.bonusPrecision = bonusPrecision;
    this.i18nMap = i18nMap;

  }

  mappedAmmo: MappedNdf;
  mappedSmoke: MappedNdf;
  mappedMissiles: MappedNdf;
  salvoMap: number[];
  bonusPrecision: number;
  i18nMap?: { [key: string]: string };

  parse() {
    let showInterface = false;
    const showInInterfaceDeprec = this.getValueFromSearch('ShowInInterface') === 'True';
    const hideInInterface = this.getValueFromSearch('HideInInterface') === 'True';
    // Handle deprecated showInterface
    showInterface = !hideInInterface ? true : showInInterfaceDeprec

    const ammunitionPath = this.getValueFromSearch<string>('Ammunition');
    const ammoDescriptorId = NdfManager.extractLastToken(ammunitionPath);
    const ammoDescriptor = this.mappedAmmo[ammoDescriptorId];
    const ammunitionManager = new AmmunitionManager(
      ammoDescriptor as NdfObject,
      this.mappedSmoke,
      this.mappedMissiles,
      this.salvoMap,
      this.bonusPrecision,
      this.i18nMap
    );
    const ammo = ammunitionManager.parse();

    const numberOfWeapons = Number(this.getValueFromSearch('NbWeapons'));
    const salvoIndex = Number(this.getValueFromSearch('SalvoStockIndex'));

    const mountedWeapon: MountedWeapon = {
      showInterface: showInterface,
      numberOfWeapons,
      salvoIndex,
      ammo: ammo,
    };

    return mountedWeapon;
  }
}
