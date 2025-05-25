import { NdfObject, ParserMap } from '@izohek/ndf-parser/dist/src/types';
import { findUnitCardByDescriptor } from '@izohek/warno-db';
import { DescriptorIdMap, SpeedModifier } from '../../commands/ndf-to-json';
import { AbstractManager } from './abstract-manager';
import { MappedNdf, NdfManager } from './ndf-manager';
import { isNdfObject } from './utils';
import { Weapon, WeaponManager } from './weapon-manager';
import { search } from '@izohek/ndf-parser';

export const AIR_FUEL_PER_SECOND = 10;
export const AIR_HEALTH_PER_SECOND = 0.018;
export const AIR_SUPPLY_PER_SECOND = 1;

export enum InfoPanelType {
  DEFAULT = 'default',
  SUPPLY_VEHICLE = 'supply-vehicle',
  TRANSPORT_VEHICLE = 'transport-vehicle',
  INFANTRY = 'infantry',
  PLANE = 'plane',
  HELICOPTER = 'helicopter',
  TRANSPORT_HELICOPTER = 'transport-helicopter',
  SUPPLY_HELICOPTER = 'supply-helicopter',
}

export interface NdfInfoPanelMap {
  [key: string]: InfoPanelType;
}

const infoPanelMap: NdfInfoPanelMap = {
  Default: InfoPanelType.DEFAULT,
  VehiculeSupplier: InfoPanelType.SUPPLY_VEHICLE,
  VehiculeTransporter: InfoPanelType.TRANSPORT_VEHICLE,
  Infantry: InfoPanelType.INFANTRY,
  avion: InfoPanelType.PLANE,
  HelicoDefault: InfoPanelType.HELICOPTER,
  HelicoTransporter: InfoPanelType.TRANSPORT_HELICOPTER,
  HelicoSupplier: InfoPanelType.SUPPLY_HELICOPTER,
};

export enum ArmourToken {
  Blindage = 'blindage',
  Infanterie = 'infanterie',
  Vehicule = 'vehicule',
  Helico = 'helico',
  Avion = 'avion',
}

export type Unit = {
  descriptorName: string;
  name: string;
  id: number;
  unitType: UnitType;
  commandPoints: number;
  infoPanelType: InfoPanelType;
  factoryDescriptor: string;
  frontArmor: number;
  sideArmor: number;
  rearArmor: number;
  topArmor: number;
  frontArmorType: string;
  sideArmorType: string;
  rearArmorType: string;
  topArmorType: string;
  maxDamage: number;
  speed: number;
  speedsForTerrains?: SpeedOnTerrain[];
  roadSpeed: number;
  rotationTime: number;
  optics: number;
  airOptics: number;
  lowAltOptics?: number;
  opticsRange?: number;
  airOpticsRange?: number;
  lowAltOpticsRange?: number;
  bombStrategy: string | undefined;
  stealth: number;
  advancedDeployment: number;
  fuel: number;
  fuelMove: number;
  supply: number;
  ecm: number;
  agility?: number;
  travelTime: number | null;
  specialities: string[];
  hasDefensiveSmoke: boolean;
  isSellable: boolean;
  weapons: Weapon[];
  divisions: string[];
  flyingAltitude?: number;
  maxRefuelTime?: number;
  maxRearmTime?: number;
  maxRepairTime?: number;
  isCommand?: boolean;
  dangerousness?: number;
  movementType: MovementType;
  occupiableTerrains: string[];
  era: boolean;
  isSpecialForces: boolean;
  xpBonuses: string;
};

export type SpeedOnTerrain = {
  name: string;
  speed: number;
};

export type UnitType = {
  nationality: string;
  motherCountry: string;
  formation: string;
};

export enum MovementType {
  LAND = 'land',
  HELICOPTER = 'helicopter',
  PLANE = 'plane',
}

/**
 * Responsible for extracting properties for units
 */
