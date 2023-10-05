import { search } from '@izohek/ndf-parser';
import { NdfConstant, NdfObject, ParserTuple } from '@izohek/ndf-parser/dist/src/types';
import { Command } from '@oclif/core';
import { NdfFilePathMap, NdfManager } from '../lib/ndf-to-json/ndf-manager';
import { Unit, UnitManager } from '../lib/ndf-to-json/unit-manager';
import { isNdfObject } from '../lib/ndf-to-json/utils';
import parseDivisionData from '../lib/parse/divisions';
import { diff } from 'json-diff';

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
  deckSerializer: 'DeckSerializer.ndf',
});

export interface DescriptorIdMap {
  [key: string]: number;
}

interface UnitData {
  version?: string;
  units: Unit[];
  divisions: any;
}

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

// replace values of object or array with null if they are NaN
const replaceNaNwithNull = (obj: any) => {
  if (typeof obj === 'object') {
    // eslint-disable-next-line guard-for-in
    for (const key in obj) {
      if (Number.isNaN(obj[key])) {
        obj[key] = null;
      } else {
        replaceNaNwithNull(obj[key]);
      }
    }
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      replaceNaNwithNull(item);
    }
  }
};

export default class NdfToJson extends Command {
  static description =
    'reads ndf files, outputs WarYes compatible datastructures';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static args = [
    { name: 'inputNdfFolder', required: true },
    {
      name: 'outputFile',
      required: true,
    },
    {
      name: 'previousNdfFolder',
      required: false,
    },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(NdfToJson);
    this.log('Extracting unit data from ndf files');

    const currentPatchData: UnitData = await this.extractNdfData(
      args.inputNdfFolder
    );

    let previousPatchData: UnitData;

    if (args.previousNdfFolder) {
      previousPatchData = await this.extractNdfData(args.previousNdfFolder);


      const patchDiff: any[] = [];

      for (const unit of currentPatchData.units) {
        const oldUnit = previousPatchData.units.find(
          (u) => u.descriptorName === unit.descriptorName
        );

        if (oldUnit) {
          const unitDiff = diff(oldUnit, unit);
          if (unitDiff) {
            patchDiff.push({
              descriptorName: unit.descriptorName,
              diff: unitDiff,
            });
          }
        } else {
          patchDiff.push({
            descriptorName: unit.descriptorName,
            new: true,
          });
        }
      }

      const divDiff: any[] = [];
      for(const division of currentPatchData.divisions) {
        const oldDivision = previousPatchData.divisions.find((d: any) => d.descriptor === division.descriptor);

        const newPacks = division.packs;
        const oldPacks = oldDivision?.packs || [];

        const divisionDiff: {
          descriptor: string;
          packDiff: any[];
        } = {
          descriptor: division.descriptor,
          packDiff: []
        };

        for(const pack of newPacks) {
          const oldPack = oldPacks.find((p: any) => p.packDescriptor === pack.packDescriptor);

          if(oldPack) {
            const packDiff = diff(oldPack, pack);

            if(packDiff) {
              divisionDiff.packDiff.push({
                descriptor: pack.unitDescriptor,
                pack: pack.packDescriptor,
                diff: packDiff,
              })
            }
          } else {
            divisionDiff.packDiff.push({
              descriptor: pack.unitDescriptor,
              pack: pack.packDescriptor,
              new: true,
            })
          }
        }


        divDiff.push(divisionDiff)
      }


      const combinedDiff = {
        unitStats: patchDiff,
        unitAvailability: divDiff
      }
      
      fs.writeFileSync('patch.json', JSON.stringify(combinedDiff));
    }

    // create a stripped down version of the unit data that only contains the descriptorName and the id, as well as all the division data
    const duplicatedCurrentPatchData = JSON.parse(
      JSON.stringify(currentPatchData)
    );

    let unitIndex = 0;
    for (const unit of duplicatedCurrentPatchData.units) {

      duplicatedCurrentPatchData.units[unitIndex] = {
        descriptorName: unit.descriptorName,
        id: unit.id,
        factoryDescriptorName: unit.factoryDescriptor,
        isCommand: unit.isCommand,
      };

      unitIndex++;
    }

    // create map of unitDescriptor 
    const strippedUnitDescriptorMap: { [key: string]: any } = {};
    for (const unit of duplicatedCurrentPatchData.units) {
      strippedUnitDescriptorMap[unit.descriptorName] = unit;
    }

    fs.writeFileSync(args.outputFile, JSON.stringify(currentPatchData));
    fs.writeFileSync(
      `${args.outputFile}.stripped`,
      JSON.stringify({
        units: duplicatedCurrentPatchData.units,
        divisions: duplicatedCurrentPatchData.divisions,
      })
    );

    this.log(`Done! 🎉 File written to ${args.outputFile}`);
  }

