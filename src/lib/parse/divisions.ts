/* eslint-disable camelcase */
import { search } from '@izohek/ndf-parser';
import { parseDivisionRules, _legacyParseDivisionRules } from './rules';
import DivisionsJson from '@izohek/warno-db/dist/json/divisions.json';
import { DescriptorIdMap } from '../../commands/ndf-to-json';
import { url } from 'inspector';

/// All the data required for parsing a division
interface DivisionInputData {
  division: any;
  rules: any;
  costMatrix: any;
  divisionIdMap: DescriptorIdMap
}

interface LegacyDivisionInputData {
  division: any;
  rules: any;
  packs: any;
  costMatrix: any;
  divisionIdMap: DescriptorIdMap
}

/// Pretty division names
export const DIVISION_NAMES: { [key: string]: string } = {
  Descriptor_Deck_Division_RDA_7_Panzer_multi: '7. PanzerDivision',
  Descriptor_Deck_Division_RFA_5_Panzer_multi: '5. PanzerDivision',
  Descriptor_Deck_Division_SOV_79_Gds_Tank_multi: '79-Ya Gv. Tank. Div.',
  Descriptor_Deck_Division_US_3rd_Arm_multi: '3rd Armored Division',
  Descriptor_Deck_Division_US_8th_Inf_multi: '8th Infantry Division (Mech.)',
  Descriptor_Deck_Division_NATO_Garnison_Berlin_multi: 'Berlin Command',
  Descriptor_Deck_Division_SOV_39_Gds_Rifle_multi: '39-Ya Gv. Motostrelk. Div.',
  Descriptor_Deck_Division_RDA_4_MSD_multi: '4. Mot.-Schutzen-Division',
  Descriptor_Deck_Division_RFA_2_PzGrenadier_multi: '2. Pz.Grenadier-Division',
  Descriptor_Deck_Division_SOV_35_AirAslt_Brig_multi:
    '35-Ya OG Desantno-Shturmovaya Brig.',
  Descriptor_Deck_Division_US_82nd_Airborne_multi: '82nd Airborne Division',
  Descriptor_Deck_Division_FR_11e_Para_multi: '11E Division Parachutiste',
  Descriptor_Deck_Division_FR_5e_Blindee_multi: '5E Division Blindee',
  Descriptor_Deck_Division_RDA_KdA_Bezirk_Erfurt_multi: 'K.d.A Bezirk Erfurt',
  Descriptor_Deck_Division_RFA_TerrKdo_Sud_multi: 'TerritorialKommando Sud',
  Descriptor_Deck_Division_UK_1st_Armoured_multi: '1st Armoured Division',
  Descriptor_Deck_Division_UK_2nd_Infantry_multi: '2nd Infantry Division',
  Descriptor_Deck_Division_WP_Unternehmen_Zentrum_multi: 'Berliner Gruppierung',
  Descriptor_Deck_Division_SOV_119IndTkBrig_multi: '119-Y Odt. Tank. Polk',
  Descriptor_Deck_Division_US_11ACR_multi: '11th Arm. Cavalry Regt.',
  Descriptor_Deck_Division_SOV_27_Gds_Rifle_multi: '27-Ya Gv. Motostrelk. Div.',
  Descriptor_Deck_Division_US_24th_Inf_multi: '24th Infantry Division (Mech.)',
  Descriptor_Deck_Division_SOV_6IndMSBrig_multi: '6-ya Og Motostrelk. Brig.',
  Descriptor_Deck_Division_SOV_56_AirAslt_Brig_multi: '56-Ya OG Desantno-Shturmovaya Brig.',
  Descriptor_Deck_Division_US_101st_Airmobile_multi: '101st Airborne Division (Air Assault)',
  Descriptor_Deck_Division_US_35th_Inf_multi: '35th Infantry Division (Mech.)',
  Descriptor_Deck_Division_RDA_Rugen_Gruppierung: 'Rugener Gruppierung',
  Descriptor_Deck_Division_FR_152e_Infanterie_multi: '152E Division D\'Infanterie',
  Descriptor_Deck_Division_SOV_76_VDV_multi: '76-Ya Gv. Vozdushno-Desantnaya Div.',

  Descriptor_Deck_Division_BEL_16e_Mecanisee_multi: '16DE Pantserdivision',
  Descriptor_Deck_Division_NL_4e_Divisie_multi: '4E Divisie',
  Descriptor_Deck_Division_UK_4th_Armoured_multi: '4th Armoured Division',
  Descriptor_Deck_Division_UK_5th_Airborne_Brigade_multi: 'MNAD',
  Descriptor_Deck_Division_US_9th_Mot_multi: '9th Infantry Division (Mot.)',
  Descriptor_Deck_Division_POL_20_Pancerna_multi: '20 Dywizja Pancerna',
  Descriptor_Deck_Division_POL_4_Zmechanizowana_multi: '4 Dyw. Zmechanizowana',
  Descriptor_Deck_Division_POL_Korpus_Desantowy_multi: 'Korpus Desantowy',
  Descriptor_Deck_Division_RDA_9_Panzer_multi: '9. Panzerdivision',
  Descriptor_Deck_Division_SOV_25_Tank_multi: '25-Ya Tank. Div',




};

