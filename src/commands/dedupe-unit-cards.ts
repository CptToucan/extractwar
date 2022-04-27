import { Command, Flags } from '@oclif/core';
import { ux } from 'cli-ux';
import { padNumber } from '../lib/pad-number';

const chalk = require('chalk');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

export default class DedupeUnitCards extends Command {
  static description =
    'dedupes unit cards in designated folder, duplicates need to be grouped together';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({ char: 'n', description: 'name to print' }),
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' }),
  };

  static args = [
    { name: 'unitCardInputFolder', required: true },
    { name: 'dedupeOutputFolder', required: true },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(DedupeUnitCards);

    const inputFilePaths: string[] = fs.readdirSync(args.unitCardInputFolder);
    fs.mkdirSync(args.dedupeOutputFolder, { recursive: true });

    this.log('Deduping unit cards');

    // The first index is always unique because there are no previous indexes
    this.writeImageFile(0, args.dedupeOutputFolder, `${args.unitCardInputFolder}/${inputFilePaths[0]}`);
    let uniqueImagesCount: number = 1;


    for (let i = 1; i < inputFilePaths.length; i++) {
      const filePathA: string = `${args.unitCardInputFolder}/${
        inputFilePaths[i - 1]
      }`;
      const filePathB: string = `${args.unitCardInputFolder}/${inputFilePaths[i]}`;

      ux.action.start(`Comparing ${filePathB} to ${filePathA}`);

      const imgA = PNG.sync.read(fs.readFileSync(filePathA));
      const imgB = PNG.sync.read(fs.readFileSync(filePathB));

      const { width, height, data } = imgA;
      const diff = new PNG({ width, height });

      const diffPixels: number = pixelmatch(
        data,
        imgB.data,
        diff.data,
        width,
        height,
        {
          threshold: 0,
        },
      );

      if (diffPixels > 0) {
        this.writeImageFile(i, args.dedupeOutputFolder, filePathB);
        uniqueImagesCount += 1;
        ux.action.stop(chalk.green('Different'));
      } else {
        ux.action.stop(chalk.red('Duplicate'));
      }
    }

    this.log(`Finished deduping unit cards | ${inputFilePaths.length} images => ${uniqueImagesCount} images`);
  }

  private writeImageFile(index: number, outputFolder: string, sourceImage: string) {
    const outputFileName: string = `${padNumber(index + 1)}.png`;
    const outputFilePath: string = `${outputFolder}/${outputFileName}`;

    fs.copyFileSync(sourceImage, outputFilePath);
  }
}
