import { search } from '@izohek/ndf-parser';
import {
  NdfConstant,
  NdfObject,
  ParserTuple,
} from '@izohek/ndf-parser/dist/src/types';
import { Command } from '@oclif/core';
import { NdfFilePathMap, NdfManager } from '../lib/ndf-to-json/ndf-manager';
import { Unit, UnitManager } from '../lib/ndf-to-json/unit-manager';
import { extractValuesFromFile, isNdfObject } from '../lib/ndf-to-json/utils';
import parseDivisionData from '../lib/parse/divisions';
import { diff } from 'json-diff';

const path = require('path');
const fs = require('fs');

const NDF_FILES = Object.freeze({
  units: 'UniteDescriptor.ndf',
  ammo: 'Ammunition.ndf',
  ammoMissiles: 'AmmunitionMissiles.ndf',
  weapon: 'WeaponDescriptor.ndf',
  rules: 'DivisionRules.ndf',
  divisions: 'Divisions.ndf',
  costMatrix: 'DivisionCostMatrix.ndf',
  packs: 'Packs.ndf',
  divisionPacks: 'DivisionPacks.ndf',
  terrain: 'Terrains.ndf',
  smoke: 'SmokeDescriptor.ndf',
  missile: 'MissileDescriptors.ndf',
  building: 'BuildingDescriptors.ndf',
  deckSerializer: 'DeckSerializer.ndf',
  hitRollConstants: 'HitRollConstants.ndf',
  damageResistance: 'DamageResistance.ndf',
  weaponConstants: 'WeaponConstantes.ndf',
});

export interface DescriptorIdMap {
  [key: string]: number;
}

interface UnitData {
  version?: string;
  units: Unit[];
  divisions: any;
}

export type FamilyIndexTuple = {
  family: string;
  maxIndex: number;
};

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

