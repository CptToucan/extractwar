import { Command, Flags } from '@oclif/core';
import ux from 'cli-ux';
import { NdfParser, search } from '@izohek/ndf-parser';
import { NdfObject } from '@izohek/ndf-parser/dist/src/types';
import { findUnitCardByDescriptor } from '@izohek/warno-db';

const fs = require('fs');
const path = require('path');

const filesToRead = {
  units: 'UniteDescriptor.ndf',
  ammo: 'Ammunition.ndf',
  weapon: 'WeaponDescriptor.ndf',
};

type damageDropOffMap = {
  [key: string]: number;
};

const dropOff: damageDropOffMap = {
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_AP1_1Km: 175,
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_Balle_500: 500,
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_DCA: 700,
};

enum Armour {
  Blindage,
  Infanterie,
  Vehicule,
  Helico,
}

const METRE = 1 / 2.83;

export default class ParseNdf extends Command {
  static description =
    'reads ndf files, outputs WarYes compatible datastructures';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    // json: Flags.boolean({ char: 'j' }),
  };

  static args = [{ name: 'inputNdfFolder', required: true }, {
    name: 'outputFile', required: true
  }];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ParseNdf);

    this.log('Extracting unit data from ndf files');

    const weaponDescriptors: { [key: string]: any } = {};
    const ammoDescriptors: { [key: string]: any } = {};

    const uniteDescriptorPath = path.join(
      args.inputNdfFolder,
      filesToRead.units
    );
    const weaponDescriptorPath = path.join(
      args.inputNdfFolder,
      filesToRead.weapon
    );
    const ammoDescriptorPath = path.join(args.inputNdfFolder, filesToRead.ammo);

    const annotatedWeaponDescriptors =
      extractToAnnotatedDescriptor(weaponDescriptorPath);
    const annotatedAmmoDescriptors =
      extractToAnnotatedDescriptor(ammoDescriptorPath);
    const annotatedUniteDescriptors =
      extractToAnnotatedDescriptor(uniteDescriptorPath);

    for (const weaponDescriptor of annotatedWeaponDescriptors) {
      weaponDescriptors[(weaponDescriptor as NdfObject).name] =
        weaponDescriptor;
    }

    for (const ammoDescriptor of annotatedAmmoDescriptors) {
      ammoDescriptors[(ammoDescriptor as NdfObject).name] = ammoDescriptor;
    }

    const allUnits: any = {
      version: undefined,
      units: [],
    };
    for (const unitDescriptor of annotatedUniteDescriptors) {
      const unitJson: any = {};

      // Name
      const unitName = (unitDescriptor as NdfObject).name;
      unitJson.descriptorName = unitName;

      // Localize + misc info - English only for now.
      const localizedUnitCard = findUnitCardByDescriptor(unitName)
      unitJson.name = localizedUnitCard?.name
      unitJson.category = localizedUnitCard?.category
      unitJson.id = localizedUnitCard?.code

      const commandPointsResult = search(unitDescriptor, "ProductionRessourcesNeeded");

      unitJson.commandPoints = Number(commandPointsResult[0]?.value?.value[0]?.value[1]?.value);

      // Armour
      const frontArmorResult = search(unitDescriptor, 'ArmorDescriptorFront');
      const sideArmorResult = search(unitDescriptor, 'ArmorDescriptorSides');
      const rearArmorResult = search(unitDescriptor, 'ArmorDescriptorRear');
      const topArmorResult = search(unitDescriptor, 'ArmorDescriptorTop');

      unitJson.frontArmor = convertArmourTokenToNumber(
        extractValueFromSearchResult(frontArmorResult)
      );
      unitJson.sideArmor = convertArmourTokenToNumber(
        extractValueFromSearchResult(sideArmorResult)
      );
      unitJson.rearArmor = convertArmourTokenToNumber(
        extractValueFromSearchResult(rearArmorResult)
      );
      unitJson.topArmor = convertArmourTokenToNumber(
        extractValueFromSearchResult(topArmorResult)
      );

      // Health
      unitJson.maxDamage = parseNumberFromNdfValue(
        unitDescriptor,
        'MaxDamages'
      );

      // Speed
      unitJson.speed = Math.round(parseNumberFromMetre(extractValueFromSearchResult(search(unitDescriptor, "MaxSpeed"))));
      
      // Road Speed
      unitJson.roadSpeed = parseNumberFromNdfValue(
        unitDescriptor,
        'RealRoadSpeed'
      );

      // Optics
      unitJson.optics = parseNumberFromNdfValue(
        unitDescriptor,
        'OpticalStrength'
      );

      unitJson.airOptics = parseNumberFromNdfValue(
        unitDescriptor,
        'OpticalStrengthAltitude'
      );

      // Stealth
      unitJson.stealth = parseNumberFromNdfValue(
        unitDescriptor,
        'UnitConcealmentBonus'
      );

      // Advanced Deployment
      const deploymentShiftResult = extractValueFromSearchResult(
        search(unitDescriptor, 'DeploymentShift')
      );
      unitJson.advancedDeployment = deploymentShiftResult
        ? Math.round(parseNumberFromMetre(deploymentShiftResult as string))
        : null;

      // Fuel
      unitJson.fuel = parseNumberFromNdfValue(unitDescriptor, 'FuelCapacity');
      unitJson.fuelMove = parseNumberFromNdfValue(
        unitDescriptor,
        'FuelMoveDuration'
      );

      // Supply
      unitJson.supply = parseNumberFromNdfValue(
        unitDescriptor,
        'SupplyCapacity'
      );

      // ECM
      unitJson.ecm = parseNumberFromNdfValue(unitDescriptor, 'HitRollECM');

      // Agility
      const agilityRadiusResult = extractValueFromSearchResult(
        search(unitDescriptor, 'AgilityRadius')
      );
      if (agilityRadiusResult) {
        const parsedAgilityRadius = removeBracketsFromMetreValue(
          agilityRadiusResult as string
        );
        unitJson.agility = Math.round(parseNumberFromMetre(parsedAgilityRadius));
      }

      // Travel Time
      unitJson.travelTime = parseNumberFromNdfValue(
        unitDescriptor,
        'TravelDuration'
      );

      // Weapons

      unitJson.weapons = [];

      const weaponManager = search(unitDescriptor, 'WeaponManager');
      const weaponManagerPath = weaponManager?.[0]?.children?.[0]?.value?.value;

      if (weaponManagerPath !== undefined) {
        const weaponManagerId = extractLastTokenFromString(weaponManagerPath);
        const weaponDescriptor = weaponDescriptors[weaponManagerId];

        const rawSalvoMap = search(weaponDescriptor, 'Salves');
        const salvoMap =
          rawSalvoMap[0]?.value?.values?.map((el: any) => el.value) || [];

        const turretDescriptorResult = search(
          weaponDescriptor,
          'TurretDescriptorList'
        );
        const turretDescriptors = turretDescriptorResult[0]?.value?.values;
        const allMountedWeapons = [];

        for (const turretDescriptor of turretDescriptors) {
          const mountedWeaponResult = search(
            turretDescriptor,
            'MountedWeaponDescriptorList'
          );

          // Some turrets have multiple "weapons" attached to them. This is to allow weapons being good at AP and having different values for HE. Units use the best weapon possible when they target an enemy.
          const mountedWeaponDescriptors =
            mountedWeaponResult[0]?.value?.values;


          for (const mountedWeaponDescriptor of mountedWeaponDescriptors) {
            const mountedWeapon = extractMountedWeaponStatistics(
              mountedWeaponDescriptor,
              ammoDescriptors,
              salvoMap
            );
            allMountedWeapons.push(mountedWeapon);
          }
        }

        const allMountedWeaponsToShow = allMountedWeapons.filter(
          (_weapon) => _weapon.showInInterface === true
        );


        const filteredSalvoMap = salvoMap.filter((salvo: string) => salvo !== "-1");
          
        for (let salvoIndex = 0; salvoIndex < filteredSalvoMap.length; salvoIndex++) {
          // Find all weapons assigned to this ammo pool
          const weaponsForSalvoIndex = allMountedWeaponsToShow.filter(
            (_weapon) => _weapon.salvoIndex === salvoIndex
          );
          const mergedWeapon = { ...weaponsForSalvoIndex[0] };

          for (let i = 1; i < weaponsForSalvoIndex.length; i++) {
            const _weapon = weaponsForSalvoIndex[i];

            if (_weapon['suppress'] > mergedWeapon['suppress']) {
              mergedWeapon['suppress'] = _weapon['suppress'];
            }

            if (_weapon['penetration'] > mergedWeapon['penetration']) {
              mergedWeapon['penetration'] = _weapon['penetration'];
            }

            if (_weapon['he'] > mergedWeapon['he']) {
              mergedWeapon['he'] = _weapon['he'];
            }
          }

          unitJson.weapons.push(mergedWeapon);
        }

        allUnits.units.push(unitJson);
      }

    }

    fs.writeFileSync(`${args.outputFile}`, JSON.stringify(allUnits));

    /*
    if(flags.json) {
      fs.writeFileSync(`${args.outputFile}.json`, JSON.stringify(allUnits));
      this.log(`Finished extracting information from unit cards to json`)
    }
    */
  }
}
function extractMountedWeaponStatistics(
  mountedWeaponDescriptor: any,
  ammoDescriptors: { [key: string]: any },
  salvoMap: any
) {
  const mountedWeaponJson: any = {};

  const showInInterface =
    extractValueFromSearchResult(
      search(mountedWeaponDescriptor, 'ShowInInterface')
    ) === 'True';
  mountedWeaponJson.showInInterface = showInInterface;

  const ammunitionPath = extractValueFromSearchResult(
    search(mountedWeaponDescriptor, 'Ammunition')
  );
  const ammunitionDescriptorId = extractLastTokenFromString(
    ammunitionPath as string
  );
  const ammunitionDescriptor = ammoDescriptors[ammunitionDescriptorId];

  const heDamage = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'PhysicalDamages'
  );
  const suppress = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'SuppressDamages'
  );

  mountedWeaponJson.ammoDescriptorName = ammunitionDescriptorId; 
  mountedWeaponJson.weaponName = prettifyAmmoDescriptorName(mountedWeaponJson.ammoDescriptorName);
  mountedWeaponJson.he = heDamage;
  mountedWeaponJson.suppress = suppress;

  const groundMaxRange = parseNumberFromMetre(
    removeBracketsFromMetreValue(
      extractValueFromSearchResult(
        search(ammunitionDescriptor, 'PorteeMaximale')
      )
    )
  );
  mountedWeaponJson.groundRange = Math.round(groundMaxRange);
  mountedWeaponJson.helicopterRange = Math.round(
    parseNumberFromMetre(
      removeBracketsFromMetreValue(
        extractValueFromSearchResult(
          search(ammunitionDescriptor, 'PorteeMaximaleTBA')
        )
      )
    )
  );
  mountedWeaponJson.planeRange = Math.round(
    parseNumberFromMetre(
      removeBracketsFromMetreValue(
        extractValueFromSearchResult(
          search(ammunitionDescriptor, 'PorteeMaximaleHA')
        )
      )
    )
  );
  mountedWeaponJson.aimingTime = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'TempsDeVisee'
  );

  const reloadTime = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'TempsEntreDeuxSalves'
  );
  mountedWeaponJson.reloadTime = reloadTime;

  const salvoLength = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'NbTirParSalves'
  );
  mountedWeaponJson.salvoLength = salvoLength;

  const timeBetweenShots = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'TempsEntreDeuxTirs'
  );

  const ammunitionPerSalvo = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'AffichageMunitionParSalve'
  );

  const rateOfFire =
    (ammunitionPerSalvo / ((salvoLength - 1) * timeBetweenShots + reloadTime)) *
    60;
  mountedWeaponJson.rateOfFire = Math.round(rateOfFire);

  const supplyCostPerSalvo = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'SupplyCost'
  );
  const salvoIndex = parseNumberFromNdfValue(
    mountedWeaponDescriptor,
    'SalvoStockIndex'
  );

  mountedWeaponJson.salvoIndex = salvoIndex;

  const supplyCost = salvoMap[salvoIndex] * supplyCostPerSalvo;
  mountedWeaponJson.supplyCost = supplyCost;

  const baseHitValueModifierResult = search(
    ammunitionDescriptor,
    'BaseHitValueModifiers'
  );
  const baseHitValueModifierValues = baseHitValueModifierResult[0].value.values;
  const valueModifiers: any = {};
  // This array is split up weird. Index "n + 1" has the name of the value I'm looking to extract and index "n+2" has the value.
  // Hence why I'm going to every 3rd index, as I want to access both values in an iteration;
  for (let i = 0; i < baseHitValueModifierValues.length; i += 3) {
    const baseHitValueModifierName = baseHitValueModifierValues[i + 1];
    const baseHitValueModifierValue = baseHitValueModifierValues[i + 2];
    valueModifiers[baseHitValueModifierName.name] = Number(
      baseHitValueModifierValue.value
    );
  }

  // Guide found here: https://github.com/Perytron/WARNO-DATA/wiki/In-Depth-Guide suggested that it the modifier should be multipled by NbTirParSalves for true accuracy. For now we will use the one displayed in the unit card
  const staticAccuracy = valueModifiers['Idling'];
  const movingAccuracy = valueModifiers['Moving'];

  mountedWeaponJson.staticAccuracy = staticAccuracy;
  mountedWeaponJson.movingAccuracy = movingAccuracy;

  const damageDropOffToken = extractLastTokenFromString(
    extractValueFromSearchResult(
      search(ammunitionDescriptor, 'DamageTypeEvolutionOverRangeDescriptor')
    )
  );
  const damageDropOffValue = dropOff[damageDropOffToken];

  const damageResult = search(ammunitionDescriptor, 'TDamageTypeRTTI');
  const damageFamily = damageResult?.[0]?.children?.[0]?.value?.value;
  const damageIndex = damageResult?.[0]?.children?.[1]?.value?.value;
  const piercingWeapon =
    extractValueFromSearchResult(
      search(ammunitionDescriptor, 'PiercingWeapon')
    ) === 'True';

  // This works for the AP family and most weapons, some other weapons like autocannons penetration does not work on
  // TODO: Work out how to properly calculate penetration
  const penetration =
    piercingWeapon && damageFamily === '"ap"'
      ? Math.round(Number(damageIndex) - groundMaxRange / damageDropOffValue)
      : Number(damageIndex);
  mountedWeaponJson.penetration = penetration;
  return mountedWeaponJson;
}

