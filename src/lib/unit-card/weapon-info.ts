export class WeaponInfo {
  // Basic Information
  name: string;
  ammunition: string;

  // Damage types
  penetration: number;
  he: number;
  suppress: number;


  // Target Ranges  
  groundRange: number;
  helicopterRange: number;
  aircraftRange: number;

  // Accuracy
  staticAccuracy: number;
  motionAccuracy: number;

  // Shooting Attributes
  rateOfFire: number;
  aimingTime: number;
  reloadTime: number;
  salvoLength: number;

  supplyCost: number;

}