export type TerrainResistance = {
  damageFamily: any;
  resistances: {
    type: any;
    value: number;
  }[];
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

    const { unitData: currentPatchData, damageTableData } =
      await this.extractNdfData(args.inputNdfFolder);

    let previousPatchData: UnitData;

    if (args.previousNdfFolder) {
      const { unitData: _previousPatchData } = await this.extractNdfData(
        args.previousNdfFolder
      );
      previousPatchData = _previousPatchData;

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
      for (const division of currentPatchData.divisions) {
        const oldDivision = previousPatchData.divisions.find(
          (d: any) => d.descriptor === division.descriptor
        );

        const newPacks = division.packs;
        const oldPacks = oldDivision?.packs || [];

        const divisionDiff: {
          descriptor: string;
          packDiff: any[];
        } = {
          descriptor: division.descriptor,
          packDiff: [],
        };

        for (const pack of newPacks) {
          const oldPack = oldPacks.find(
            (p: any) => p.packDescriptor === pack.packDescriptor
          );

          if (oldPack) {
            const packDiff = diff(oldPack, pack);

            if (packDiff) {
              divisionDiff.packDiff.push({
                descriptor: pack.unitDescriptor,
                pack: pack.packDescriptor,
                diff: packDiff,
              });
            }
          } else {
            divisionDiff.packDiff.push({
              descriptor: pack.unitDescriptor,
              pack: pack.packDescriptor,
              new: true,
            });
          }
        }

        divDiff.push(divisionDiff);
      }

      const combinedDiff = {
        unitStats: patchDiff,
        unitAvailability: divDiff,
      };

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

    fs.writeFileSync('damageTable.json', JSON.stringify(damageTableData));

    this.log(`Done! 🎉 File written to ${args.outputFile}`);
  }

  private async extractNdfData(readDirectory: string): Promise<{
    unitData: UnitData;
    damageTableData: {
      resistanceFamilyWithIndexes: FamilyIndexTuple[];
      damageFamilyWithIndexes: FamilyIndexTuple[];
      damageTable: number[][];
      terrainResistances: {
        name: string;
        damageFamilies: TerrainResistance[];
      }[];
      defaultSuppressDamage: FamilyIndexTuple;
      suppressionDamageExceptions: {
        exception: string;
        suppression: FamilyIndexTuple;
      }[];
      armorToignoreForDamageFamilies: {
        damageFamily: string;
        resistances: string[];
      }[];
    };
  }> {
    const ndfFilePathMap: NdfFilePathMap = {};
    // eslint-disable-next-line guard-for-in
    for (const key in NDF_FILES) {
      ndfFilePathMap[key] = path.join(
        readDirectory,
        NDF_FILES[key as keyof typeof NDF_FILES]
      );
    }

    const filePath = path.join(readDirectory, NDF_FILES.damageResistance);

    const damageTable = extractValuesFromFile(filePath) || [];

    const ndfManager = new NdfManager(ndfFilePathMap);
    const ndfs = await ndfManager.parse();

    const resistanceFamilyStrings: string[] = (
      ndfs.damageResistance?.[0] as any
    )?.attributes[0].value?.values.map((v: any) => v.children[0]?.value?.value);
    const damageFamilyStrings: string[] = (
      ndfs.damageResistance?.[0] as any
    )?.attributes[1].value?.values.map((v: any) => v.children[0]?.value?.value);

    const terrainResistances = this.extractTerrainResistances(ndfs.terrain);

    const resistanceFamilyWithIndexes: FamilyIndexTuple[] = [];
    for (const resistanceFamilyString of resistanceFamilyStrings) {
      resistanceFamilyWithIndexes.push(
        getFamilyAndIndexFromFamilyDefinition(
          resistanceFamilyString,
          'ResistanceFamily_'
        )
      );
    }

    const damageFamilyWithIndexes: FamilyIndexTuple[] = [];
    for (const damageFamilyString of damageFamilyStrings) {
      damageFamilyWithIndexes.push(
        getFamilyAndIndexFromFamilyDefinition(
          damageFamilyString,
          'DamageFamily_'
        )
      );
    }

    const bonusPrecisionResult = ndfs.hitRollConstants.find(
      (h: any) => h.name === 'bonusPrecision'
    ) as any;
    const bonusPrecision =
      Number(bonusPrecisionResult.attributes[0].value) / 100; // convert to decimal percentage

    const defaultSuppressResult = search(
      ndfs.weaponConstants[0],
      'DefaultSuppressDamage'
    );

    const rawDefaultSuppressDamage =
      defaultSuppressResult[0]?.value?.children?.[0]?.value?.value;
    const defaultSuppressDamage = getFamilyAndIndexFromFamilyDefinition(
      rawDefaultSuppressDamage,
      'DamageFamily_'
    );

    const suppressDamagePerFamilyResult = search(
      ndfs.weaponConstants[0],
      'SuppressDamagePerFamily'
    );
    const rawDefaultSuppressDamagePerFamilyTuples =
      suppressDamagePerFamilyResult[0]?.value?.value;

    const suppressionDamageExceptions = [];
    for (const suppressTuple of rawDefaultSuppressDamagePerFamilyTuples) {
      const damageExceptionFamily = suppressTuple.value[0].value.slice(
        'DamageFamily_'.length
      ) as string;
      const suppressionFamily = getFamilyAndIndexFromFamilyDefinition(
        suppressTuple.value[1]?.children?.[0]?.value?.value,
        'DamageFamily_'
      );

      suppressionDamageExceptions.push({
        exception: damageExceptionFamily,
        suppression: suppressionFamily,
      });
    }

    const blindagesToIgnoreResult = search(
      ndfs.weaponConstants[0],
      'BlindagesToIgnoreForDamageFamilies'
    )[0].value.value;

    const armorToignoreForDamageFamilies = [];

    for (const blindageTuple of blindagesToIgnoreResult) {
      const damageFamily = blindageTuple.value[0]?.value?.slice(
        'DamageFamily_'.length
      ) as string;

      const resistancesForDamageFamily: string[] = [];

      for (const rawResistance of blindageTuple.value[1].values) {
        resistancesForDamageFamily.push(
          rawResistance.name.slice('ResistanceFamily_'.length)
        );
      }

      armorToignoreForDamageFamilies.push({
        damageFamily,
        resistances: resistancesForDamageFamily,
      });
    }

    /**
     * Mapping weapons and ammo out to be mapped by keys will save us many iterations when units need to find weapons, and weapons need to find ammo
     */
    const mappedWeaponDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.weapon
    );
    const mappedAmmoDescriptors = NdfManager.mapDescriptorsToKeyMap(ndfs.ammo);

    if (ndfs.ammoMissiles) {
      const mappedAmmoMissileDescriptors = NdfManager.mapDescriptorsToKeyMap(
        ndfs.ammoMissiles
      );

      // merge missileDescriptors in to ammoDescriptors
      for (const key in mappedAmmoMissileDescriptors) {
        mappedAmmoDescriptors[key] = mappedAmmoMissileDescriptors[key];
      }
    }

    const mappedSmokeDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.smoke
    );
    const mappedMissileDescriptors = NdfManager.mapDescriptorsToKeyMap(
      ndfs.missile
    );

    const divisionIds = (ndfs.deckSerializer[0] as NdfObject).attributes[0];
    const unitIds = (ndfs.deckSerializer[0] as NdfObject).attributes[1];

    const divisionIdTuples: ParserTuple[] = (divisionIds.value as any).value;
    const unitIdTuples: ParserTuple[] = (unitIds.value as any).value;

    const divisionIdMap: DescriptorIdMap = {};
    const unitIdMap: DescriptorIdMap = {};

    for (const divisionIdTuple of divisionIdTuples) {
      const divisionDescriptor = `${NdfManager.extractNameFromTuple(
        divisionIdTuple
      )}`;
      const divisionId = NdfManager.extractValueFromTuple(divisionIdTuple);

      divisionIdMap[divisionDescriptor] = Number(divisionId);
    }

    for (const unitIdTuple of unitIdTuples) {
      const unitDescriptor = `${NdfManager.extractNameFromTuple(
        unitIdTuple
      )}`.replace('$/GFX/Unit/', '');
      const unitId = NdfManager.extractValueFromTuple(unitIdTuple);

      unitIdMap[unitDescriptor] = Number(unitId) + 1;
    }

    const speedModifiers = this.extractSpeedModifiers(ndfs.terrain);

    let packs = ndfs.packs;

    if (ndfs.packs.length === 0) {
      packs = ndfs.divisionPacks;
    }

    const outputJson: UnitData = {
      version: undefined,
      units: [] as Unit[],
      divisions: parseDivisionData({
        division: ndfs.divisions,
        rules: ndfs.rules,
        packs: packs,
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
          unitIdMap,
          bonusPrecision
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
          unitIdMap,
          bonusPrecision
        );
        const building = buildingManager.parse();

        replaceNaNwithNull(building);
        outputJson.units.push(building);
      }
    }

    this.log('Data parsed. Writing to file...');

    return {
      unitData: outputJson,
      damageTableData: {
        damageFamilyWithIndexes,
        resistanceFamilyWithIndexes,
        damageTable,
        terrainResistances,
        defaultSuppressDamage,
        suppressionDamageExceptions,
        armorToignoreForDamageFamilies,
      },
    };
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

  private extractTerrainResistances(
    terrains: (NdfObject | NdfConstant)[]
  ): { name: string; damageFamilies: TerrainResistance[] }[] {
    const validTerrains = [
      { descriptorName: 'ForetLegere', name: 'forest' },
      { descriptorName: 'Batiment', name: 'building' },
      { descriptorName: 'Ruin', name: 'ruins' },
    ];

    const terrainResistances: {
      name: string;
      damageFamilies: TerrainResistance[];
    }[] = [];

    for (const terrainDescriptor of terrains) {
      if (isNdfObject(terrainDescriptor)) {
        const terrain = validTerrains.find(
          (terrain) => terrain.descriptorName === terrainDescriptor.name
        );

        if (terrain) {
          const resistancesForDamageFamilies = [];
          const searchResult = search(
            terrainDescriptor,
            'DamageModifierPerFamilyAndResistance'
          );
          const damageModifierPerFamilyAndResistances =
            searchResult[0].value.value;

          for (const dmg of damageModifierPerFamilyAndResistances) {
            const damageFamily = dmg.value[0].value.slice(
              'DamageFamily_'.length
            );
            const resistanceFamilies = dmg.value[1].values;

            const resistances = [];
            for (let i = 0; i < resistanceFamilies.length; i += 2) {
              const resistanceFamily = resistanceFamilies[i].name.slice(
                'ResistanceFamily_'.length
              );
              const resistanceValue = Number(resistanceFamilies[i + 1].value);
              resistances.push({
                type: resistanceFamily,
                value: resistanceValue,
              });
            }

            resistancesForDamageFamilies.push({ damageFamily, resistances });
          }

          terrainResistances.push({
            name: terrain.descriptorName,
            damageFamilies: resistancesForDamageFamilies,
          });
        }
      }
    }

    return terrainResistances;
  }

  private divisionsForUnit(unit: Unit, divisions: any[]) {
    return divisions
      ?.filter((division) => {
        return division.packs.find(
          (pack: any) => pack.unitDescriptor === unit.descriptorName
        );
      })
      .map((division) => division.descriptor);
  }
}
function getFamilyAndIndexFromFamilyDefinition(
  damageResistanceString: string,
  stringPrefix: string
): FamilyIndexTuple {
  const tokens = damageResistanceString.split(' ');
  const family = tokens[0].slice(stringPrefix.length);
  const indexTokens = tokens[1].split('=');
  const maxIndex = Number(indexTokens[1]);

  return { family, maxIndex };
}