function extractLastTokenFromString(path: string) {
  const pathTokens = path.split('/');
  const lastToken = pathTokens[pathTokens.length - 1];
  return lastToken;
}

function extractToAnnotatedDescriptor(filePath: string) {
  const buffer: string = fs.readFileSync(filePath);
  const descriptorNdf = buffer.toString();
  const parser = new NdfParser(descriptorNdf);
  const jsonDescriptor = parser.parse();
  // Index 1 is the nice syntax, index 0 is raw
  const annotatedDescriptor = jsonDescriptor[1];
  return annotatedDescriptor;
}

function extractValueFromSearchResult<T>(searchResult: any[]): T {
  return searchResult[0]?.value?.value;
}

/**
 * Returns a number representing the armour value
 * @param armourToken armour token from ndf value
 * @returns number representing armour value
 */
function convertArmourTokenToNumber(armourToken: string): number {
  const armourTokenTokens = armourToken.split('_');
  const armourType = armourTokenTokens[1];
  const armourStrength = armourTokenTokens[2];

  // If leger is returned, this is light armour and displays as >1 in Unit cards
  if (armourStrength === 'leger') {
    return 0.5;
  }

  // If infanterie, then this is 0 armour
  if ((armourType as unknown as Armour) === Armour.Infanterie) {
    return 0;
  }

  return Number(armourStrength);
}

