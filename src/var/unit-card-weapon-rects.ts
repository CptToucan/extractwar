import { Rectangle } from "tesseract.js";

export const weaponBarRect: Rectangle = {
  left: 0,
  top: 348,
  width: 880,
  height: 1,
};


/**
 * The below stats are all for weapons. They are relative to the top left pixel of each weapon column. This allows the code to programmatically
 * calculate the position of each rectangle by adding th top and left to the rect.
 */

export const nameRect: Rectangle = {
  left: 0,
  top: 185,
  width: 280,
  height: 30
}

export const ammunitionRect: Rectangle = {
  left: 0,
  top: 215,
  width: 280,
  height: 25
}

export const typeRect: Rectangle = {
  left: 0,
  top: 0,
  width: 280,
  height: 52
}

const smallStatLeft = 192;
const smallStatWidth = 91;
const smallStatHeight = 34


export const penetrationRect: Rectangle = {
  left: smallStatLeft,
  top: 301,
  width: smallStatWidth,
  height: 58
};

export const heRect: Rectangle = {
  left: smallStatLeft,
  top: 359,
  width: smallStatWidth,
  height: smallStatHeight
};

export const suppressRect: Rectangle = {
  left: smallStatLeft,
  top: 393,
  width: smallStatWidth,
  height: smallStatHeight
};

export const groundRangeRect: Rectangle = {
  left: 149,
  top: 478,
  width: 140,
  height: 31,
};

export const helicopterRangeRect: Rectangle = {
  left: 149,
  top: 513,
  width: 140,
  height: 31,
};

export const aircraftRangeRect: Rectangle = {
  left: 149,
  top: 545,
  width: 140,
  height: 31,
};

export const staticAccuracyRect: Rectangle = {
  left: smallStatLeft,
  top: 628,
  width: smallStatWidth,
  height: smallStatHeight
};

export const motionAccuracyRect: Rectangle = {
  left: smallStatLeft,
  top: 668,
  width: smallStatWidth,
  height: smallStatHeight
};

export const rateOfFireRect: Rectangle = {
  left: smallStatLeft,
  top: 745,
  width: smallStatWidth,
  height: smallStatHeight
};

export const aimingTimeRect: Rectangle = {
  left: smallStatLeft,
  top: 781,
  width: smallStatWidth,
  height: smallStatHeight
};

export const reloadTimeRect: Rectangle = {
  left: smallStatLeft,
  top: 815,
  width: smallStatWidth,
  height: smallStatHeight
};

export const salvoLengthRect: Rectangle = {
  left: smallStatLeft,
  top: 850,
  width: smallStatWidth,
  height: smallStatHeight
};

export const supplyCostRect: Rectangle = {
  left: smallStatLeft,
  top: 927,
  width: smallStatWidth,
  height: smallStatHeight
};

export const weapon1Pos = {
  left: 1,
  top: 350,
};

export const weapon2Pos = {
  left: 299,
  top: 350,
};

export const weapon3Pos = {
  left: 595,
  top: 350,
};

export const weaponPos = [weapon1Pos, weapon2Pos, weapon3Pos];