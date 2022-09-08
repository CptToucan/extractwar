import { Transform } from './transform';
import { NameTransform } from './static/name';
import { QualityTransform } from './static/quality';
import { ArmorTransform } from './static/armor';

import { NameTransform as WeaponNameTransform } from './weapon/name';
import { TypeTransform } from './weapon/type';
import { AmmunitionTransform } from './weapon/ammunition';
import { DamageTransform } from './weapon/damage';
import { TargetRangeTransform } from './weapon/target-ranges';
import { AccuracyTransform } from './weapon/accuracy';
import { RateOfFireTransform } from './weapon/rate-of-fire';
import { TimeTransform } from './weapon/time';
import { SalvoLengthTransform } from './weapon/salvo-length';
import { SupplyCostTransform } from './weapon/supply-cost';
import { AgilityTransform } from './platoon/agility';
import { AirOpticsTransform } from './platoon/air-optics';
import { AutonomyTransform } from './platoon/autonomy';
import { EcmTransform } from './platoon/ecm';
import { FuelTransform } from './platoon/fuel';
import { MaxDmgTransform } from './platoon/max-dmg';
import { OpticsTransform } from './platoon/optics';
import { RevealInfluenceTransform } from './platoon/reveal-influence';
import { RoadSpeedTransform } from './platoon/road-speed';
import { SpeedTransform } from './platoon/speed';
import { StealthTransform } from './platoon/stealth';
import { StrengthTransform } from './platoon/strength';
import { SupplyTransform } from './platoon/supply';
import { TransportTransform } from './platoon/transport';
import { TrajectoryTransform } from './platoon/trajectory';

import {
  nameRect,
  commandPointsRect,
  qualityRect,
  frontArmorRect,
  sideArmorRect,
  rearArmorRect,
  topArmorRect,
} from '../../var/unit-card-rects';

import {
  nameRect as weaponNameRect,
  typeRect,
  ammunitionRect,
  penetrationRect,
  heRect,
  suppressRect,
  groundRangeRect,
  helicopterRangeRect,
  aircraftRangeRect,
  staticAccuracyRect,
  motionAccuracyRect,
  rateOfFireRect,
  aimingTimeRect,
  reloadTimeRect,
  salvoLengthRect,
  supplyCostRect,
  weapon1Pos,
  weapon2Pos,
  weapon3Pos,
} from '../../var/unit-card-weapon-rects';

import {
  agilityRect,
  airOpticsRect,
  autonomyRect,
  ecmRect,
  fuelRect,
  maxDmgRect,
  opticsRect,
  revealInfluenceRect,
  roadSpeedRect,
  speedRect,
  stealthRect,
  strengthRect,
  supplyRect,
  trajectoryRect,
  transportRect,
  platoonRow1Top,
  platoonRow2Top,
  platoonRow3Top,
  platoonRow4Top,
  platoonColumn1Left,
  platoonColumn2Left,
  platoonColumn3Left,
} from '../../var/unit-card-platoon-rects';
import { UnitTypeTransform } from './static/unit-type';
import { CommandPointsTransform } from './static/command-points';

export { Transform };

export const staticTransforms: Transform[] = [
  new NameTransform(nameRect),
  new CommandPointsTransform(commandPointsRect),
  new QualityTransform(qualityRect),
  new ArmorTransform('frontArmor', frontArmorRect),
  new ArmorTransform('sideArmor', sideArmorRect),
  new ArmorTransform('rearArmor', rearArmorRect),
  new ArmorTransform('topArmor', topArmorRect),
];

const weaponTransforms = [];
const weaponPositions = [weapon1Pos, weapon2Pos, weapon3Pos];

for (const [index, element] of weaponPositions.entries()) {
  const weaponPos = element;

  weaponTransforms.push([
    new WeaponNameTransform(weaponNameRect, weaponPos),
    new AmmunitionTransform(ammunitionRect, weaponPos),
    new TypeTransform(typeRect, weaponPos),
    new DamageTransform('penetration', penetrationRect, weaponPos),
    new DamageTransform('he', heRect, weaponPos),
    new DamageTransform('suppress', suppressRect, weaponPos),
    new TargetRangeTransform('ground', groundRangeRect, weaponPos),
    new TargetRangeTransform('helicopter', helicopterRangeRect, weaponPos),
    new TargetRangeTransform('aircraft', aircraftRangeRect, weaponPos),
    new AccuracyTransform('static', staticAccuracyRect, weaponPos),
    new AccuracyTransform('motion', motionAccuracyRect, weaponPos),
    new RateOfFireTransform(rateOfFireRect, weaponPos),
    new TimeTransform('aiming', aimingTimeRect, weaponPos),
    new TimeTransform('reload', reloadTimeRect, weaponPos),
    new SalvoLengthTransform(salvoLengthRect, weaponPos),
    new SupplyCostTransform(supplyCostRect, weaponPos),
  ]);
}