/**
 * Searches NDF descriptor, and returns a Javascript Number type from the search result
 * @param unitDescriptor unitedescriptor object
 * @param searchToken the value to extract for the unit
 * @returns parsed number from ndf
 */
function parseNumberFromNdfValue(unitDescriptor: any, searchToken: string) {
  const searchResult = search(unitDescriptor, searchToken);
  return Number(extractValueFromSearchResult(searchResult));
}

function parseNumberFromMetre(metreValue: string) {
  const numberTokens = metreValue.split('*');
  return Number(numberTokens[0]) * METRE;
}

function removeBracketsFromMetreValue(target: string) {
  let result = target.replace(/\(/g, '');
  result = result.replace(/\)/g, '');
  return result;
}

/**
 * Convert a weapon ammo descriptor into a presentable name.  
 * 
 * Lots of regex, good luck - there's likely some optimizations to be found.  
 * 
 * The order of replace calls affects the parse value so careful if changing/reordering.
 * 
 * @param descriptor weapon ammoDescriptorName
 * @returns pretty name derived from ammoDescriptorName
 */
function prettifyAmmoDescriptorName(descriptor: string): string {
  return descriptor
    // remove prefixes and suffixes
    .replace(/(^Ammo_)|(_late|_early)$/g, "")
    // some names have numbers in them that should not later be converted to '.' like ammunition size
    .replace(/(?<=(HS|RPK|UPK|G[sS]h|ZU[\d]*))_(?=[\d]*)/, '-')
    // some names like above have two numbers in them, "gsh-30-2".  this fixes issue where they all get converted to '.' by ammunition size conversion
    .replace(/(?<=(UPK|G[sS]h)-[\d]*)_(?=[\d]*)(?![\d]*[Mm]{2})/, '-')
    // underscores to spaces
    .split('_').join(' ')
    // replace spaces with '.' for ammunition size " 7 75" -> " 7.75"
    .replace(/(?<=\s[\d]*)\s(?=\d)/g, '.')
    // sometimes values come out like: "77 mm" -> coverts to "77mm"
    .replace(/(?<=[\d]*)\s(?=mm)/g, "");
}
