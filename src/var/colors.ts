export interface rgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const redToReplace = {
  r: 172,
  g: 0,
  b: 0,
  a: 255,
};

const cyanToReplace = {
  r: 67,
  g: 255,
  b: 255,
  a: 255,
};

const orangeToReplace = {
  r: 255,
  g: 190,
  b: 0,
  a: 255,
};

const extraOrangeToReplace = {
  r: 163,
  g: 142,
  b: 95,
  a: 255,
};

const greenToReplace = {
  r: 127,
  g: 255,
  b: 117,
  a: 255,
};

const whiteToReplace = {
  r: 223,
  g: 214,
  b: 200,
  a: 255,
};

const backgroundToReplace = {
  r: 142,
  g: 129,
  b: 105,
  a: 255,
};

const background2ToReplace = {
  r: 110,
  g: 101,
  b: 78,
  a: 255,
};

const background3ToReplace = {
  r: 87,
  g: 79,
  b: 61,
  a: 255,
};

const extraRedToReplace = {
  r: 153,
  g: 84,
  b: 68,
  a: 255,
};

export const colorsToReplace: rgbaColor[] = [
  redToReplace,
  cyanToReplace,
  orangeToReplace,
  greenToReplace,
  whiteToReplace,
];

export const backgroundsToReplace: rgbaColor[] = [
  backgroundToReplace,
  background2ToReplace,
  background3ToReplace,
];

export const extrasToReplace: rgbaColor[] = [extraRedToReplace /*, extraOrangeToReplace*/];