import { search } from '@izohek/ndf-parser';
import { NdfConstant, NdfObject } from '@izohek/ndf-parser/dist/src/types';
import { Command } from '@oclif/core';
import { fstat } from 'fs';
import {
  NdfFilePathMap,
  NdfManager,
  NdfObjectMap,
} from '../lib/ndf-to-json/ndf-manager';
import { Unit, UnitManager } from '../lib/ndf-to-json/unit-manager';
import { isNdfObject } from '../lib/ndf-to-json/utils';
import parseDivisionData from '../lib/parse/divisions';

const path = require('path');
const fs = require('fs');

const NDF_FILES = Object.freeze({
  units: 'UniteDescriptor.ndf',
  ammo: 'Ammunition.ndf',
  weapon: 'WeaponDescriptor.ndf',
  rules: 'DivisionRules.ndf',
  divisions: 'Divisions.ndf',
  costMatrix: 'DivisionCostMatrix.ndf',
  packs: 'Packs.ndf',
  terrain: 'Terrains.ndf',
  smoke: 'SmokeDescriptor.ndf',
  missile: 'MissileDescriptors.ndf',
  building: 'BuildingDescriptors.ndf',
});

export type SpeedModifier = {
  name: string;
  descriptorName: string;
  movementTypes: {
    AllTerrainWheel: {
      name: string;
      value: number;
    };
    Infantry: {
      name: string;
      value: number;
    };
    Track: {
      name: string;
      value: number;
    };
  };
};

export interface NdfExtractAsJson {
  [key: string]: unknown;
}

export default class NdfToJson extends Command {
  static description =
    'reads ndf files, outputs WarYes compatible datastructures';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = [
    { name: 'inputNdfFolder', required: true },
    {
      name: 'outputFile',
      required: true,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(NdfToJson);
    this.log('Extracting unit data from ndf files');

    const ndfFilePathMap: NdfFilePathMap = {};
    // eslint-disable-next-line guard-for-in
    for (const key in NDF_FILES) {
      ndfFilePathMap[key] = path.join(
        args.inputNdfFolder,
        NDF_FILES[key as keyof typeof NDF_FILES]
      );
    }

    const ndfManager = new NdfManager(ndfFilePathMap);
    const ndfs = await ndfManager.parse();

    /**
     * Mapping weapons and ammo out to be mapped by keys will save us many iterations when units need to find weapons, and weapons need to find ammo
     */
    const mappedWeaponDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.weapon
    );
    const mappedAmmoDescriptors = NdfManager.mapDescriptorsToKeyMap(ndfs.ammo);
    const mappedSmokeDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.smoke
    );
    const mappedMissileDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.missile
    );

    const speedModifiers = this.extractSpeedModifiers(ndfs.terrain);

    const outputJson = {
      version: undefined,
      units: [] as Unit[],
      divisions: parseDivisionData({
        division: ndfs.divisions,
        rules: ndfs.rules,
        packs: ndfs.packs,
        costMatrix: ndfs.costMatrix,
      }),
    };

    for (const unitNdf of ndfs.units) {
      if (isNdfObject(unitNdf)) {
        const unitManager = new UnitManager(
          unitNdf,
          speedModifiers,
          mappedWeaponDescriptors,
          mappedAmmoDescriptors,
          mappedSmokeDescriptors,
          mappedMissileDescriptors
        );
        const unit = unitManager.parse();
        outputJson.units.push(unit);
      }
    }

    for(const buildingNdf of ndfs.building) {
      if(isNdfObject(buildingNdf)) {
        const buildingManager = new UnitManager(
          buildingNdf,
          speedModifiers,
          mappedWeaponDescriptors,
          mappedAmmoDescriptors,
          mappedSmokeDescriptors,
          mappedMissileDescriptors
        );
        const building = buildingManager.parse();
        outputJson.units.push(building);
      }
    }

    this.log('Data parsed. Writing to file...');
    fs.writeFileSync(args.outputFile, JSON.stringify(outputJson));
    this.log(`Done! 🎉 File written to ${args.outputFile}`);
  }

  /**
   * Extracts speed modifiers from terrain descriptors
   * @param terrains  Array of terrain descriptors
   * @returns  Array of speed modifiers
   */
  private extractSpeedModifiers(
    terrains: (NdfObject | NdfConstant)[]
  ): SpeedModifier[] {
    const validTerrains = [
      { descriptorName: 'ForetLegere', name: 'forest' },
      { descriptorName: 'Batiment', name: 'building' },
      { descriptorName: 'Ruin', name: 'ruins' },
    ];

    const speedModifiers = [];

    for (const terrainDescriptor of terrains) {
      if (isNdfObject(terrainDescriptor)) {
        const terrain = validTerrains.find(
          (terrain) => terrain.descriptorName === terrainDescriptor.name
        );

        if (terrain) {
          const wheel = NdfManager.extractValueFromSearchResult(
            search(terrainDescriptor, 'SpeedModifierAllTerrainWheel')[0]
          );
          const infantry = NdfManager.extractValueFromSearchResult(
            search(terrainDescriptor, 'SpeedModifierInfantry')[0]
          );
          const track = NdfManager.extractValueFromSearchResult(
            search(terrainDescriptor, 'SpeedModifierTrack')[0]
          );

          speedModifiers.push({
            name: terrain.name,
            descriptorName: terrain.descriptorName,
            movementTypes: {
              AllTerrainWheel: {
                name: 'wheel',
                value: Number(wheel),
              },
              Infantry: {
                name: 'infantry',
                value: Number(infantry),
              },
              Track: {
                name: 'track',
                value: Number(track),
              },
            },
          });
        }
      }
    }

    return speedModifiers;
  }
}
