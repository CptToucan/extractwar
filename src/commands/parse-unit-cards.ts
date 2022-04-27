import { Command, Flags } from '@oclif/core';
import { humanize } from '../lib/humanize';
import { createWorker } from 'tesseract.js';
import { UnitInfo } from '../lib/unit-card/unit-info';

import {
  staticTransforms,
  threeWeaponLayout,
  infantryLayout,
  aircraftLayout,
  vehicleLayout,
  transportLayout,
  supplyLayout,
} from '../lib/transforms';
import ux from 'cli-ux';

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const WARNO_MAX_WEAPONS = 3;

type csvHeader = {
  id: string;
  title: string;
};

export default class ParseUnitCards extends Command {
  static description = 'describe the command here';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = [
    { name: 'unitCardInputFolder', required: true },
    { name: 'outputCsv', required: true },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ParseUnitCards);

    this.log('Extracting unit cards');

    const csvHeaders: csvHeader[] = generateCsvHeaderNames();
    const csvWriter = createCsvWriter({
      path: args.outputCsv,
      header: csvHeaders,
    });
    const filesInInputDirectory = fs.readdirSync(args.unitCardInputFolder);

    let unitIndex = 1;
    for (const filePath of filesInInputDirectory) {
      ux.action.start(`Extracting ${filePath}`);
      const fullFilePath = `${args.unitCardInputFolder}/${filePath}`;
      const worker = await startTesseract();
      const unitCardInfo = new UnitInfo(fullFilePath, worker);
      const extractedUnitCardInfo = await unitCardInfo.complete;
      await stopTesseract(worker);

      const allUnitStats = {
        ...extractedUnitCardInfo.staticInformation,
        ...extractedUnitCardInfo.platoonInformation,
      };

      if (extractedUnitCardInfo.weaponsInformation) {
        for (const weaponName in extractedUnitCardInfo.weaponsInformation) {
          if (
            Object.prototype.hasOwnProperty.call(
              extractedUnitCardInfo.weaponsInformation,
              weaponName
            )
          ) {
            const weaponAttributes =
              extractedUnitCardInfo.weaponsInformation[weaponName];
            for (const attribute in weaponAttributes) {
              if (
                Object.prototype.hasOwnProperty.call(
                  weaponAttributes,
                  attribute
                )
              ) {
                allUnitStats[createUniqueWeaponName(weaponName, attribute)] =
                  weaponAttributes[attribute];
              }
            }
          }
        }
      }

      await csvWriter.writeRecords([allUnitStats]);
      ux.action.stop(`Extracted ${unitIndex} / ${filesInInputDirectory.length} | ${allUnitStats.name}`);
      unitIndex++;
    }

    this.log(`Finished extracting information from unit cards to csv`)
  }
}

async function startTesseract(): Promise<Tesseract.Worker> {
  const worker = await createWorker({});
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  await worker.setParameters({
    // eslint-disable-next-line camelcase
    user_defined_dpi: '70',
  });

  return worker;
}

async function stopTesseract(worker: Tesseract.Worker): Promise<void> {
  await worker.terminate();
}

function generateCsvHeaderNames(): csvHeader[] {
  const csvHeaderIds: string[] = [];
  for (const transform of staticTransforms) {
    csvHeaderIds.push(transform.name);
  }

  for (const layout of threeWeaponLayout) {
    for (const transform of layout.transforms) {
      csvHeaderIds.push(createUniqueWeaponName(layout.name, transform.name));
    }
  }

  const platoonKeys: Set<string> = new Set();
  for (const platoonLayout of [
    infantryLayout,
    aircraftLayout,
    vehicleLayout,
    transportLayout,
    supplyLayout,
  ]) {
    for (const transform of platoonLayout) {
      platoonKeys.add(transform.name);
    }
  }

  csvHeaderIds.push(...platoonKeys);

  const csvHeaders: csvHeader[] = csvHeaderIds.map((el) => {
    return {
      id: el,
      title: humanize(el),
    };
  });

  return csvHeaders;
}

function createUniqueWeaponName(
  weaponName: string,
  attributeName: string
): string {
  return `${weaponName}_${attributeName}`;
}
