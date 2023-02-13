import { search } from "@izohek/ndf-parser";
import parseDivisionRules from "./rules";
import DivisionsJson from "@izohek/warno-db/dist/json/divisions.json";

/// All the data required for parsing a division
interface DivisionInputData {
    division: any,
    rules: any,
    packs: any,
    costMatrix: any
}

/// Pretty division names
export const DIVISION_NAMES: {[key: string]: string} = {
    'Descriptor_Deck_Division_RDA_7_Panzer_multi': '7. PanzerDivision',
    'Descriptor_Deck_Division_RFA_5_Panzer_multi': '5. PanzerDivision',
    'Descriptor_Deck_Division_SOV_79_Gds_Tank_multi': '79-Ya Gv. Tank. Div.',
    'Descriptor_Deck_Division_US_3rd_Arm_multi': '3rd Armored Division',
    'Descriptor_Deck_Division_US_8th_Inf_multi': '8th Infantry Division (Mech.)',
    'Descriptor_Deck_Division_NATO_Garnison_Berlin_multi': 'Berlin Command',
    'Descriptor_Deck_Division_SOV_39_Gds_Rifle_multi': '39-Ya Gv. Motostrelk. Div.',
    'Descriptor_Deck_Division_RDA_4_MSD_multi': '4. Mot.-Schutzen-Division',
    'Descriptor_Deck_Division_RFA_2_PzGrenadier_multi': '2. Pz.Grenadier-Division',
    'Descriptor_Deck_Division_SOV_35_AirAslt_Brig_multi': '35-Ya OG Desantno-Shturmovaya Brig.',
    'Descriptor_Deck_Division_US_82nd_Airborne_multi': '82nd Airborne Division',
    'Descriptor_Deck_Division_FR_11e_Para_multi': '11E Division Parachutiste',
    'Descriptor_Deck_Division_FR_5e_Blindee_multi': '5E Division Blindee',
    'Descriptor_Deck_Division_RDA_KdA_Bezirk_Erfurt_multi': 'K.d.A Bezirk Erfurt',
    'Descriptor_Deck_Division_RFA_TerrKdo_Sud_multi': 'TerritorialKommando Sud',
    'Descriptor_Deck_Division_UK_1st_Armoured_multi': '1st Armoured Division',
    'Descriptor_Deck_Division_UK_2nd_Infantry_multi': '2nd Infantry Division',
    'Descriptor_Deck_Division_WP_Unternehmen_Zentrum_multi': 'Unternehmen Zentrum'
}

/**
 * This method pulls all division and deck building related data together
 * from multiple files into an array of objects.
 * 
 * @param data 
 * @returns 
 */
export default function parseDivisionData(data: DivisionInputData) {

    const divisionData = data.division.map((division: any) => {
        return extractDivisionDetails(division)
    })

    const rulesData = parseDivisionRules(data.rules);
    
    return divisionData.map((division: any) => {
        const unitRules = rulesData.find((rule: any) => { 
            return rule.division === division.descriptor 
        })?.unitRules ?? [];
        
        const divisionPacks = division.packList.map((pack: any) => {
            return pack;
        })

        const id = DivisionsJson.find((_division) => _division.descriptor === division.descriptor)?.id;
        const name = DIVISION_NAMES[division.descriptor];

        return {
            ...division,
            id,
            name,
            packs: combineUnitRulesAndPacks(unitRules, divisionPacks, data.packs),
            costMatrix: extractCostMatrix(division.costMatrix, data.costMatrix),
            packList: undefined
        }
    });
}

/**
 * Extract the division data found in Divisions.ndf
 * 
 * @param division 
 * @returns 
 */
function extractDivisionDetails(division: any) {
    
 
    return {
        descriptor: search(division, 'name'),
        alliance: search(division, 'DivisionNationalite')[0].value.value,
        country: search(division, 'CountryId')[0].value.value.replaceAll('"', ''), 
        tags: search(division, 'DivisionTags')[0].value.values.map((t: any) => t.value.replaceAll("'", '')),
        maxActivationPoints: parseInt(search(division, 'MaxActivationPoints')[0].value.value),
        costMatrix: search(division, 'CostMatrix')[0].value.value,
        packList: search(division, 'PackList')[0].value.value.map((p: any) => { return {
            descriptor: p.value[0].value.replace('~/', ''),
            count: parseInt(p.value[1].value)
        }})
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
function combineUnitRulesAndPacks(unitRules: any, divisionPacks: any, packDefinitions: any) {
    return divisionPacks.map( (dp: any) => {
        const packDefinition = packDefinitions.find( (packDef: any) => {
            return dp.descriptor === packDef.name;
        });

        const packUnit = search(packDefinition, 'UnitDescriptor')[0].value.value;

        return {
            packDescriptor: dp.descriptor.replace('~/', ''),
            ... unitRules.find((ur: any) => { return ur.unitDescriptor === packUnit }),
            numberOfCards: dp.count
        }
        
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
    const foundMatrix = matrixData.find( (matrix: any) => { return matrix.name === divisionMatrix });

    return {
        name: divisionMatrix,
        matrix: formatCostMatrix(foundMatrix.attributes[0].value.value)
    };
}

/**
 * Translate cost matrix ndf parsings into a more reasonable format
 * 
 * @param costMatrix 
 * @returns 
 */
function formatCostMatrix(costMatrix: any) {
    return costMatrix.map( (matrixRow: any) => {
        return {
            name: matrixRow.value[0].value,
            activationCosts: matrixRow.value[1].values.map ( (costRow: any) => {
                return parseInt(costRow.value)
            })
        }
    })
}
