import {
  NdfObject,
  ParserObject,
  ParserStringLiteral,
} from '@izohek/ndf-parser/dist/src/types';
import { AbstractManager } from './abstract-manager';
import { MissileManager, Missile } from './missile-manager';
import { MappedNdf } from './ndf-manager';
import { NdfManager } from './ndf-manager';
import { SmokeManager, Smoke } from './smoke-manager';
import { isParserStringLiteral } from './utils';

export type Ammo = {
  name: string;
  descriptorName: string;
  heDamage: number;
  heDamageRadius: number;
  suppress: number;
  suppressDamagesRadius: number;
  firesLeftToRight: boolean;
  groundMaxRange: number;
  groundMinRange: number;
  heliMaxRange: number;
  heliMinRange: number;
  planeMaxRange: number;
  planeMinRange: number;
  aimingTime: number;
  reloadTime: number;
  salvoLength: number;
  timeBetweenSalvos: number;
  ammunitionPerSalvo: number;
  rateOfFire: number;
  trueRateOfFire: number;
  supplyCostPerSalvo: number;
  staticAccuracy: number;
  movingAccuracy: number;
  staticAccuracyOverDistance?: AccuracyDataPointsForType;
  movingAccuracyOverDistance?: AccuracyDataPointsForType;
  distanceToTarget: boolean;
  damageDropOff: number;
  damageFamily: string;
  damageIndex: string;
  piercingWeapon: boolean;
  isKinetic: boolean;
  kineticAP: number;
  heatAP: number;
  penetration: number;
  instaKillAtMaxRangeArmour: number;
  missile: Missile | undefined;
  smoke: Smoke | undefined;
  traits: string[];
  textureId: string;
};

export interface AccuracyDataPointsForType {
  ground?: AccuracyDataPoint[];
  helicopter?: AccuracyDataPoint[];
  plane?: AccuracyDataPoint[];
}

export type AccuracyDataPoint = {
  distance: number;
  accuracy: number;
};

const ACCURACY_BONUS_OVER_RANGE = [
  {
    maxRangeDistanceMultiplier: 0.05,
    accuracyMultiplier: 1000,
  },
  {
    maxRangeDistanceMultiplier: 0.17,
    accuracyMultiplier: 100,
  },
  {
    maxRangeDistanceMultiplier: 0.33,
    accuracyMultiplier: 75,
  },
  {
    maxRangeDistanceMultiplier: 0.5,
    accuracyMultiplier: 50,
  },
  {
    maxRangeDistanceMultiplier: 0.67,
    accuracyMultiplier: 25,
  },
  {
    maxRangeDistanceMultiplier: 1,
    accuracyMultiplier: 0,
  },
];

type DamageDropOffMap = {
  [key: string]: number;
};

const DROP_OFF: DamageDropOffMap = {
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_AP1_1Km: 175,
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_Balle_500: 500,
  // eslint-disable-next-line camelcase
  DamageTypeEvolutionOverRangeDescriptor_DCA: 700,
};

const HEAT_AP_MAGIC_NUMBER = 14;
const KINETIC_AP_MAGIC_NUMBER = 18;

export class AmmunitionManager extends AbstractManager {
  constructor(
    ammunitionDescriptor: NdfObject,
    mappedSmoke: MappedNdf,
    mappedMissiles: MappedNdf,
    salvoMap: number[]
  ) {
    super(ammunitionDescriptor);
    this.mappedSmoke = mappedSmoke;
    this.mappedMissiles = mappedMissiles;
    this.salvoMap = salvoMap;
  }

  mappedSmoke: MappedNdf;
  mappedMissiles: MappedNdf;
  salvoMap: number[];

