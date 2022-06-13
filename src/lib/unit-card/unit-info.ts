const fs = require('fs');
const sharp = require('sharp');
const os = require('os');
const path = require('path');

import { countDifferentPixels } from '../count-different-pixels';
import { isColorWithinThreshold } from '../is-color-within-threshold';
import { Rectangle } from 'tesseract.js';
import { removeLinebreaks } from '../remove-linebreaks';
import {
  colorsToReplace,
  backgroundsToReplace,
  extrasToReplace,
} from '../../var/colors';
import {
  staticTransforms,
  oneWeaponLayout,
  twoWeaponLayout,
  threeWeaponLayout,
  infantryLayout,
  aircraftLayout,
  vehicleLayout,
  transportLayout,
  supplyLayout,
  namedWeaponTransforms,
} from '../../lib/transforms';
import { Transform } from '../transforms/transform';
import { string } from '@oclif/core/lib/parser/flags';

const weaponBarRect: Rectangle = {
  left: 0,
  top: 348,
  width: 880,
  height: 1,
};

type allWeaponInformation = { [key: string]: singleWeaponInformation };

type singleWeaponInformation = {
  [key: string]: string;
};

const BACKGROUND_REPLACE_THRESHOLD = 20;
const COLOR_REPLACE_THRESHOLD = 80;
const EXTRA_REPLACE_THRESHOLD = 10;

export class UnitInfo {
  tempFolderPath?: string | null;
  complete: Promise<any>;
  filePath: string;
  tesseractWorker: Tesseract.Worker;

  constructor(filePath: string, tesseractWorker: Tesseract.Worker) {
    this.filePath = filePath;
    this.tesseractWorker = tesseractWorker;
    this.complete = new Promise(this.initialise.bind(this));
  }

  async initialise(resolve: any, reject: any): Promise<any> {
    try {
      const splitFilePath: string[] = this.filePath.split(path.sep);
      const fileName: string = splitFilePath[splitFilePath.length - 1];
      const tempFolderPath: string = path.join(
        os.tmpdir(),
        'extractwar',
        fileName
      );

      fs.rmSync(tempFolderPath, { recursive: true, force: true });
      fs.mkdirSync(tempFolderPath, { recursive: true });
      this.tempFolderPath = tempFolderPath;

      // Determine how many weapons it has
      const weaponCount: number = await this.determineWeaponCount(
        this.filePath
      );
      // Determine which platoon layout (unit type) it is
      const platoonType: string | null = await this.determinePlatoonType(
        this.filePath
      );

      if (platoonType === null) {
        throw new Error(
          `Could not determine platoon type for image: ${this.filePath}`
        );
      }

      // Convert it into machine readable image
      const extractionImagePath: string = await this.createExtractionImage(
        this.filePath
      );

      // Extract static information
      const extractedStaticInformation = await this.extractStaticInformation(
        extractionImagePath
      );

      // Extract weapon information
      const extractedWeaponsInformation = await this.extractWeaponsInformation(
        extractionImagePath,
        weaponCount
      );

      // Extract platoon information
      const extractedPlatoonInformation = await this.extractPlatoonInformation(
        extractionImagePath,
        platoonType
      );

      // Clean up
      this.tempFolderPath = null;
      fs.rmSync(tempFolderPath, { recursive: true, force: true });
      await resolve({
        staticInformation: extractedStaticInformation,
        weaponsInformation: extractedWeaponsInformation,
        platoonInformation: extractedPlatoonInformation,
      });
    } catch (error) {
      console.error(error);
      reject();
    }
  }

  async extractPlatoonInformation(filePath: string, platoonType: string) {
    const platoonInformation: { [key: string]: string } = {};

    const layouts: { [key: string]: Transform[] } = {
      infantry: infantryLayout,
      vehicle: vehicleLayout,
      aircraft: aircraftLayout,
      transport: transportLayout,
      supply: supplyLayout,
    };

    const layout = layouts[platoonType];

    for (const transform of layout) {
      const extractedText = await this.extractTextFromRect(
        this.tesseractWorker,
        filePath,
        transform
      );
      platoonInformation[transform.name] = extractedText;
    }

    return platoonInformation;
  }

  async extractWeaponsInformation(
    filePath: string,
    weaponCount: number
  ): Promise<allWeaponInformation> {
    const layouts: { [key: number]: namedWeaponTransforms[] } = {
      0: [],
      1: oneWeaponLayout,
      2: twoWeaponLayout,
      3: threeWeaponLayout,
    };

    const allWeaponsInformation: allWeaponInformation = {};
    const layout = layouts[weaponCount];
    for (const weaponLayout of layout) {
      const weaponInformation: singleWeaponInformation = {};

      for (const transform of weaponLayout.transforms) {
        const extractedText = await this.extractTextFromRect(
          this.tesseractWorker,
          filePath,
          transform
        );
        weaponInformation[transform.name] = extractedText;
      }

      allWeaponsInformation[weaponLayout.name] = weaponInformation;
    }

    return allWeaponsInformation;
  }

  async extractStaticInformation(filePath: string) {
    const staticInformation: any = {};
    for (const transform of staticTransforms) {
      const extractedText = await this.extractTextFromRect(
        this.tesseractWorker,
        filePath,
        transform
      );
      staticInformation[transform.name] = extractedText;
    }

    return staticInformation;
  }

  async extractTextFromRect(
    worker: Tesseract.Worker,
    filePath: string,
    transform: Transform
  ): Promise<string> {

    // eslint-disable-next-line camelcase
    const {
      data: { text },
    } = await worker.recognize(filePath, {
      rectangle: transform.rectangle,
    });
    const removedLinebreaksText = removeLinebreaks(text);
    const transformedText = transform.deserialize(removedLinebreaksText);
    return transformedText;
  }

