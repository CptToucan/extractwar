import { Command, Flags } from '@oclif/core';
import { connectToFirebase, insertDataIntoCollection } from '../lib/firebase/firebase';
import { Timestamp } from 'firebase-admin/firestore';
const fs = require('fs');

export default class BuildFirebaseBundles extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
  };

  static args = [
    { name: 'patchName', required: true },
    { name: 'dataFile', required: true },
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(BuildFirebaseBundles);

    console.log("Add patch record ", args.dataFile);

    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./firebase-creds.json"
    const db = connectToFirebase();
    console.log("Connected to firebase...")

    const data = JSON.parse(fs.readFileSync(args.dataFile));

    await insertDataIntoCollection(db, [{name: args.patchName, created: Timestamp.fromDate(new Date()) , data: JSON.stringify(data)}], 'patches');

    console.log("Patch added");

  }

}
