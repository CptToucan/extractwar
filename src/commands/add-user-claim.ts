import { Command, Flags } from '@oclif/core';
import { connectToFirebase, uploadFile } from '../lib/firebase/firebase';
import { auth } from 'firebase-admin';
import { Arg } from '@oclif/core/lib/interfaces';

export default class AddUserClaim extends Command {
  static description = 'ExtractWar user claims';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args: Arg<any>[] = [
    { name: 'uid', required: true },
    { name: 'claims', required: true, parse: (input: string) => Promise.resolve(input.split(',')) } // Parse the comma-separated string into an array
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(AddUserClaim);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = './firebase-creds.json';

    connectToFirebase();

    const customClaims: { [key: string]: boolean } = {};
    args.claims.forEach((claim: string) => {
      customClaims[claim] = true; // Set each claim to true
    });

    await auth().setCustomUserClaims(args.uid, customClaims);
  }
}