  /**
   *  Parses the ammunition descriptor into a JSON object
   *  @returns JSON object of the ammunition descriptor
   *
   */
  parse() {
    const name = this.prettifyAmmoDescriptorName(this.ndf.name);
    const descriptorName = this.ndf.name;

    const textureId = (this.getValueFromSearch<string>('InterfaceWeaponTexture') || "").replaceAll("\"", '').replaceAll("Texture_Interface_Weapon_", "");

    const traits = NdfManager.extractValuesFromSearchResult<ParserStringLiteral>(this.getFirstSearchResult('TraitsToken')).map((t: ParserStringLiteral) => {
      return t.value.replaceAll("'", '');
    });

    const smokePath = this.getValueFromSearch<string>('SmokeDescriptor');

    let smoke;
    if (smokePath !== 'nil') {
      const smokeDescriptorId = NdfManager.extractLastToken(smokePath);
      const smokeDescriptor = this.mappedSmoke[smokeDescriptorId];
      const smokeManager = new SmokeManager(smokeDescriptor as NdfObject);
      smoke = smokeManager.parse();
    }

    const missilePath = this.getValueFromSearch<string>('MissileDescriptor');

    let missile;
    if (missilePath !== 'nil') {
      const missileDescriptorId = NdfManager.extractLastToken(missilePath);
      const missileDescriptor = this.mappedMissiles[missileDescriptorId];
      const missileManager = new MissileManager(missileDescriptor as NdfObject);
      missile = missileManager.parse();
    }

    const heDamage = Number(Number(this.getValueFromSearch<string>('PhysicalDamages')).toFixed(2));
  
    const heDamageRadius = Math.round(
      NdfManager.parseNumberFromMetre(
        this.getValueFromSearch<string>('RadiusSplashPhysicalDamages')
      )
    );

    const suppress = Number(this.getValueFromSearch<string>('SuppressDamages'));
    const suppressDamagesRadius = Math.round(
      NdfManager.parseNumberFromMetre(
        this.getValueFromSearch<string>('RadiusSplashSuppressDamages')
      )
    );

    const firesLeftToRight =
      this.getValueFromSearch('DispersionWithoutSorting') === 'True';

    const groundMaxRange = this.getRange('PorteeMaximale');
    const groundMinRange = this.getRange('PorteeMinimale');

    const heliMaxRange = this.getRange('PorteeMaximaleTBA');
    const heliMinRange = this.getRange('PorteeMinimaleTBA');

    const planeMaxRange = this.getRange('PorteeMaximaleHA');
    const planeMinRange = this.getRange('PorteeMinimaleHA');

    const aimingTime = Number(this.getValueFromSearch('TempsDeVisee'));
    const reloadTime = Number(this.getValueFromSearch('TempsEntreDeuxSalves'));
    const salvoLength = Number(this.getValueFromSearch('NbTirParSalves'));
    const timeBetweenSalvos = Number(
      this.getValueFromSearch('TempsEntreDeuxTirs')
    );
    const ammunitionPerSalvo = Number(
      this.getValueFromSearch('AffichageMunitionParSalve')
    );

    const rateOfFire = Math.round(
      (ammunitionPerSalvo /
        ((salvoLength - 1) * timeBetweenSalvos + reloadTime)) *
        60
    );

    const trueRateOfFire = Number((Number(salvoLength / ((salvoLength - 1) * timeBetweenSalvos + reloadTime)) * 60).toFixed(2));
    const supplyCostPerSalvo = Number(this.getValueFromSearch('SupplyCost'));

    const baseHitModifiers = this.extractBaseHitModifiers();

    const staticAccuracy = baseHitModifiers.Idling;
    const movingAccuracy = baseHitModifiers.Moving;

    const staticAccuracyOverDistance: AccuracyDataPointsForType =
      this.calculateAccuracyOverDistance(
        staticAccuracy,
        groundMaxRange,
        heliMaxRange,
        planeMaxRange
      );
    const movingAccuracyOverDistance: AccuracyDataPointsForType =
      this.calculateAccuracyOverDistance(
        movingAccuracy,
        groundMaxRange,
        heliMaxRange,
        planeMaxRange
      );

    const distanceToTarget = Boolean(
      this.getFirstSearchResult('EDiceHitModifier/DistanceToTarget')
    );

    const damageDropOffToken = NdfManager.extractLastToken(
      this.getValueFromSearch('DamageTypeEvolutionOverRangeDescriptor')
    );
    const damageDropOff = DROP_OFF[damageDropOffToken];
    const damageResult: ParserObject =
      this.getFirstSearchResult('TDamageTypeRTTI');

    const damageFamily = (
      damageResult?.children?.[0]?.value as ParserStringLiteral
    )?.value;
    const damageIndex = (
      damageResult?.children?.[1]?.value as ParserStringLiteral
    )?.value;
    const piercingWeapon = this.getValueFromSearch('PiercingWeapon') === 'True';

    const isKinetic = piercingWeapon && damageFamily === '"ap"';
    const kineticAP = Math.round(
      Number(damageIndex) - groundMaxRange / damageDropOff
    );

    const heatAP = Number(damageIndex);

    const kineticInstakillAtMaxRangeArmour =
      kineticAP - KINETIC_AP_MAGIC_NUMBER;
    const heatInstakillAtMaxRangeArmour = heatAP - HEAT_AP_MAGIC_NUMBER;

    const penetration = isKinetic ? kineticAP : heatAP;

    const instaKillAtMaxRangeArmour = isKinetic
      ? kineticInstakillAtMaxRangeArmour
      : heatInstakillAtMaxRangeArmour;

    const ammo: Ammo = {
      name,
      descriptorName,
      heDamage,
      heDamageRadius,
      suppress,
      suppressDamagesRadius,
      firesLeftToRight,
      groundMaxRange,
      groundMinRange,
      heliMaxRange,
      heliMinRange,
      planeMaxRange,
      planeMinRange,
      aimingTime,
      reloadTime,
      salvoLength,
      timeBetweenSalvos,
      ammunitionPerSalvo,
      rateOfFire,
      trueRateOfFire,
      supplyCostPerSalvo,
      staticAccuracy,
      movingAccuracy,
      staticAccuracyOverDistance: distanceToTarget ? staticAccuracyOverDistance : undefined,
      movingAccuracyOverDistance: distanceToTarget ? movingAccuracyOverDistance : undefined,
      distanceToTarget,
      damageDropOff,
      damageFamily,
      damageIndex,
      piercingWeapon,
      isKinetic,
      kineticAP,
      heatAP,
      penetration,
      instaKillAtMaxRangeArmour,
      missile,
      smoke,
      traits,
      textureId
    };

    return ammo;
  }