  private async extractNdfData(readDirectory: string) {
    const ndfFilePathMap: NdfFilePathMap = {};
    // eslint-disable-next-line guard-for-in
    for (const key in NDF_FILES) {
      ndfFilePathMap[key] = path.join(
        readDirectory,
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

    const divisionIds = (ndfs.deckSerializer[0] as NdfObject).attributes[0];
    const unitIds = (ndfs.deckSerializer[0] as NdfObject).attributes[2];

    const divisionIdTuples: ParserTuple[] = ((divisionIds.value as any).value);
    const unitIdTuples: ParserTuple[] = ((unitIds.value as any).value); 

    const divisionIdMap: DescriptorIdMap = {}; 
    const unitIdMap: DescriptorIdMap = {};

    for(const divisionIdTuple of divisionIdTuples) {
      const divisionDescriptor = `${NdfManager.extractNameFromTuple(divisionIdTuple)}`;
      const divisionId = NdfManager.extractValueFromTuple(divisionIdTuple);

      divisionIdMap[divisionDescriptor] = Number(divisionId);
    }

    for(const unitIdTuple of unitIdTuples) {
      const unitDescriptor = `${NdfManager.extractNameFromTuple(unitIdTuple)}`;
      const unitId = NdfManager.extractValueFromTuple(unitIdTuple);

      unitIdMap[unitDescriptor] = Number(unitId) + 1;
    }

    const speedModifiers = this.extractSpeedModifiers(ndfs.terrain);



    const outputJson: UnitData = {
      version: undefined,
      units: [] as Unit[],
      divisions: parseDivisionData({
        division: ndfs.divisions,
        rules: ndfs.rules,
        packs: ndfs.packs,
        costMatrix: ndfs.costMatrix,
        divisionIdMap: divisionIdMap,
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
          mappedMissileDescriptors,
          unitIdMap
        );
        const unit = unitManager.parse();

        const divisionsForUnit = this.divisionsForUnit(
          unit,
          outputJson.divisions
        );
        unit.divisions = divisionsForUnit;

        replaceNaNwithNull(unit);

        outputJson.units.push(unit);
      }
    }

    for (const buildingNdf of ndfs.building) {
      if (isNdfObject(buildingNdf)) {
        const buildingManager = new UnitManager(
          buildingNdf,
          speedModifiers,
          mappedWeaponDescriptors,
          mappedAmmoDescriptors,
          mappedSmokeDescriptors,
          mappedMissileDescriptors,
          unitIdMap
        );
        const building = buildingManager.parse();

        replaceNaNwithNull(building);
        outputJson.units.push(building);
      }
    }

    this.log('Data parsed. Writing to file...');

    return outputJson;
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

  private divisionsForUnit(unit: Unit, divisions: any[]) {
    const nationalityDivisions = divisions?.filter(
      (division) => division.alliance === unit.unitType.nationality
    );

    return nationalityDivisions
      ?.filter((division) => {
        return division.packs.find(
          (pack: any) => pack.unitDescriptor === unit.descriptorName
        );
      })
      .map((division) => division.descriptor);
  }
}
