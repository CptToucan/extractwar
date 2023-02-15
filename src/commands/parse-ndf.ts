import { Command, Flags } from '@oclif/core';
import ux from 'cli-ux';
import { search } from '@izohek/ndf-parser';
import { NdfObject } from '@izohek/ndf-parser/dist/src/types';
import { findUnitCardByDescriptor } from '@izohek/warno-db';
import parseDivisionRules from '../lib/parse/rules';
import { extractToAnnotatedDescriptor } from '../lib/parse/util';
import parseDivisionData from '../lib/parse/divisions';

const fs = require('fs');
const path = require('path');

const HEAT_AP_MAGIC_NUMBER = 14;
const KINETIC_AP_MAGIC_NUMBER = 18

const filesToRead = {
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

const accuracyBonusOverRange = [
  {
    multiplier: 0.05,
    distance: 1000
  },
  {
    multiplier: 0.17,
    distance: 100
  },
  {
    multiplier: 0.33,
    distance: 75
  },
  {
    multiplier: 0.5,
    distance: 50
  },
  {
    multiplier: 0.67,
    distance: 25
  },
  {
    multiplier: 1,
    distance: 0
  }
]

enum Armour {
  Blindage = "Blindage",
  Infanterie = "Infanterie",
  Vehicule = "Vehicule",
  Helico = "Helico",
}

const METRE = 1 / 2.83;

export default class ParseNdf extends Command {
  static description =
    'reads ndf files, outputs WarYes compatible datastructures';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    // json: Flags.boolean({ char: 'j' }),
  };

  static args = [
    { name: 'inputNdfFolder', required: true },
    {
      name: 'outputFile',
      required: true,
    },
  ];

  // eslint-disable-next-line complexity
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
    const rulesDescriptorPath = path.join(
      args.inputNdfFolder,
      filesToRead.rules
    );
    const divisionsDescriptorPath = path.join(
      args.inputNdfFolder,
      filesToRead.divisions
    );
    const packsDescriptorPath = path.join(
      args.inputNdfFolder,
      filesToRead.packs
    );
    const costMatrixPath = path.join(
      args.inputNdfFolder,
      filesToRead.costMatrix
    );
    const terrainPath = path.join(args.inputNdfFolder, filesToRead.terrain);
    const smokePath = path.join(args.inputNdfFolder, filesToRead.smoke);
    const missilePath = path.join(args.inputNdfFolder, filesToRead.missile);

    const annotatedWeaponDescriptors =
      extractToAnnotatedDescriptor(weaponDescriptorPath);
    const annotatedAmmoDescriptors =
      extractToAnnotatedDescriptor(ammoDescriptorPath);
    const annotatedUniteDescriptors =
      extractToAnnotatedDescriptor(uniteDescriptorPath);
    const divisionRulesDescriptors =
      extractToAnnotatedDescriptor(rulesDescriptorPath);
    const divisionDescriptors = extractToAnnotatedDescriptor(
      divisionsDescriptorPath
    );
    const packsDescriptors = extractToAnnotatedDescriptor(packsDescriptorPath);
    const costMatrixPathDescriptors =
      extractToAnnotatedDescriptor(costMatrixPath);

    const terrainDescriptors = extractToAnnotatedDescriptor(terrainPath);
    const smokeDescriptors = extractToAnnotatedDescriptor(smokePath);
    const missileDescriptors = extractToAnnotatedDescriptor(missilePath);

    for (const weaponDescriptor of annotatedWeaponDescriptors) {
      weaponDescriptors[(weaponDescriptor as NdfObject).name] =
        weaponDescriptor;
    }

    for (const ammoDescriptor of annotatedAmmoDescriptors) {
      ammoDescriptors[(ammoDescriptor as NdfObject).name] = ammoDescriptor;
    }


    
    const validTerrains = [{descriptorName: "ForetLegere", name: "forest"}, {descriptorName: "Batiment", name: "building"}, {descriptorName: "Ruin", name: "ruins"}];
    const speedModifiers = [];

    for(const terrainDescriptor of terrainDescriptors) {


      const terrain = validTerrains.find((ter) => ter.descriptorName === terrainDescriptor.name);

      if(terrain) {
        const wheel = parseNumberFromNdfValue(terrainDescriptor, "SpeedModifierAllTerrainWheel");
        const infantry = parseNumberFromNdfValue(terrainDescriptor, "SpeedModifierInfantry");
        const track = parseNumberFromNdfValue(terrainDescriptor, "SpeedModifierTrack");
        speedModifiers.push({
          ...terrain,
          movementTypes: {"AllTerrainWheel": {name: "wheel", value: wheel},
          "Infantry": {name: "infantry", value: infantry},
          "Track": {name: "track", value: track}
        }})
      }

    }


    const allUnits: any = {
      version: undefined,
      units: [],
      divisions: parseDivisionData({
        division: divisionDescriptors,
        rules: divisionRulesDescriptors,
        packs: packsDescriptors,
        costMatrix: costMatrixPathDescriptors,
      }),
    };
    for (const unitDescriptor of annotatedUniteDescriptors) {
      const unitJson: any = {};

      // Name
      const unitName = (unitDescriptor as NdfObject).name;
      unitJson.descriptorName = unitName;

      // Localize + misc info - English only for now.
      const localizedUnitCard = findUnitCardByDescriptor(unitName);
      unitJson.name = localizedUnitCard?.name;
      unitJson.category = localizedUnitCard?.category;
      unitJson.id = localizedUnitCard?.code;

      // Unit Type info - TTypeUnitModuleDescriptor
      const typeUnitPrettyKeys: { [key: string]: string } = {
        Nationalite: 'nationality',
        MotherCountry: 'motherCountry',
        TypeUnitFormation: 'formation',
      };
      unitJson.unitType = search(
        unitDescriptor,
        'TTypeUnitModuleDescriptor'
      )[0].children.reduce((result: any, child: any) => {
        if (typeUnitPrettyKeys[child.name]) {
          result[typeUnitPrettyKeys[child.name]] = child.value.value.replaceAll(
            "'",
            ''
          );
        }
        return result;
      }, {});

      // If no manual localization, create it from unit descriptor
      if (unitJson.name && unitJson.name.length < 1) {
        unitJson.name = prettyUnitNameFromDescriptor(unitJson.descriptorName);
      }

      const commandPointsResult = search(
        unitDescriptor,
        'ProductionRessourcesNeeded'
      );

      unitJson.commandPoints = Number(
        commandPointsResult[0]?.value?.value[0]?.value[1]?.value
      );

      // Armour
      const frontArmorResult = search(unitDescriptor, 'ArmorDescriptorFront');
      const sideArmorResult = search(unitDescriptor, 'ArmorDescriptorSides');
      const rearArmorResult = search(unitDescriptor, 'ArmorDescriptorRear');
      const topArmorResult = search(unitDescriptor, 'ArmorDescriptorTop');

      unitJson.factoryDescriptor = search(
        unitDescriptor,
        'Factory'
      )?.[0]?.value?.value;

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
      unitJson.speed = Math.round(
        parseNumberFromMetre(
          extractValueFromSearchResult(search(unitDescriptor, 'MaxSpeed'))
        )
      );

      const unitMoveTypeValue: string | undefined = extractValueFromSearchResult(search(unitDescriptor, 'UnitMovingType'));



      // console.log(extractLastTokenFromString())
      if(unitMoveTypeValue) {
        const speedsForTerrains = [];
        const unitMoveType = extractLastTokenFromString(unitMoveTypeValue);
        for(const speedModifier of speedModifiers) {

          const moveTypes = Object.keys(speedModifier.movementTypes);
          const foundMoveType = moveTypes.find((type) => unitMoveType.includes(type));
          if(foundMoveType) {
            // @ts-ignore
            const speedMultiplier = speedModifier.movementTypes[foundMoveType];
            speedsForTerrains.push({speed: Math.round(unitJson.speed * speedMultiplier.value), name: speedModifier.name})
          }
         
          
        }

        unitJson.speedsForTerrains = speedsForTerrains;
      }



      // Road Speed
      unitJson.roadSpeed = parseNumberFromNdfValue(
        unitDescriptor,
        'RealRoadSpeed'
      );

      unitJson.rotationTime = parseNumberFromNdfValue(
        unitDescriptor,
        'TempsDemiTour'
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

      let bombStrategy;
      const diveBombResult = search(
        unitDescriptor,
        'TDiveBombAttackStrategyDescriptor'
      );
      const normalBombResult = search(
        unitDescriptor,
        'TBombAttackStrategyDescriptor'
      );

      if (diveBombResult.length > 0) {
        bombStrategy = 'DIVE';
      }

      if (normalBombResult.length > 0) {
        bombStrategy = 'NORMAL';
      }

      unitJson.bombStrategy = bombStrategy;

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
        const parsedAgilityRadius = removeBracketsFromValue(
          agilityRadiusResult as string
        );
        unitJson.agility = Math.round(
          parseNumberFromMetre(parsedAgilityRadius)
        );
      }

      // Travel Time
      unitJson.travelTime = parseNumberFromNdfValue(
        unitDescriptor,
        'TravelDuration'
      );

      // Specialities
      unitJson.specialities = search(unitDescriptor, 'SpecialtiesList')[0]
        .value.values.map((spec: any) => {
          return spec.value
            .replace(/^([\'\"]*)/g, '')
            .replace(/([\'\"]*)$/g, '');
        })
        .filter((spec: any) => {
          return spec && spec !== 'appui';
        });

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
            const isSmoke = isMountedWeaponSmoke(mountedWeaponDescriptor);

            unitJson.hasDefensiveSmoke = isSmoke;

            if (!isSmoke) {
              const mountedWeapon = extractMountedWeaponStatistics(
                turretDescriptor,
                mountedWeaponDescriptor,
                ammoDescriptors,
                salvoMap,
                smokeDescriptors,
                missileDescriptors
              );

              allMountedWeapons.push(mountedWeapon);
            }
          }
        }

        const allMountedWeaponsToShow = allMountedWeapons.filter(
          (_weapon) => _weapon.showInInterface === true
        );

        const filteredSalvoMap = salvoMap.filter(
          (salvo: string) => salvo !== '-1'
        );

        for (
          let salvoIndex = 0;
          salvoIndex < filteredSalvoMap.length;
          salvoIndex++
        ) {
          // Find all weapons assigned to this ammo pool
          const weaponsForSalvoIndex = allMountedWeaponsToShow.filter(
            (_weapon) => _weapon.salvoIndex === salvoIndex
          );

          const mergedWeapon = { ...weaponsForSalvoIndex[0] };

          /*
          if(weaponsForSalvoIndex.length === 2) {
            mergedWeapon.penetration = weaponsForSalvoIndex[0].penetration;
            mergedWeapon.he = weaponsForSalvoIndex[1].he;
          }
          */

          for (let i = 1; i < weaponsForSalvoIndex.length; i++) {
            const _weapon = weaponsForSalvoIndex[i];

            if (_weapon.ammoDescriptorName.includes('_AP_')) {
              mergedWeapon.penetration = _weapon.penetration;
            }

            if (_weapon.ammoDescriptorName.includes('_HE_')) {
              mergedWeapon.he = _weapon.he;
            } else if (
              !_weapon.ammoDescriptorName.includes('_AP_') &&
              (_weapon.ammoDescriptorName.includes('_GatlingAir_') ||
                _weapon.ammoDescriptorName.includes('Gatling'))
            ) {
              mergedWeapon.he = _weapon.he;
            }

            if (
              _weapon.ammoDescriptorName.includes('_GatlingAir_') ||
              _weapon.ammoDescriptorName.includes('Gatling')
            ) {
              mergeBestValue(_weapon, mergedWeapon, 'penetration');
            }

            if (_weapon.smokeProperties) {
              mergedWeapon.smokeProperties = _weapon.smokeProperties;
            }

            mergeBestValue(_weapon, mergedWeapon, 'suppress');
            mergeBestValue(_weapon, mergedWeapon, 'groundRange');
            mergeBestValue(_weapon, mergedWeapon, 'helicopterRange');
            mergeBestValue(_weapon, mergedWeapon, 'planeRange');
          }

          unitJson.weapons.push(mergedWeapon);
        }
      }

      allUnits.units.push(unitJson);
    }

    fs.writeFileSync(`${args.outputFile}`, JSON.stringify(allUnits));
  }
}
/**
 *
 * @param compareObject The object to compare against the merged value
 * @param mergedObject The object to merge the stat on to
 * @param stat  The key of the value to check
 */
function mergeBestValue(compareObject: any, mergedObject: any, stat: string) {
  if (compareObject[stat] > mergedObject[stat]) {
    mergedObject[stat] = compareObject[stat];
  }
}

function extractMountedWeaponStatistics(
  turretDescriptor: any,
  mountedWeaponDescriptor: any,
  ammoDescriptors: { [key: string]: any },
  salvoMap: any,
  smokeDescriptors: any,
  missileDescriptors: any
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

  const smokeDescriptorPath: string = extractValueFromSearchResult(
    search(ammunitionDescriptor, 'SmokeDescriptor')
  );

  if (smokeDescriptorPath !== 'nil') {
    const smokeDescriptorName = extractLastTokenFromString(smokeDescriptorPath);
    const smokeDescriptor = smokeDescriptors.find(
      (descriptor: any) => descriptor.name === smokeDescriptorName
    );

    const altitude = Math.round(
      parseNumberFromMetre(
        removeBracketsFromValue(
          extractValueFromSearchResult(search(smokeDescriptor, 'Altitude'))
        )
      )
    );

    const lifeSpan = Math.round(
      parseNumberFromSecond(
        removeBracketsFromValue(
          extractValueFromSearchResult(search(smokeDescriptor, 'TimeToLive'))
        )
      )
    );

    const radius = Math.round(
      parseNumberFromMetre(
        removeBracketsFromValue(
          extractValueFromSearchResult(search(smokeDescriptor, 'Radius'))
        )
      )
    );

    mountedWeaponJson.smokeProperties = { altitude, radius, lifeSpan };
  }

  const missileDescriptorPath: string = extractValueFromSearchResult(
    search(ammunitionDescriptor, 'MissileDescriptor')
  );

  if (missileDescriptorPath !== 'nil') {
    const missileDescriptorName = extractLastTokenFromString(
      missileDescriptorPath
    );
    const missileDescriptor = missileDescriptors.find(
      (descriptor: any) => descriptor.name === missileDescriptorName
    );

    const defaultConfigResult = search(missileDescriptor, 'DefaultConfig')[0];
    const maxMissileSpeed = Math.round(
      parseNumberFromMetre(
        removeBracketsFromValue(
          extractValueFromSearchResult(search(defaultConfigResult, 'MaxSpeed'))
        )
      )
    );
    const maxMissileAcceleration = Math.round(
      parseNumberFromMetre(
        removeBracketsFromValue(
          extractValueFromSearchResult(
            search(defaultConfigResult, 'MaxAcceleration')
          )
        )
      )
    );

    mountedWeaponJson.missileProperties = {
      maxMissileSpeed, maxMissileAcceleration
    }
  }

  const heDamage = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'PhysicalDamages'
  );

  const heDamageRadius = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'RadiusSplashPhysicalDamages'
  );

  mountedWeaponJson.heDamageRadius = heDamageRadius;

  const suppress = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'SuppressDamages'
  );

  const suppressDamageRadius = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'RadiusSplashSuppressDamages'
  );

  mountedWeaponJson.suppressDamagesRadius = suppressDamageRadius;

  const firesLeftToRightValue = extractValueFromSearchResult(
    search(ammunitionDescriptor, 'DispersionWithoutSorting')
  );
  const firesLeftToRight = firesLeftToRightValue === 'True';

  mountedWeaponJson.firesLeftToRight = firesLeftToRight;

  const numberOfWeapons = parseNumberFromNdfValue(
    mountedWeaponDescriptor,
    'NbWeapons'
  );
  mountedWeaponJson.numberOfWeapons = numberOfWeapons;

  const rotationSearch = search(turretDescriptor, 'VitesseRotation');
  const turretRotationSpeed = rotationSearch?.[0]?.value?.value;

  let hasTurret = false;
  if (turretRotationSpeed) {
    hasTurret = true;
  }

  mountedWeaponJson.hasTurret = hasTurret;
  mountedWeaponJson.turretRotationSpeed = Number(turretRotationSpeed);

  // traits for things like radar, f&f, motion firing, indirect fire, etc
  mountedWeaponJson.traits = search(
    ammunitionDescriptor,
    'TraitsToken'
  )[0].value.values.map((t: any) => t.value.replaceAll("'", ''));

  mountedWeaponJson.ammoDescriptorName = ammunitionDescriptorId;
  mountedWeaponJson.weaponName = prettifyAmmoDescriptorName(
    mountedWeaponJson.ammoDescriptorName
  );
  mountedWeaponJson.he = heDamage;
  mountedWeaponJson.suppress = suppress;

  const groundMaxRange = parseNumberFromMetre(
    removeBracketsFromValue(
      extractValueFromSearchResult(
        search(ammunitionDescriptor, 'PorteeMaximale')
      )
    )
  );
  mountedWeaponJson.groundRange = Math.round(groundMaxRange);
  mountedWeaponJson.helicopterRange = Math.round(
    parseNumberFromMetre(
      removeBracketsFromValue(
        extractValueFromSearchResult(
          search(ammunitionDescriptor, 'PorteeMaximaleTBA')
        )
      )
    )
  );
  mountedWeaponJson.planeRange = Math.round(
    parseNumberFromMetre(
      removeBracketsFromValue(
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

  const totalHeDamage = heDamage * salvoLength * numberOfWeapons;
  mountedWeaponJson.totalHeDamage = totalHeDamage;

  const timeBetweenSalvos = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'TempsEntreDeuxTirs'
  );

  mountedWeaponJson.timeBetweenSalvos = timeBetweenSalvos;

  const ammunitionPerSalvo = parseNumberFromNdfValue(
    ammunitionDescriptor,
    'AffichageMunitionParSalve'
  );

  mountedWeaponJson.ammunitionPerSalvo = ammunitionPerSalvo;

  const rateOfFire =
    (ammunitionPerSalvo /
      ((salvoLength - 1) * timeBetweenSalvos + reloadTime)) *
    60;
  mountedWeaponJson.rateOfFire = Math.round(rateOfFire);

  const trueRateOfFire =
    (salvoLength / ((salvoLength - 1) * timeBetweenSalvos + reloadTime)) * 60;
  mountedWeaponJson.trueRateOfFire = trueRateOfFire;

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
  // ** izohek:
  // ** ndf-parser >= 1.2.0 simplified this array and removes one of the values we're skipping here (now only n and n+1).
  // ** previous versions would split the name space and name as separate array values (EBaseHitValueModifier & Base)
  // ** but in versions 1.2.0 and forward these values are combined into a single entity: "EBaseHitValueModifier/Base"
  // ** we now split on '/' and remove the EBaseHitValueModifier prefix to match existing logic
  for (let i = 0; i < baseHitValueModifierValues.length; i += 2) {
    const baseHitValueModifierName =
      baseHitValueModifierValues[i].name.split('/')[1];
    const baseHitValueModifierValue = baseHitValueModifierValues[i + 1];
    valueModifiers[baseHitValueModifierName] = Number(
      baseHitValueModifierValue.value
    );
  }

  // Guide found here: https://github.com/Perytron/WARNO-DATA/wiki/In-Depth-Guide suggested that it the modifier should be multipled by NbTirParSalves for true accuracy. For now we will use the one displayed in the unit card
  const staticAccuracy = valueModifiers['Idling'];
  const movingAccuracy = valueModifiers['Moving'];

  mountedWeaponJson.staticAccuracy = staticAccuracy;
  mountedWeaponJson.movingAccuracy = movingAccuracy;


  const staticAccuracyOverDistance = [];
  const movingAccuracyOverDistance = [];

  // Accuracy calculation 
  // Total accuracy = Accuracy + (Accuracy * Bonus)

  for(const accuracy of accuracyBonusOverRange) {
    const staticAccuracyCalc = staticAccuracy + (accuracy.multiplier * staticAccuracy);
    const movingAccuracyCalc = movingAccuracy + (accuracy.multiplier * movingAccuracy);
    staticAccuracyOverDistance.push({distance: accuracy.distance, accuracy: staticAccuracyCalc})
    movingAccuracyOverDistance.push({distance: accuracy.distance, accuracy: movingAccuracyCalc})
  }

  mountedWeaponJson.staticAccuracyScaling = staticAccuracyOverDistance;
  mountedWeaponJson.movingAccuracyScaling = movingAccuracyOverDistance;

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

  const isKinetic =  piercingWeapon && damageFamily === '"ap"';
  const kineticAP = Math.round(Number(damageIndex) - groundMaxRange / damageDropOffValue);
  const heatAP = Number(damageIndex);

  const kineticInstakillAtMaxRangeArmour = kineticAP - KINETIC_AP_MAGIC_NUMBER;
  const heatInstakillAtMaxRangeArmour = heatAP - HEAT_AP_MAGIC_NUMBER;

  const penetration = isKinetic ? kineticAP : heatAP;
  const instaKillAtMaxRangeArmour = isKinetic ? kineticInstakillAtMaxRangeArmour : heatInstakillAtMaxRangeArmour;

  mountedWeaponJson.penetration = penetration;
  mountedWeaponJson.instaKillAtMaxRangeArmour = instaKillAtMaxRangeArmour;

  return mountedWeaponJson;
}

function isMountedWeaponSmoke(mountedWeaponDescriptor: any): boolean {
  const ammunition: string = extractValueFromSearchResult(
    search(mountedWeaponDescriptor, 'Ammunition')
  );

  if (ammunition.includes('Ammo_SMOKE_Vehicle')) {
    return true;
  }

  return false;
}

function extractLastTokenFromString(path: string) {
  const pathTokens = path.split('/');
  const lastToken = pathTokens[pathTokens.length - 1];
  return lastToken;
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

  if((armourType as unknown as Armour) === Armour.Helico) {
    const baseArmourValue = Number(armourStrength);

    const helicoArmour = baseArmourValue - 1;
    if(helicoArmour >= 1) {
      return helicoArmour;
    }

    return 0.5;
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

function parseNumberFromSecond(metreValue: string) {
  const numberTokens = metreValue.split('*');
  return Number(numberTokens[0]);
}

function removeBracketsFromValue(target: string) {
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
  return (
    descriptor
      // remove prefixes and suffixes
      .replace(/(^Ammo_)|(_late|_early)$/g, '')
      // some names have numbers in them that should not later be converted to '.' like ammunition size
      .replace(/(?<=(HS|RPK|UPK|G[sS]h|ZU[\d]*))_(?=[\d]*)/, '-')
      // some names like above have two numbers in them, "gsh-30-2".  this fixes issue where they all get converted to '.' by ammunition size conversion
      .replace(/(?<=(UPK|G[sS]h)-[\d]*)_(?=[\d]*)(?![\d]*[Mm]{2})/, '-')
      // underscores to spaces
      .split('_')
      .join(' ')
      // replace spaces with '.' for ammunition size " 7 75" -> " 7.75"
      .replace(/(?<=\s[\d]*)\s(?=\d)/g, '.')
      // sometimes values come out like: "77 mm" -> coverts to "77mm"
      .replace(/(?<=[\d]*)\s(?=mm)/g, '')
      //  remove prefixes with duplicate info to shorten some of these names
      .replace(
        /^(Howz Canon|Howz|Canon AP|Canon HEAT|Canon HE|MMG inf|MMG|HMG inf|HMG|ATGM|Mortier|AutoCanon AP|AutoCanon HE|AutoCanon|DCA \d canons?|RocketInf|Grenade|RocketArt thermobaric|RocketArt|AA |GatlingAir|RocketAir|Bomb CBU|Bomb|FakeRoquette|SAM |Lance grenade|Gatling|Pod|flamethrower|MANPAD|FM |PM |Canon|AGM)/g,
        ''
      )
      .trim()
  );
}

/**
 * Convert a units descriptor to a more displayable name.
 *
 * @param descriptor unit descriptor
 * @returns displayable unit name
 */
function prettyUnitNameFromDescriptor(descriptor: string): string {
  return descriptor
    .replace(/^Descriptor_Unit_/g, '')
    .split('_')
    .join(' ');
}
