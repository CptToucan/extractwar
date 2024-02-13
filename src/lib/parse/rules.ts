export default function parseDivisionRules(data: any) {
    const ndfItems = ((data[0] as any).attributes[0].value.value).map( (e: any) => e.value)
    
    const rules = ndfItems.map( (item: any) => {
        // return item
        const unitRules = item[1].children.filter( ( c: any) => c.name === 'UnitRuleList' )[0].value
        
        return {
            division: item[0].value.replace('~/', ''),
            unitRules: (unitRules.values).map( (ur: any) => {
                return {
                    unitDescriptor: (ur.children.find( (u: any) => u.name === 'UnitDescriptor' )?.value).value.replace('$/GFX/Unit/', ''),
                    availableTransportList: extractTransportList(ur),
                    availableWithoutTransport: JSON.parse((ur.children.find( (u: any) => u.name === 'AvailableWithoutTransport' )?.value).value.toLowerCase()),
                    numberOfUnitsInPack: parseInt((ur.children.find( (u: any) => u.name === 'NumberOfUnitInPack' )?.value).value),
                    numberOfUnitInPackXPMultiplier: (ur.children.find( (u: any) => u.name === 'NumberOfUnitInPackXPMultiplier' )?.value).values.map( (i: any) => {
                        return parseFloat(i.value)
                    })
                }
            }),
        }
    })

    return rules;
}

/**
 * Extract the transport list which may or may not exist for a unit.  It's a csv for all the descriptors
 * so we split and return a structured array if it exists.
 * 
 * @param data 
 * @returns 
 */
function extractTransportList(data: any) {
    const rawDataFromNdf = data.children.find( 
        (u: any) => u.name === 'AvailableTransportList' 
    )?.value;

        if(rawDataFromNdf) {
            debugger;
        }

        // new descriptors start with $/GFX
    if(rawDataFromNdf?.values?.[0]?.name === "$/GFX") {
        const descriptorNames: string[] = [];
        for(let i = 1; i < rawDataFromNdf.values.length; i = i + 2) {
            descriptorNames.push(rawDataFromNdf.values[i].name.split("/")[1]);
        }
        return descriptorNames;
    } 

    if (rawDataFromNdf?.values) {
        return rawDataFromNdf.values[0].value?.split(",").map((i: any) => i.trim().replace('~/', ''));
    }

    return undefined;
}
