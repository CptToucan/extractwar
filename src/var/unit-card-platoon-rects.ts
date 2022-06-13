import { Rectangle } from "tesseract.js";

/**
 * These dimensions are all relative to an extracted "platoon section" of a unit card
 * They are not comparable rects to "unit-card-rects.ts". 
 * The rects in this file need an additional position to be able to extract information from the parsed unit card
 */

export const maxDmgRect: Rectangle = {
  left: 118,
  top: 0,
  width: 172,
  height: 38,
};

export const opticsRect: Rectangle = {
  left: 84,
  top: 0,
  width: 208,
  height: 38,
};

export const stealthRect: Rectangle = {
  left: 104,
  top: 0,
  width: 186,
  height: 38,
};

export const speedRect: Rectangle = {
  left: 87,
  top: 0,
  width: 205,
  height: 38,
};

export const roadSpeedRect: Rectangle = {
  left: 144,
  top: 0,
  width: 148,
  height: 38,
};

export const autonomyRect: Rectangle = {
  left: 130,
  top: 0,
  width: 159,
  height: 36,
};

export const fuelRect: Rectangle = {
  left: 64,
  top: 0,
  width: 228,
  height: 36,
};

export const revealInfluenceRect: Rectangle = {
  left: 198,
  top: 0,
  width: 92,
  height: 36,
};

export const strengthRect: Rectangle = {
  left: 120,
  top: 0,
  width: 170,
  height: 38,
};

export const airOpticsRect: Rectangle = {
  left: 124,
  top: 0,
  width: 168,
  height: 38,
};

export const ecmRect: Rectangle = {
  left: 66,
  top: 0,
  width: 226,
  height: 38,
};

export const agilityRect: Rectangle = {
  left: 89,
  top: 0,
  width: 200,
  height: 38,
};

export const trajectoryRect: Rectangle = {
  left: 140,
  top: 0,
  width: 152,
  height: 38,
};

export const transportRect: Rectangle = {
  left: 128,
  top: 0,
  width: 162,
  height: 38,
};

export const supplyRect: Rectangle = {
  left: 91,
  top: 0,
  width: 198,
  height: 38,
};

export const weaponBarRectRect: Rectangle = {
  left: 0,
  top: 348,
  width: 880,
  height: 1,
};

// These map out 3 top positions and 3 left positions which make it possible to calculate positions for all platoon stats
export const platoonRow1Top = 1440;
export const platoonRow2Top = 1480;
export const platoonRow3Top = 1520;
export const platoonColumn1Left = 1;
export const platoonColumn2Left = 293;
export const platoonColumn3Left = 587;