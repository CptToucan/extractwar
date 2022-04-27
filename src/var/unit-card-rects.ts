import { Rectangle } from "tesseract.js";

/**
 * These dimensions are all relative to the extracted unit card, and not the screenshot
 */


 /**
  * Top section properties
  */
 
export const nameRect: Rectangle = {
  top: 0,
  left: 177,
  width: 644,
  height: 63,
};

export const qualityRect: Rectangle = {
  left: 598,
  top: 106,
  width: 272,
  height: 43,
};

export const commandPointsRect: Rectangle = {
  left: 91,
  top: 13,
  width: 70,
  height: 31
}


/**
 * Armour properties
 */

const armorTopPos = 229;
const armorHeight = 49;
const armorWidth = 88;


export const frontArmorRect: Rectangle = {
  left: 129,
  top: armorTopPos,
  width: armorWidth,
  height: armorHeight,
};

export const sideArmorRect: Rectangle = {
  left: 349,
  top: armorTopPos,
  width: armorWidth,
  height: armorHeight,
};

export const rearArmorRect: Rectangle = {
  left: 569,
  top: armorTopPos,
  width: armorWidth,
  height: armorHeight,
};

export const topArmorRect: Rectangle = {
  left: 789,
  top: armorTopPos,
  width: armorWidth,
  height: armorHeight,
};

/**
 * Weapon name properties
 */

const weaponNameTopPos = 350;
const weaponNameWidth = 290;
const weaponNameHeight = 52;

export const weapon1Rect: Rectangle = {
  left: 5,
  top: weaponNameTopPos,
  width: weaponNameWidth,
  height: weaponNameHeight,
};

export const weapon2Rect: Rectangle = {
  left: 293,
  top: weaponNameTopPos,
  width: weaponNameWidth,
  height: weaponNameHeight,
};

export const weapon3Rect: Rectangle = {
  left: 587,
  top: weaponNameTopPos,
  width: weaponNameWidth,
  height: weaponNameHeight,
};
