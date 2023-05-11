import { Command, Flags } from '@oclif/core';
import { EXTRACT_FILES } from './generate-ndf-files';
const fs = require('fs');
const path = require('path');

export default class GenerateNdfToucan extends Command {
  static description = 'Extract the latest WARNO mod files';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    // @ts-ignore
    modDir: Flags.directory({ required: true }),
  };

  static args = [
    { name: 'outDir', required: false, default: path.join('.', 'read') },
    {
      name: 'backupDir',
      required: false,
      default: path.join('.', 'read-previous-patch'),
    },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateNdfToucan);

    const modDir = flags.modDir;
    const outDir = args.outDir;
    const backupDir = args.backupDir;

    // clear read-previous-patch directory
    if (fs.existsSync(backupDir)) {
      fs.rmdirSync(backupDir, { recursive: true });
    }

    // backup the read directory to read-previous-patch
    if (fs.existsSync(outDir)) {
      fs.renameSync(outDir, backupDir);
    }

    // create read directory
    fs.mkdirSync(outDir, { recursive: true });

    const numFiles = this.extractModFiles(modDir, outDir);
    console.log(`Extracted ${numFiles} files to: `, outDir);
  }

  /**
   * Extract the specific files we want into the given directory.  We don't keep
   * directory structure, only base file name.
   *
   * @param extractDir
   * @param destinationDir
   */
  public extractModFiles(extractDir: string, destinationDir: string) {
    fs.mkdirSync(destinationDir, { recursive: true });

    let numFiles = 0;
    for (const file of EXTRACT_FILES) {
      const originalPath = path.join(extractDir, file);
      const newPath = path.join(destinationDir, path.basename(file));
      if (fs.existsSync(originalPath)) {
        fs.copyFileSync(originalPath, newPath);
        numFiles++;
      }
    }

    return numFiles;
  }
}
