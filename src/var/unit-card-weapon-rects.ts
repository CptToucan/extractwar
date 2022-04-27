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
  width: 289,
  height: 30
}

export const ammunitionRect: Rectangle = {
  left: 0,
  top: 215,
  width: 289,
  height: 25
}

export const typeRect: Rectangle = {
  left: 0,
  top: 0,
  width: 289,
  height: 52
}

const smallStatLeft = 192;
const smallStatWidth = 97;
const smallStatHeight = 34


export const penetrationRect: Rectangle = {
  left: smallStatLeft,
  top: 286,
  width: smallStatWidth,
  height: 58
};

export const heRect: Rectangle = {
  left: smallStatLeft,
  top: 344,
  width: smallStatWidth,
  height: smallStatHeight
};

export const suppressRect: Rectangle = {
  left: smallStatLeft,
  top: 378,
  width: smallStatWidth,
  height: smallStatHeight
};

export const groundRangeRect: Rectangle = {
  left: 149,
  top: 484,
  width: 140,
  height: 31,
};

export const helicopterRangeRect: Rectangle = {
  left: 149,
  top: 519,
  width: 140,
  height: 31,
};

export const aircraftRangeRect: Rectangle = {
  left: 149,
  top: 551,
  width: 140,
  height: 31,
};

export const staticAccuracyRect: Rectangle = {
  left: smallStatLeft,
  top: 653,
  width: smallStatWidth,
  height: smallStatHeight
};

export const motionAccuracyRect: Rectangle = {
  left: smallStatLeft,
  top: 687,
  width: smallStatWidth,
  height: smallStatHeight
};

export const rateOfFireRect: Rectangle = {
  left: smallStatLeft,
  top: 789,
  width: smallStatWidth,
  height: smallStatHeight
};

export const aimingTimeRect: Rectangle = {
  left: smallStatLeft,
  top: 823,
  width: smallStatWidth,
  height: smallStatHeight
};

export const reloadTimeRect: Rectangle = {
  left: smallStatLeft,
  top: 857,
  width: smallStatWidth,
  height: smallStatHeight
};

export const salvoLengthRect: Rectangle = {
  left: smallStatLeft,
  top: 891,
  width: smallStatWidth,
  height: smallStatHeight
};

export const supplyCostRect: Rectangle = {
  left: smallStatLeft,
  top: 989,
  width: smallStatWidth,
  height: smallStatHeight
};

export const weapon1Pos = {
  left: 1,
  top: 350,
};

export const weapon2Pos = {
  left: 293,
  top: 350,
};

export const weapon3Pos = {
  left: 587,
  top: 350,
};

export const weaponPos = [weapon1Pos, weapon2Pos, weapon3Pos];