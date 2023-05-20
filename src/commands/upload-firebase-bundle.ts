import { Command, Flags } from '@oclif/core';
import { connectToFirebase, uploadFile } from '../lib/firebase/firebase';



export default class UploadFirebaseBundle extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
  };

  static args = [
    {name: 'dataFile', required: true},
    {name: 'destinationFile', required: true}
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(UploadFirebaseBundle);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./firebase-creds.json"

    connectToFirebase();
    await uploadFile(args.dataFile, args.destinationFile);
  }

}
