import { Command, Flags } from '@oclif/core';
import { exec } from 'child_process';



export default class ScpFiles extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
  };

  static args = [
    {name: 'dataFile', required: true},
    {name: 'destinationFile', required: true}
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(ScpFiles);
    const { dataFile, destinationFile } = args;

    const command = `scp ${dataFile} ${destinationFile}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  }

}