  async createExtractionImage(filePath: string): Promise<string> {
    const rawImage = await sharp(filePath).raw().toBuffer({
      resolveWithObject: true,
    });

    const pixelBuffer: Uint8ClampedArray = new Uint8ClampedArray(
      rawImage.data.buffer
    );
    const { width, height, channels } = rawImage.info;

    const white = {
      r: 255,
      g: 255,
      b: 255,
    };

    const black = {
      r: 0,
      g: 0,
      b: 0,
    };

    for (let i = 0; i < pixelBuffer.length; i += 3) {
      const r = pixelBuffer[i + 0];
      const g = pixelBuffer[i + 1];
      const b = pixelBuffer[i + 2];
      const a = 255;

      for (const backgroundToReplace of backgroundsToReplace) {
        if (
          isColorWithinThreshold(
            { r, g, b, a },
            backgroundToReplace,
            BACKGROUND_REPLACE_THRESHOLD
          )
        ) {
          pixelBuffer[i + 0] = white.r;
          pixelBuffer[i + 1] = white.g;
          pixelBuffer[i + 2] = white.b;
          break;
        }
      }

      for (const colorToReplace of colorsToReplace) {
        if (
          isColorWithinThreshold(
            { r, g, b, a },
            colorToReplace,
            COLOR_REPLACE_THRESHOLD
          )
        ) {
          pixelBuffer[i + 0] = black.r;
          pixelBuffer[i + 1] = black.g;
          pixelBuffer[i + 2] = black.b;
          break;
        }
      }

      for (const extraToReplace of extrasToReplace) {
        if (
          isColorWithinThreshold(
            { r, g, b, a },
            extraToReplace,
            EXTRA_REPLACE_THRESHOLD
          )
        ) {
          pixelBuffer[i + 0] = black.r;
          pixelBuffer[i + 1] = black.g;
          pixelBuffer[i + 2] = black.b;
          break;
        }
      }
    }
    
    const sanitisedExtractionImage = path.join(
      this.tempFolderPath,
      'sanitised-extraction-image.png'
    );

    await sharp(pixelBuffer, { raw: { width, height, channels } }).toFile(
      sanitisedExtractionImage
    );
    return sanitisedExtractionImage;
  }

  async determineWeaponCount(filePath: string): Promise<number> {
    let weaponCount: number = 0;

    const compareRoot: string = path.join(__dirname, '..', '..', 'images');
    const weaponBarPath: string = path.join(compareRoot, 'weapon-bar.png');
    const extractedWeaponbarPath: string = path.join(
      this.tempFolderPath,
      'weapon-bar-extract.png'
    );

    const sharpOutput = await sharp(filePath)
      .extract(weaponBarRect)
      .toFile(extractedWeaponbarPath);

    // Compare weaponBar image against same position on file passed in
    const diffPixels = countDifferentPixels(
      weaponBarPath,
      extractedWeaponbarPath
    );

    const { width } = sharpOutput;

    const pixelDiffRatio = diffPixels / width;

    // If all pixels are the same this means there are 3 weapons
    if (pixelDiffRatio === 0) {
      weaponCount = 3;
    }

    // if between 0.3 and 0.4 (likely to be 0.333) this means that only 1 weapon is missing - so 2 weapons present
    if (pixelDiffRatio > 0.3 && pixelDiffRatio < 0.4) {
      weaponCount = 2;
    }

    // if between 0.3 and 0.4 (likely to be 0.666) this means that 2 weapons are missing - so 1 weapons present
    if (pixelDiffRatio > 0.6 && pixelDiffRatio < 0.7) {
      weaponCount = 1;
    }

    // all other scenarios assume 0, as they may be future cards that do not fit this pattern.

    // Use number of pixel different to determine number of weapons. This should be compared against a percentage width of the image.
    return weaponCount;
  }

  async determinePlatoonType(filePath: string): Promise<string | null> {
    const defaultRect: Rectangle = {
      left: 0,
      top: 1438,
      width: 120,
      height: 120,
    };

    const infantryRect: Rectangle = {
      left: defaultRect.left,
      top: defaultRect.top,
      width: defaultRect.width,
      height: 80,
    };

    const compareRoot: string = path.join(__dirname, '..', '..', 'images');
    const extractedPlatoonImage = path.join(
      this.tempFolderPath,
      'platoon-extract.png'
    );
    // Extract default check image
    await sharp(filePath).extract(defaultRect).toFile(extractedPlatoonImage);

    // Compare default check image against vehicle, aircraft, transport supply
    let unitType: string | null = null;

    for (const type of ['vehicle', 'aircraft', 'transport', 'supply']) {
      const comparePath: string = path.join(compareRoot, `${type}.png`);
      const diffPixels: number = countDifferentPixels(
        comparePath,
        extractedPlatoonImage
      );

      if (diffPixels === 0) {
        unitType = type;
        break;
      }
    }

    // Extract infantry check image
    await sharp(filePath).extract(infantryRect).toFile(extractedPlatoonImage);

    // Compare infantry check image against infantry
    for (const type of ['infantry']) {
      const comparePath = path.join(compareRoot, `${type}.png`);
      const diffPixels = countDifferentPixels(
        comparePath,
        extractedPlatoonImage
      );
      if (diffPixels === 0) {
        unitType = type;
        break;
      }
    }

    return unitType;
  }
}
