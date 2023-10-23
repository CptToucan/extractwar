import { NdfObject, ParserMap } from '@izohek/ndf-parser/dist/src/types';
import { findUnitCardByDescriptor } from '@izohek/warno-db';
import { DescriptorIdMap, SpeedModifier } from '../../commands/ndf-to-json';
import { AbstractManager } from './abstract-manager';
import { MappedNdf, NdfManager } from './ndf-manager';
import { isNdfObject } from './utils';
import { Weapon, WeaponManager } from './weapon-manager';

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
  category: string;
  id: number;
  unitType: UnitType;
  commandPoints: number;
  infoPanelType: InfoPanelType;
  factoryDescriptor: string;
  frontArmor: number;
  sideArmor: number;
  rearArmor: number;
  topArmor: number;
  maxDamage: number;
  speed: number;
  speedsForTerrains?: SpeedOnTerrain[];
  roadSpeed: number;
  rotationTime: number;
  optics: number;
  airOptics: number;
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
    unitIdMap: DescriptorIdMap
  ) {
    super(unitDescriptor);
    this.speedModifiers = speedModifiers;
    this.mappedWeapons = mappedWeapons;
    this.mappedAmmo = mappedAmmo;
    this.mappedSmoke = mappedSmoke;
    this.mappedMissiles = mappedMissiles;
    this.unitIdMap = unitIdMap;
  }

  speedModifiers: SpeedModifier[];
  mappedWeapons: MappedNdf;
  mappedAmmo: MappedNdf;
  mappedSmoke: MappedNdf;
  mappedMissiles: MappedNdf;
  unitIdMap: DescriptorIdMap;

  parse() {
    const descriptorName = this.ndf.name;

    const localizedUnitCard = findUnitCardByDescriptor(descriptorName);

    let name = localizedUnitCard?.name || '';

    if (name.length === 0) {
      name = this.prettyUnitNameFromDescriptor(descriptorName);
    }

    const category = localizedUnitCard?.category || '';
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
    const maxDamage =
      Number(this.getValueFromSearch<string>('MaxPhysicalDamages')) ||
      Number(this.getValueFromSearch<string>('MaxDamages'));

    let speed: number;

    try {
      speed = Math.round(
        NdfManager.parseSpeedNumberFromMetre(
          this.getValueFromSearch('MaxSpeed')
        )
      );
    } catch {
      speed = 0;
    }

    try {
      speed = Math.round(
        NdfManager.parseSpeedNumberFromMetre(this.getValueFromSearch('Speed'))
      );
    } catch {
      console.log('Could not parse speed, using MaxSpeed');
    }

    const unitMoveTypeValue = this.getValueFromSearch<string>('UnitMovingType');
    let speedsForTerrains;
    if (unitMoveTypeValue) {
      speedsForTerrains = this.calculateSpeedsForTerrains(
        unitMoveTypeValue,
        speed
      );
    }

    const roadSpeed = Math.round(this.getValueFromSearch('RealRoadSpeed'));
    const rotationTime = Number(this.getValueFromSearch('TempsDemiTour'));
    const optics = Number(this.getValueFromSearch('OpticalStrength'));
    const airOptics = Number(
      this.getValueFromSearch('OpticalStrengthAltitude')
    );
    const bombStrategy = this.getBombStrategy();
    const stealth = Number(this.getValueFromSearch('UnitConcealmentBonus'));
    const deploymentShift = this.getValueFromSearch<string | undefined>(
      'DeploymentShift'
    );
    const advancedDeployment = deploymentShift
      ? Math.round(NdfManager.parseNumberFromMetre(deploymentShift))
      : 0;
    const fuel = Number(this.getValueFromSearch('FuelCapacity'));
    const fuelMove = Number(this.getValueFromSearch('FuelMoveDuration'));
    const supply = Number(this.getValueFromSearch('SupplyCapacity'));
    const ecm = Number(this.getValueFromSearch('HitRollECM'));

    /**
     * Parse the agility radius from the descriptor and parse the number from the metre string when the value is present
     */
    const agilityRadius = this.getValueFromSearch<string | undefined>(
      'AgilityRadius'
    )
      ? Math.round(
          NdfManager.parseNumberFromMetre(
            this.getValueFromSearch('AgilityRadius')
          )
        )
      : undefined;

    const flyingAltitude = this.getValueFromSearch('LowAltitudeFlyingAltitude')
      ? Math.round(
          NdfManager.parseNumberFromMetre(
            this.getValueFromSearch('LowAltitudeFlyingAltitude')
          )
        )
      : undefined;

    const travelTime =
      Number(this.getValueFromSearch('TravelDuration')) || null;

    const isSellable = Boolean(
      this.getFirstSearchResult('TSellModuleDescriptor')
    );

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
          this.mappedMissiles
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
      category,
      id,
      unitType,
      commandPoints,
      infoPanelType,
      factoryDescriptor,
      frontArmor: armourValues.front,
      sideArmor: armourValues.side,
      rearArmor: armourValues.rear,
      topArmor: armourValues.top,
      maxDamage,
      speed,
      speedsForTerrains,
      roadSpeed,
      rotationTime,
      optics,
      airOptics,
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
    };

    return unit;
  }

  /**
   *  Extracts the armour values from the unit descriptor
   * @returns armour values object
   */
  private extractArmourValues() {
    const frontArmour = this.getValueFromSearch<string>('ResistanceFront');
    const sideArmour = this.getValueFromSearch<string>('ResistanceSides');
    const rearArmour = this.getValueFromSearch<string>('ResistanceRear');
    const topArmour = this.getValueFromSearch<string>('ResistanceTop');

    console.log(frontArmour, sideArmour, rearArmour, topArmour)
    return {
      front: this.convertArmourTokenToNumber(frontArmour),
      side: this.convertArmourTokenToNumber(sideArmour),
      rear: this.convertArmourTokenToNumber(rearArmour),
      top: this.convertArmourTokenToNumber(topArmour),
    };
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
      .filter((specialty: any) => {
        return specialty && specialty !== 'appui';
      });

    return specialties;
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
  private convertArmourTokenToNumber(armourToken: string): number {
    console.log(armourToken);
    const armourTokenTokens = armourToken.split('_');
    const armourType = armourTokenTokens[1];
    const armourStrength = armourTokenTokens[2];

    // If leger is returned, this is light armour and displays as >1 in Unit cards
    if (armourStrength === 'leger') {
      return 0.5;
    }

    // If infanterie, then this is 0 armour
    if ((armourType as unknown as ArmourToken) === ArmourToken.Infanterie) {
      return 0;
    }

    // infanterie
    // blindage
    // vehicule
    // helico
    // avion

    if ((armourType as unknown as ArmourToken) === ArmourToken.Helico || (armourType as unknown as ArmourToken) === ArmourToken.Avion) {
      const baseArmourValue = Number(armourStrength);

      const airVehicleArmour = baseArmourValue - 1;
      if (airVehicleArmour >= 1) {
        return airVehicleArmour;
      }

      return 0.5;
    }

    return Number(armourStrength);
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