export type namedWeaponTransforms = {
  name: string,
  transforms: Transform[]

}

const weaponOneTransforms: namedWeaponTransforms = {
  name: 'weaponOne',
  transforms: weaponTransforms[0],
};
const weaponTwoTranforms: namedWeaponTransforms = {
  name: 'weaponTwo',
  transforms: weaponTransforms[1],
};
const weaponThreeTransforms: namedWeaponTransforms = {
  name: 'weaponThree',
  transforms: weaponTransforms[2],
};

export { weaponOneTransforms, weaponTwoTranforms, weaponThreeTransforms };

export const oneWeaponLayout = [weaponOneTransforms];
export const twoWeaponLayout = [weaponOneTransforms, weaponTwoTranforms];
export const threeWeaponLayout = [
  weaponOneTransforms,
  weaponTwoTranforms,
  weaponThreeTransforms,
];

const platoonPositions = [
  { left: platoonColumn1Left, top: platoonRow1Top },
  { left: platoonColumn2Left, top: platoonRow1Top },
  { left: platoonColumn3Left, top: platoonRow1Top },
  { left: platoonColumn1Left, top: platoonRow2Top },
  { left: platoonColumn2Left, top: platoonRow2Top },
  { left: platoonColumn3Left, top: platoonRow2Top },
  { left: platoonColumn1Left, top: platoonRow3Top },
  { left: platoonColumn2Left, top: platoonRow3Top },
  { left: platoonColumn3Left, top: platoonRow3Top },
  { left: platoonColumn1Left, top: platoonRow4Top },
  { left: platoonColumn2Left, top: platoonRow4Top },
  { left: platoonColumn3Left, top: platoonRow4Top },
];

export const infantryLayout = [
  new StrengthTransform(strengthRect, platoonPositions[0]),
  new OpticsTransform(opticsRect, platoonPositions[1]),
  new StealthTransform(stealthRect, platoonPositions[2]),
  new RevealInfluenceTransform(revealInfluenceRect, platoonPositions[3]),
  new SpeedTransform(speedRect, platoonPositions[4])
];

export const aircraftLayout = [
  new MaxDmgTransform(maxDmgRect, platoonPositions[0]),
  new AirOpticsTransform(airOpticsRect, platoonPositions[1]),
  new EcmTransform(ecmRect, platoonPositions[2]),
  new AgilityTransform(agilityRect, platoonPositions[3]),
  new TrajectoryTransform(trajectoryRect, platoonPositions[4]),
  new SpeedTransform(speedRect, platoonPositions[5]),
  new AutonomyTransform(autonomyRect, platoonPositions[6]),
  new FuelTransform(fuelRect, platoonPositions[7]),
  new RevealInfluenceTransform(revealInfluenceRect, platoonPositions[8])
]

export const vehicleLayout = [
  new MaxDmgTransform(maxDmgRect, platoonPositions[0]),
  new OpticsTransform(opticsRect, platoonPositions[1]),
  new StealthTransform(stealthRect, platoonPositions[2]),
  // Index jumps from 2 to 4 as there is a gap in index 3 in this layout
  new SpeedTransform(speedRect, platoonPositions[4]),
  new RoadSpeedTransform(roadSpeedRect, platoonPositions[5]),
  new AutonomyTransform(autonomyRect, platoonPositions[6]),
  new FuelTransform(fuelRect, platoonPositions[7]),
  new RevealInfluenceTransform(revealInfluenceRect, platoonPositions[8]),
];

export const transportLayout = [
  new MaxDmgTransform(maxDmgRect, platoonPositions[0]),
  new OpticsTransform(opticsRect, platoonPositions[1]),
  new StealthTransform(stealthRect, platoonPositions[2]),
  new SpeedTransform(speedRect, platoonPositions[4]),
  new RoadSpeedTransform(roadSpeedRect, platoonPositions[5]),
  new AutonomyTransform(autonomyRect, platoonPositions[6]),
  new FuelTransform(fuelRect, platoonPositions[7]),
  new RevealInfluenceTransform(revealInfluenceRect, platoonPositions[8]),
  new TransportTransform(transportRect, platoonPositions[9]),
];

export const supplyLayout = [
  new MaxDmgTransform(maxDmgRect, platoonPositions[0]),
  new OpticsTransform(opticsRect, platoonPositions[1]),
  new StealthTransform(stealthRect, platoonPositions[2]),
  new SpeedTransform(speedRect, platoonPositions[4]),
  new RoadSpeedTransform(roadSpeedRect, platoonPositions[5]),
  new RevealInfluenceTransform(revealInfluenceRect, platoonPositions[6]),
  new SupplyTransform(supplyRect, platoonPositions[7]),
];
