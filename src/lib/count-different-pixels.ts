const PNG = require('pngjs').PNG;
const fs = require('fs');
const pixelmatch = require('pixelmatch');

export function countDifferentPixels(
  file1Path: string,
  file2Path: string
): number {
  const img1 = PNG.sync.read(fs.readFileSync(file1Path));
  const img2 = PNG.sync.read(fs.readFileSync(file2Path));
  const { width, height, data } = img1;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(data, img2.data, diff.data, width, height, {
    threshold: 0,
  });

  return diffPixels;
}
