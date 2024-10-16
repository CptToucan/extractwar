import { Command, Flags } from '@oclif/core';
import { readdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

export default class PurgeNdaImages extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = [
    { name: 'warnoJson', required: true },
    { name: 'folder', required: true },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(PurgeNdaImages);

    const files = readdirSync(args.folder);
    const warnoJson = require(args.warnoJson);

    files.forEach((file) => {
      const imagefolder = join(args.folder, file);
      const fileName = file.split('.').slice(0, -1).join('.');
      const foundUnit = warnoJson.units.find((unit: any) => {
        if (unit.descriptorName === fileName) {
          // console.log('found', unit.descriptorName);
          return true;
        }
        return false;
      });

      if(!foundUnit) {
        console.log('deleting', fileName);
        unlinkSync(file);
      }
    });
  }
}