/**
 * This method pulls all division and deck building related data together
 * from multiple files into an array of objects.
 *
 * @param data
 * @returns
 */
export function parseDivisionData(data: DivisionInputData, i18nMap?: { [key: string]: string }) {
  const divisionData = data.division.map((division: any) => {
    return extractDivisionDetails(division, i18nMap);
  }).filter( (division: any) => {
    // 'DEFAULT' tag defines a multiplayer-enabled division - not 100% sure
    return division.tags.includes('DEFAULT');
  });

  const rulesData = parseDivisionRules(data.rules);
  
  const mappedDivisions = divisionData.map((division: any) => {
    let unitRules =
      rulesData.find((rule: any) => {
        return rule.division === division.divisionRuleName;
      })?.unitRules ?? [];


    /*
    const id = DivisionsJson.find(
      (_division) => _division.descriptor === division.descriptor
    )?.id;
    */

    unitRules = unitRules.map((unitRule: any) => {
      return {
        ...unitRule,
        packDescriptor: unitRule.unitDescriptor
      };
    });

    const id = data.divisionIdMap[division.descriptor];

    const name = division.name || DIVISION_NAMES[division.descriptor] || division.descriptor;

    return {
      ...division,
      id,
      name,
      packs: unitRules,
      costMatrix: extractCostMatrix(division.costMatrix, data.costMatrix),
    };
  });

  return mappedDivisions;
}

/**
 * This method pulls all division and deck building related data together
 * from multiple files into an array of objects.
 *
 * @param data
 * @returns
 */
export function _legacyParseDivisionData(data: LegacyDivisionInputData) {
  const divisionData = data.division.map((division: any) => {
    return _legacyExtractDivisionDetails(division);
  }).filter( (division: any) => {
    // 'DEFAULT' tag defines a multiplayer-enabled division - not 100% sure
    return division.tags.includes('DEFAULT');
  });

  const rulesData = _legacyParseDivisionRules(data.rules);

  return divisionData.map((division: any) => {
    const unitRules =
      rulesData.find((rule: any) => {
        return rule.division === division.descriptor;
      })?.unitRules ?? [];

    const divisionPacks = division.packList.map((pack: any) => {
      return pack;
    });

    /*
    const id = DivisionsJson.find(
      (_division) => _division.descriptor === division.descriptor
    )?.id;
    */

    const id = data.divisionIdMap[division.descriptor];

    const name = DIVISION_NAMES[division.descriptor];

    return {
      ...division,
      id,
      name,
      packs: _legacyCombineUnitRulesAndPacks(unitRules, divisionPacks, data.packs),
      costMatrix: extractCostMatrix(division.costMatrix, data.costMatrix),
      packList: undefined,
    };
  });
}

/**
 * Extract the division data found in Divisions.ndf
 *
 * @param division
 * @returns
 */