  /**
   *  Calculates the accuracy over distance for a given base accuracy and range
   * @param baseAccuracy  The base accuracy of the weapon
   * @param groundRange   The ground range of the weapon
   * @param heliRange   The helicopter range of the weapon
   * @param planeRange  The plane range of the weapon
   * @returns An object containing the accuracy over distance for each target type
   */
  calculateAccuracyOverDistance(
    baseAccuracy: number,
    groundRange: number | undefined,
    heliRange: number | undefined,
    planeRange: number | undefined
  ): AccuracyDataPointsForType {
    const accuracyOverDistance: AccuracyDataPointsForType = {};

    if (!baseAccuracy) {
      return accuracyOverDistance;
    }

    for (const accuracyModifiers of ACCURACY_BONUS_OVER_RANGE) {
      for (const targetType of ['ground', 'helicopter', 'plane']) {
        const range =
          targetType === 'plane'
            ? planeRange
            : targetType === 'helicopter'
            ? heliRange
            : groundRange;

        if (range) {
          if (
            accuracyOverDistance[
              targetType as keyof AccuracyDataPointsForType
            ] === undefined
          ) {
            accuracyOverDistance[
              targetType as keyof AccuracyDataPointsForType
            ] = [];
          }

          const accuracyAndDistance = this.calculateAccuracyAndDistance(
            baseAccuracy,
            range,
            accuracyModifiers
          );
          accuracyOverDistance[
            targetType as keyof AccuracyDataPointsForType
          ]?.push(accuracyAndDistance);
        }
      }
    }

    return accuracyOverDistance;
  }

  /**
   *  Calculates the accuracy and distance for a given base accuracy, range and multipliers
   * @param baseAccuracy  The base accuracy of the weapon
   * @param baseRange   The base range of the weapon
   * @param multipliers   The multipliers to apply to the base accuracy and range
   * @returns An object containing the accuracy and distance
   */
  calculateAccuracyAndDistance(
    baseAccuracy: number,
    baseRange: number,
    multipliers: {
      accuracyMultiplier: number;
      maxRangeDistanceMultiplier: number;
    }
  ): AccuracyDataPoint {
    const distance = Math.round(
      multipliers.maxRangeDistanceMultiplier * baseRange
    );
    const accuracy = baseAccuracy * (1 + multipliers.accuracyMultiplier / 100);
    return { distance, accuracy };
  }

  /**
   * Extracts the base hit modifiers from the weapon
   * @returns An object containing the base hit modifiers
   */
  extractBaseHitModifiers(): { [key: string]: number } {
    const baseHitValueModifierValues = NdfManager.extractValuesFromSearchResult<
      ParserObject | ParserStringLiteral
    >(this.getFirstSearchResult('BaseHitValueModifiers'));
    const valueModifiers: { [key: string]: number } = {};
    // This array is split up weird. Index "n + 1" has the name of the value I'm looking to extract and index "n+2" has the value.
    // Hence why I'm going to every 3rd index, as I want to access both values in an iteration;
    // ** izohek:
    // ** ndf-parser >= 1.2.0 simplified this array and removes one of the values we're skipping here (now only n and n+1).
    // ** previous versions would split the name space and name as separate array values (EBaseHitValueModifier & Base)
    // ** but in versions 1.2.0 and forward these values are combined into a single entity0: "EBaseHitValueModifier/Base"
    // ** we now split on '/' and remove the EBaseHitValueModifier prefix to match existing logic
    for (let i = 0; i < baseHitValueModifierValues.length; i += 2) {
      const baseHitValueModifierAttribute = baseHitValueModifierValues[i];
      const baseHitValueModifierValue = baseHitValueModifierValues[i + 1];
      if (
        !isParserStringLiteral(baseHitValueModifierAttribute) &&
        isParserStringLiteral(baseHitValueModifierValue)
      ) {
        const modifierName = baseHitValueModifierAttribute.name.split('/')[1];
        const modifierValue = Number(baseHitValueModifierValue.value);
        valueModifiers[modifierName] = modifierValue;
      }
    }

    return valueModifiers;
  }

  /**
   * Extracts the range of the weapon
   * @param rangeAttribute  The attribute to search for
   * @returns The range of the weapon
   */
  getRange(rangeAttribute: string): number {
    const searchResult = this.getFirstSearchResult(rangeAttribute);
    if (searchResult) {
      return Math.round(
        Number(
          NdfManager.parseNumberFromMetre(
            NdfManager.extractValueFromSearchResult(searchResult)
          )
        )
      );
    }

    return 0;
  }

  /**
   *  Extracts the ammunition descriptor from the weapon
   * @param descriptor  The descriptor to search for
   * @returns The ammunition descriptor of the weapon
   */
  prettifyAmmoDescriptorName(descriptor: string): string {
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
}
