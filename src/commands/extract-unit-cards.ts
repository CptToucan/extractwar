import { Command, Flags } from '@oclif/core';
import { ux } from 'cli-ux';
import { padNumber } from '../lib/pad-number';
const sharp = require('sharp');
const fs = require('fs');

const LEFT = 4791 + 880 + 80;
const TOP = 366;
const WIDTH = 880;
const HEIGHT = 1652;

export default class ExtractUnitCards extends Command {
  static description = 'Extracts raw unit cards into a standardised format';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    prompt: Flags.boolean({ char: 'p' }),
  };

  static args = [
    { name: 'screenshotInput', required: true },
    { name: 'screenshotOutput', required: true },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ExtractUnitCards);

    let left: number = LEFT;
    let top: number = TOP;
    let width: number = WIDTH;
    let height: number = HEIGHT;

    if (flags.prompt === true) {
      left = await ux.prompt('Enter left pixel of unit card');
      top = await ux.prompt('Enter top pixel of unit card');
      width = await ux.prompt('Enter width of unit card');
      height = await ux.prompt('Enter height of unit card');
    }

    this.log('Extracting unit cards');

    const filesInInputDirectory = fs.readdirSync(args.screenshotInput);
    fs.mkdirSync(args.screenshotOutput, { recursive: true });

    let unitIndex = 1;

    for (const filePath of filesInInputDirectory) {
      const paddedId: string = padNumber(unitIndex);
      const inputFilePath: string = `${args.screenshotInput}/${filePath}`;
      const outputFilePath: string = `${args.screenshotOutput}/${paddedId}.png`;

      ux.action.start(`Extracting ${filePath}`);

      // eslint-disable-next-line no-await-in-loop
      await sharp(inputFilePath)
        .extract({ left, top, width, height })
        .removeAlpha()
        .toFile(outputFilePath);

      ux.action.stop(
        `Extracted ${unitIndex} / ${filesInInputDirectory.length}`,
      );
      unitIndex++;
    }

    this.log('Finished extracting unit cards');
  }
}

/*

async function extractUnitCards(
  screenshotInput: string,
  screenshotOutput: string
) {
  const files = fs.readdirSync(screenshotInput);
  fs.mkdirSync(screenshotOutput, { recursive: true });

  let index = 1;
  for (const file of files) {
    const paddedId = padNumber(index);

    ux.action.start(`Extracting from ${file} - ${index} / ${files.length}`);

    // eslint-disable-next-line no-await-in-loop

    await sharp(`${screenshotInput}/${file}`)
      .extract({ left: 4791, top: 366, width: 880, height: 1652 })
      .removeAlpha()
      // .sharpen({sigma: 5})
      .toFile(`${screenshotOutput}/output_${paddedId}.png`);

      ux.action.stop(`Extracted ${file} - ${index} / ${files.length}`)
    index++;
  }
}
*/