function extractDivisionDetails(division: any, i18nMap?: { [key: string]: string }) {
  let nameToken = search(division, 'DivisionName')[0]?.value?.value;
  nameToken = nameToken?.replaceAll(`'`, '')
  let name = i18nMap?.[nameToken]?.replaceAll(`\"`, '').replaceAll(`\r`, '') || undefined;


  return {
    name: name,
    descriptor: search(division, 'name'),
    alliance: search(division, 'DivisionCoalition')[0]?.value?.value ? search(division, 'DivisionCoalition')[0]?.value?.value : search(division, 'DivisionNationalite')[0].value.value,
    country: search(division, 'CountryId')[0]?.value?.value?.replaceAll('"', ''),
    tags: search(division, 'DivisionTags')[0].value.values.map((t: any) =>
      t.value.replaceAll("'", '')
    ),
    maxActivationPoints: Number.parseInt(
      search(division, 'MaxActivationPoints')[0]?.value?.value
    , 10),
    costMatrix: search(division, 'CostMatrix')[0]?.value?.value || [],
    divisionRuleName: search(division, 'DivisionRule')[0]?.value?.value /*?.map((p: any) => {
      return {
        descriptor: p.value[0].value.replace('~/', ''),
        count: Number.parseInt(p.value[1].value, 10),
      };
      
    }),
    */
  };
}

/**
 * Extract the division data found in Divisions.ndf
 *
 * @param division
 * @returns
 */
function _legacyExtractDivisionDetails(division: any) {
  return {
    descriptor: search(division, 'name'),
    alliance: search(division, 'DivisionCoalition')[0]?.value?.value ? search(division, 'DivisionCoalition')[0]?.value?.value : search(division, 'DivisionNationalite')[0].value.value,
    country: search(division, 'CountryId')[0]?.value?.value?.replaceAll('"', ''),
    tags: search(division, 'DivisionTags')[0].value.values.map((t: any) =>
      t.value.replaceAll("'", '')
    ),
    maxActivationPoints: Number.parseInt(
      search(division, 'MaxActivationPoints')[0]?.value?.value
    , 10),
    costMatrix: search(division, 'CostMatrix')[0]?.value?.value || [],
    packList: search(division, 'PackList')[0]?.value?.value?.map((p: any) => {
      return {
        descriptor: p.value[0].value.replace('~/', ''),
        count: Number.parseInt(p.value[1].value, 10),
      };
    }),
  };
}


/**
 * Extract the rules and card counts for the packs and combine into a single object.
 *
 * Divisons.ndf contains a pack descriptor and the number of cards available for that pack
 * Packs.ndf contains the unit descriptor for a given pack
 * DivisionRules.ndf defines transports, how many units per card, and the XP bonus per veterancy
 *
 * @param unitRules
 * @param divisionPacks
 * @param packDefinitions
 * @returns
 */
function _legacyCombineUnitRulesAndPacks(
  unitRules: any,
  divisionPacks: any,
  packDefinitions: any
) {
  return divisionPacks.map((dp: any) => {
    const packDefinition = packDefinitions.find((packDef: any) => {
      return dp.descriptor === packDef.name;
    });

    let packUnit: string;
    if(packDefinition.attributes[0].value.value) {
      packUnit = packDefinition.attributes[0].value.value.replace("$/GFX/Unit/", "");
    }
    else {
      // legacy path
      packUnit = search(packDefinition, 'UnitDescriptor')[0].value.value?.replace("$/GFX/Unit/", "")
    }

    const unitRule = unitRules.find((ur: any) => {
      return ur.unitDescriptor === packUnit;
    }
    );

    return {packDescriptor: unitRule.unitDescriptor, ...unitRule, numberOfCards: dp.count};
  });
}

/**
 * Translate a cost matrix id from a division into a full cost matrix object.  Cost matrix
 * defines the activation point cost per slot per unit category when building a deck.
 *
 * Division.ndf contains the cost matrix name per division
 * DivisionCostMatrix.ndf contains the activation point definitions for every cost matrix
 *
 * @param divisionMatrix
 * @param matrixData
 * @returns
 */
function extractCostMatrix(divisionMatrix: string, matrixData: any) {
  const foundMatrix = matrixData.find((matrix: any) => {
    return matrix.name === divisionMatrix;
  });

  return {
    name: divisionMatrix,
    matrix: formatCostMatrix(foundMatrix.attributes[0].value.value),
  };
}

/**
 * Translate cost matrix ndf parsings into a more reasonable format
 *
 * @param costMatrix
 * @returns
 */
function formatCostMatrix(costMatrix: any) {
  return costMatrix.map((matrixRow: any) => {
    return {
      name: matrixRow.value[0].value,
      activationCosts: matrixRow.value[1].values.map((costRow: any) => {
        return Number.parseInt(costRow.value, 10);
      }),
    };
  });
}
