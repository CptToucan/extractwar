import { search } from "@izohek/ndf-parser";
import parseDivisionRules from "./rules";

/// All the data required for parsing a division
interface DivisionInputData {
    division: any,
    rules: any,
    packs: any,
    costMatrix: any
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

        return {
            ...division,
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
        availableForPlay: JSON.parse(search(division, 'AvailableForPlay')[0].value.value.toLowerCase()),
        country: search(division, 'CountryId')[0].value.value.replaceAll('"', ''), 
        tags: search(division, 'DivisionTags')[0].value.values.map((t: any) => t.value.replaceAll("'", '')),
        maxActivationPoints: parseInt(search(division, 'MaxActivationPoints')[0].value.value),
        costMatrix: search(division, 'CostMatrix')[0].value.value,
        packList: search(division, 'PackList')[0].value.value.map((p: any) => { return {
            descriptor: p.value[0].value,
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
            return dp.descriptor === "~/" + packDef.name;
        });
        const packUnit = search(packDefinition, 'UnitDescriptorList')[0].value.values[0].value;

        return {
            packDescriptor: dp.descriptor,
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
