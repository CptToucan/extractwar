import { Command, Flags } from '@oclif/core';
import { readdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

export default class ConvertImagesBundleToSiteFormat extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = [{ name: 'folder', required: true }];

  public async run(): Promise<void> {
    const { args } = await this.parse(ConvertImagesBundleToSiteFormat);

    const files = readdirSync(args.folder);
    files.forEach((file) => {
      console.log(file);
      const oldPath = join(args.folder, file);
      if (file.endsWith('.png')) {
        const newFileName = `Descriptor_Unit_${file}`;
        const newPath = join(args.folder, newFileName);
        renameSync(oldPath, newPath);
      }
      else {
        // delete the file
        unlinkSync(oldPath);
      }
    });
  }
}