export class UnitManager extends AbstractManager {
  constructor(
    unitDescriptor: NdfObject,
    speedModifiers: SpeedModifier[],
    mappedWeapons: MappedNdf,
    mappedAmmo: MappedNdf,
    mappedSmoke: MappedNdf,
    mappedMissiles: MappedNdf,
    unitIdMap: DescriptorIdMap,
    bonusPrecision: number,
    i18nMap?: { [key: string]: string }
  ) {
    super(unitDescriptor);
    this.speedModifiers = speedModifiers;
    this.mappedWeapons = mappedWeapons;
    this.mappedAmmo = mappedAmmo;
    this.mappedSmoke = mappedSmoke;
    this.mappedMissiles = mappedMissiles;
    this.unitIdMap = unitIdMap;
    this.bonusPrecision = bonusPrecision;
    this.i18nMap = i18nMap;
  }

  speedModifiers: SpeedModifier[];
  mappedWeapons: MappedNdf;
  mappedAmmo: MappedNdf;
  mappedSmoke: MappedNdf;
  mappedMissiles: MappedNdf;
  unitIdMap: DescriptorIdMap;
  bonusPrecision: number;
  i18nMap?: { [key: string]: string };

  parse() {
    const descriptorName = this.ndf.name;

    const nameToken = (
      (this.getValueFromSearch('NameToken') as string) || undefined
    )?.replaceAll(`'`, '');
    let name;

    if (nameToken) {
      name =
        this.i18nMap?.[nameToken]?.replaceAll(`\"`, '').replaceAll(`\r`, '') ||
        undefined;
    }

    if (!name || name.length === 0) {
      name = this.prettyUnitNameFromDescriptor(descriptorName);
    }

    const id = this.unitIdMap[descriptorName];

    const unitType = this.extractUnitType();

    const productionResources = this.getFirstSearchResult(
      'ProductionRessourcesNeeded'
    );

    const commandPoints = Number(
      NdfManager.extractTupleFromMap(
        productionResources.value as ParserMap,
        'Resource_CommandPoints'
      )
    );

    const descriptorInformationPanelType = this.getValueFromSearch<string>(
      'InfoPanelConfigurationToken'
    ).replace(/'/g, '');
    const infoPanelType = infoPanelMap[descriptorInformationPanelType];

    const factoryDescriptor = this.getValueFromSearch<string>('Factory');
    const armourValues = this.extractArmourValues();
    const era =
      this.getValueFromSearch<string>('ExplosiveReactiveArmor') === 'True';

    const maxDamage =
      Number(this.getValueFromSearch<string>('MaxPhysicalDamages')) ||
      Number(this.getValueFromSearch<string>('MaxDamages'));

    let speed = this.getSpeed('MaxSpeedInKmph');

    const isSpecialForces = (
      this.getValueFromSearch<string>('ExperienceLevelsPackDescriptor') || ''
    )?.includes('~/ExperienceLevelsPackDescriptor_XP_pack_SF');
    const xpBonuses = this.getValueFromSearch<string>(
      'ExperienceLevelsPackDescriptor'
    ).slice('~/'.length);

    if (this.getFirstSearchResult('SpeedInKmph')) {
      speed = this.getSpeed('SpeedInKmph');
    }

    const unitMoveTypeValue = this.getValueFromSearch<string>('UnitMovingType');
    let speedsForTerrains;
    if (unitMoveTypeValue) {
      speedsForTerrains = this.calculateSpeedsForTerrains(
        unitMoveTypeValue,
        speed
      );
    }

    let roadSpeed;
    if (this.getFirstSearchResult('DisplayRoadSpeedInKmph')) {
      roadSpeed = Math.round(this.getValueFromSearch('DisplayRoadSpeedInKmph'));
    } else {
      roadSpeed = Math.round(this.getValueFromSearch('RealRoadSpeed'));
    }

    const rotationTime = Number(this.getValueFromSearch('TempsDemiTour'));



    const opticalStrengthsMap = this.getValueFromSearch<any[]>('OpticalStrengths');
    const visionRangesMap = this.getValueFromSearch<any[]>('VisionRangesGRU');

    
    const movementType = this.getMovementType();


    let optics;
    let airOptics;
    let lowAltOptics;
    let opticsRange;
    let airOpticsRange;
    let lowAltOpticsRange;
    // new optics
    if(opticalStrengthsMap) {
      const _parseMap = function (opticalStrength: any) {
        const opticalStrengthTuple = opticalStrength.value;
        const opticalStrengthType = opticalStrengthTuple[0].value;
        const opticalStrengthValue = opticalStrengthTuple[1].value;
        return [opticalStrengthType, opticalStrengthValue];
      }

      const opticalStrengths = opticalStrengthsMap.map(_parseMap);
      const visionRanges = visionRangesMap.map(_parseMap);

      if(!opticalStrengths) {
        optics = 0;
        airOptics = 0;
      }
      else {
        const STANDARD_OPTICS = 'EVisionUnitType/Standard';
        const LOW_ALT_OPTICS = 'EVisionUnitType/LowAltitude';
        const HIGH_ALT_OPTICS = 'EVisionUnitType/HighAltitude';

        const _getTupleValueFromKey = function ([type, _]: [string, string]) {
          return type === STANDARD_OPTICS;
        }; 

        const getOpticsValue = (key: string, _values: any[]) => 
          Number(_values.find(([type, _]) => type === key)?.[1] ?? 0);

        optics = getOpticsValue(STANDARD_OPTICS, opticalStrengths);
        lowAltOptics = getOpticsValue(LOW_ALT_OPTICS, opticalStrengths);
        airOptics = getOpticsValue(HIGH_ALT_OPTICS, opticalStrengths);

        opticsRange = getOpticsValue(STANDARD_OPTICS, visionRanges);
        lowAltOpticsRange = getOpticsValue(LOW_ALT_OPTICS, visionRanges);
        airOpticsRange = getOpticsValue(HIGH_ALT_OPTICS, visionRanges);
      }
    }
    // legacy optics
    else {
      optics = Number(this.getValueFromSearch('OpticalStrength'));

      airOptics = Number(
        this.getValueFromSearch('OpticalStrengthAltitude')
      );

      if(movementType === "plane") {
        lowAltOptics = airOptics;
        lowAltOpticsRange = Number(this.getValueFromSearch('PorteeVisionTBAGRU'));
      }
      else {
        lowAltOptics = optics;
        lowAltOpticsRange = Number(this.getValueFromSearch('DetectionTBAGRU'));
      }


      opticsRange = Number(this.getValueFromSearch('PorteeVisionGRU'));
  

      const specialisedDetections = this.getFirstSearchResult('SpecializedDetectionsGRU');
      if(specialisedDetections) {
        const highAltitudeValue = NdfManager.extractTupleFromMap(specialisedDetections.value,'EVisionUnitType/AlwaysInHighAltitude');
        airOpticsRange = Number(highAltitudeValue);
      }
      else {
        airOpticsRange = 0;
      }
 
      

    }


    const bombStrategy = this.getBombStrategy();
    const stealth = Number(this.getValueFromSearch('UnitConcealmentBonus'));

    let advancedDeployment = 0;
    if (this.getFirstSearchResult('DeploymentShiftGRU')) {
      const deploymentShift =
        Number(
          this.getValueFromSearch<string | undefined>('DeploymentShiftGRU')
        ) || 0;
      advancedDeployment = Math.round(deploymentShift);
    } else {
      const deploymentShift =
        this.getValueFromSearch<string | undefined>('DeploymentShift') || '0';
      advancedDeployment = Math.round(
        NdfManager.parseNumberFromMetre(deploymentShift) || 0
      );
    }

    const fuel = Number(this.getValueFromSearch('FuelCapacity'));
    const fuelMove = Number(this.getValueFromSearch('FuelMoveDuration'));
    const supply = Number(this.getValueFromSearch('SupplyCapacity'));
    const ecm = Number(this.getValueFromSearch('HitRollECM'));

    let agilityRadius: number | undefined;

    if (this.getFirstSearchResult('AgilityRadiusGRU')) {
      agilityRadius = Number(this.getValueFromSearch('AgilityRadiusGRU'));
    } else {
      const agilityRadiusSearchResult =
        this.getValueFromSearch('AgilityRadius');

      if (agilityRadiusSearchResult) {
        agilityRadius = Math.round(
          NdfManager.parseNumberFromMetre(agilityRadiusSearchResult as string)
        );
      }
    }

    let flyingAltitude: number | undefined;

    if (this.getFirstSearchResult('AltitudeGRU')) {
      flyingAltitude = Number(this.getValueFromSearch('AltitudeGRU'));
    } else {
      const flyingAltitudeSearchResult = this.getValueFromSearch('Altitude');

      if (flyingAltitudeSearchResult) {
        flyingAltitude = Math.round(
          NdfManager.parseNumberFromMetre(flyingAltitudeSearchResult as string)
        );
      }
    }

    const travelTime =
      Number(this.getValueFromSearch('TravelDuration')) || null;

    const isSellable = Boolean(
      this.getFirstSearchResult('TSellModuleDescriptor')
    );

    const dangerousnessResult = this.getValueFromSearch('Dangerousness');
    let dangerousness;

    if (dangerousnessResult) {
      dangerousness = Number(dangerousnessResult);
    }

    const occupiableTerrains = this.getOccupiableTerrains();

    /**
     * Extract weapon data for the weapon descriptors associated to this descriptor by finding the weapon manager and then using  the weapon manager to extract the weapon data
     */

    const weaponManagerSearchResult =
      this.getFirstSearchResult('WeaponManager');
    const weaponManagerPath =
      weaponManagerSearchResult?.children[0]?.value?.value;

    let weapons: Weapon[] = [];
    let hasDefensiveSmoke = false;

    if (weaponManagerPath !== undefined) {
      const weaponManagerId = NdfManager.extractLastToken(weaponManagerPath);
      const weaponManagerDescriptor = this.mappedWeapons[weaponManagerId];

      if (isNdfObject(weaponManagerDescriptor)) {
        const weaponManager = new WeaponManager(
          weaponManagerDescriptor,
          this.mappedAmmo,
          this.mappedSmoke,
          this.mappedMissiles,
          this.bonusPrecision,
          this.i18nMap
        );
        const { weapons: parsedWeapons, hasDefensiveSmoke: smoke } =
          weaponManager.parse();

        weapons = [...parsedWeapons];
        hasDefensiveSmoke = smoke;
      }
    }

    const isPlane = Boolean(travelTime);

    let maxRefuelTime;
    let maxRepairTime;
    let maxRearmTime;

    if (isPlane) {
      maxRefuelTime = Math.round(fuel / AIR_FUEL_PER_SECOND);
      maxRepairTime = Math.round(maxDamage / AIR_HEALTH_PER_SECOND);

      let maxSupplyCost = 0;
      for (const weapon of weapons) {
        if (weapon.supplyCost > maxSupplyCost) {
          maxSupplyCost = weapon.supplyCost;
        }
      }

      maxRearmTime = Math.round(maxSupplyCost / AIR_SUPPLY_PER_SECOND);
    }

    const specialities = this.getSpecialities();
    const isCommand = specialities.includes('_leader') || undefined;

    const unit: Unit = {
      descriptorName,
      name,
      id,
      unitType,
      commandPoints,
      infoPanelType,
      factoryDescriptor,
      frontArmor: armourValues.front[1],
      sideArmor: armourValues.side[1],
      rearArmor: armourValues.rear[1],
      topArmor: armourValues.top[1],
      frontArmorType: armourValues.front[0],
      sideArmorType: armourValues.side[0],
      rearArmorType: armourValues.rear[0],
      topArmorType: armourValues.top[0],
      maxDamage,
      speed,
      speedsForTerrains,
      roadSpeed,
      rotationTime,
      optics,
      airOptics,
      lowAltOptics,
      opticsRange,
      airOpticsRange,
      lowAltOpticsRange,
      bombStrategy,
      stealth,
      advancedDeployment,
      fuel,
      fuelMove,
      supply,
      ecm,
      agility: agilityRadius,
      travelTime,
      specialities,
      hasDefensiveSmoke,
      isSellable,
      weapons,
      divisions: [],
      flyingAltitude,
      maxRefuelTime,
      maxRepairTime,
      maxRearmTime,
      isCommand,
      dangerousness,
      movementType,
      occupiableTerrains,
      era,
      isSpecialForces,
      xpBonuses,
    };

    return unit;
  }


  private getSpeed(speedToken: string) {
    let speed;
    try {
      speed = Number(this.getValueFromSearch(speedToken));
    } catch {
      speed = 0;
    }
    return speed;
  }

  /**
   *  Extracts the armour values from the unit descriptor
   * @returns armour values object
   */
  private extractArmourValues() {
    const frontArmour =
      this.getFirstSearchResult('ResistanceFront')?.value?.children[0]?.value
        ?.value;
    const sideArmour =
      this.getFirstSearchResult('ResistanceSides')?.value?.children[0]?.value
        ?.value;
    const rearArmour =
      this.getFirstSearchResult('ResistanceRear')?.value?.children[0]?.value
        ?.value;
    const topArmour =
      this.getFirstSearchResult('ResistanceTop')?.value?.children[0]?.value
        ?.value;

    return {
      front: this.getArmourTypeAndStrength(frontArmour),
      side: this.getArmourTypeAndStrength(sideArmour),
      rear: this.getArmourTypeAndStrength(rearArmour),
      top: this.getArmourTypeAndStrength(topArmour),
    };
  }

  getOccupiableTerrains(): string[] {
    const garrisonableTerrains = this.getFirstSearchResult('TerrainList');
    const valuesAsString =
      garrisonableTerrains?.value?.values?.[0].value?.trim();
    const valuesAsArray = valuesAsString?.split(', ');
    const tidiedUpValues = valuesAsArray?.map((value: string) => {
      const valueTokens = value.split('/');

      // take last token and remove any ,
      const lastToken = valueTokens[valueTokens.length - 1].replace(',', '');
      return lastToken;
    });

    // remove "Tranchee", "NidMitrailleuse", "ForetDense"
    return (tidiedUpValues || [])?.filter(
      (value: string) =>
        value !== 'Tranchee' &&
        value !== 'NidMitrailleuse' &&
        value !== 'ForetDense'
    );
  }

  /**
   * Calculates the speed for each terrain type
   * @param unitMoveTypeValue
   * @param speed
   */
  private calculateSpeedsForTerrains(
    unitMoveTypeValue: string,
    speed: number
  ): SpeedOnTerrain[] {
    const speedForTerrains: SpeedOnTerrain[] = [];
    const speedModifiers = this.speedModifiers;
    const moveType = NdfManager.extractLastToken(unitMoveTypeValue);

    for (const speedModifier of speedModifiers) {
      const moveTypes = Object.keys(speedModifier.movementTypes);
      const foundMoveType = moveTypes.find((_moveType) =>
        moveType.includes(_moveType)
      );

      if (foundMoveType) {
        const modifier =
          speedModifier.movementTypes[
            foundMoveType as keyof typeof speedModifier.movementTypes
          ];
        const modifiedSpeed = Math.round(speed * modifier.value);
        speedForTerrains.push({
          speed: modifiedSpeed,
          name: speedModifier.name,
        });
      }
    }

    return speedForTerrains;
  }

  /**
   * Calculates the specialties for the unit by extract SpecialtiesList from the descriptor
   * @returns array of specialties
   */
  private getSpecialities(): string[] {
    const unitRole = NdfManager.extractValueFromSearchResult<string>(this.getFirstSearchResult('UnitRole')).replace(/'/g, '');

    let roleSpecialty;
    if(!unitRole.startsWith("tank_")) {
      roleSpecialty = unitRole;
    }

    const specialitiesList = this.getFirstSearchResult('SpecialtiesList');
    let specialties =
      NdfManager.extractValuesFromSearchResult<string>(specialitiesList);

    // Maps and filters the specialties to remove the appui speciality and remove the quotes
    specialties = specialties
      ?.map((specialty: any) => {
        return specialty.value
          .replace(/^(["']*)/g, '')
          .replace(/(["']*)$/g, '');
      })


      specialties = specialties || [];

      if(roleSpecialty) {
        // append to start
        specialties.unshift(roleSpecialty);
      }

    return specialties.filter((specialty: any) => {
      return specialty && specialty !== 'appui';
    });
  }

  /**
   * Calculates the bomb strategy for the unit
   * @returns string representing the bomb strategy
   */
  private getBombStrategy(): string | undefined {
    const diveBombResult = this.getFirstSearchResult(
      'DiveBombAttackStrategyDescriptor'
    );
    const normalBombResult = this.getFirstSearchResult(
      'BombAttackStrategyDescriptor'
    );

    if (diveBombResult) {
      return 'DIVE';
    }

    if (normalBombResult) {
      return 'NORMAL';
    }
  }

  /**
   * Returns a number representing the armour value
   * @param armourToken armour token from ndf value
   * @returns number representing armour value
   */
  private getArmourTypeAndStrength(
    armourTokenString: string
  ): [string, number] {
    const armourTypeToken: string = armourTokenString.split(' ')[0];
    const armourStrengthToken: string = armourTokenString.split(' ')[1];

    const armourTypeTokenTokens = armourTypeToken.split('_');
    const armourType = armourTypeTokenTokens[1];

    const armourStrengthTokenTokens = armourStrengthToken.split('=');
    const armourStrength = armourStrengthTokenTokens[1];

    // const armourStrength = armourTokenTokens[2];

    // If infanterie, then this is 0 armour
    if ((armourType as unknown as ArmourToken) === ArmourToken.Infanterie) {
      return [`${armourType}-${armourStrength}`, 0];
    }

    if (
      (armourType as unknown as ArmourToken) === ArmourToken.Helico ||
      (armourType as unknown as ArmourToken) === ArmourToken.Avion ||
      (armourType as unknown as ArmourToken) === ArmourToken.Vehicule
    ) {
      const baseArmourValue = Number(armourStrength);

      const vehicleArmour = baseArmourValue - 1;
      if (vehicleArmour >= 1) {
        return [`${armourType}-${armourStrength}`, vehicleArmour];
      }

      return [`${armourType}-${armourStrength}`, 0.5];
    }

    if ((armourType as unknown as ArmourToken) === ArmourToken.Blindage) {
      return [`${armourType}-${armourStrength}`, Number(armourStrength)];
    }

    return [`${armourType}-${armourStrength}`, Number(armourStrength)];
  }

  /**
   * Extracts the unit type from the descriptor
   * @returns unit type object
   */
  private extractUnitType(): UnitType {
    const unitTypePrettyKeys = {
      Nationalite: 'nationality',
      MotherCountry: 'motherCountry',
      TypeUnitFormation: 'formation',
    };

    const unitType = {
      nationality: '',
      motherCountry: '',
      formation: '',
    };

    const unitTypeSearchResult = this.getFirstSearchResult(
      'TTypeUnitModuleDescriptor'
    );

    for (const unitModule of unitTypeSearchResult.children) {
      const prettyValue =
        unitTypePrettyKeys[unitModule.name as keyof typeof unitTypePrettyKeys];
      if (prettyValue) {
        unitType[prettyValue as keyof typeof unitType] =
          unitModule.value.value.replace(/'/g, '');
      }
    }

    return unitType;
  }

  private getMovementType(): MovementType {
    const isLandMovement = this.getFirstSearchResult('LandMovement');
    const isAirplaneMovement = this.getFirstSearchResult('AirplaneMovement');
    const isHelicopterMovement =
      this.getFirstSearchResult('HelicopterMovement');

    if (isLandMovement) {
      return MovementType.LAND;
    }

    if (isAirplaneMovement) {
      return MovementType.PLANE;
    }

    if (isHelicopterMovement) {
      return MovementType.HELICOPTER;
    }

    return MovementType.LAND;
  }

  /**
   * Converts a descriptor name to a pretty unit name
   * @param descriptor descriptor name
   * @returns  pretty unit name
   */
  private prettyUnitNameFromDescriptor(descriptor: string): string {
    return descriptor
      .replace(/^Descriptor_Unit_/g, '')
      .split('_')
      .join(' ');
  }
}
