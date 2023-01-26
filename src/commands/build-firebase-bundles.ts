import { Command, Flags } from '@oclif/core';
import { connectToFirebase, insertDataIntoCollection, deleteAllFromCollection, buildBundle } from '../lib/firebase/firebase';
const fs = require('fs');

export default class BuildFirebaseBundles extends Command {
  static description = 'ExtractWar firebase functionality';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    units: Flags.boolean({ char: 'u', default: true, allowNo: true}),
    divisions: Flags.boolean({ char: 'd', default: true, allowNo: true}),
  };

  static args = [
    { name: 'dataFile', required: true },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BuildFirebaseBundles);

    console.log("Build bundle from file: ", args.dataFile);

    process.env.GOOGLE_APPLICATION_CREDENTIALS = "./firebase-creds.json"
    const db = connectToFirebase();
    console.log("Connected to firebase...")

    const data = JSON.parse(fs.readFileSync(args.dataFile));

    if (flags.units) {
      console.log("Units flag set, building new units bundle")
      const unitsCollectionName = 'units';
      await deleteAllFromCollection(db, unitsCollectionName);
      await insertDataIntoCollection(db, data.units, unitsCollectionName);
      await buildBundle(db, unitsCollectionName, './bundle-units.txt');
    } else {
      console.log("Units flag not set - skipping units bundle")
    }
    
    if (flags.divisions) {
      console.log("Divisions flag set, building new divisions bundle")
      const divisionsCollectionName = 'divisions';

      await deleteAllFromCollection(db, divisionsCollectionName);
      await insertDataIntoCollection(db, data.divisions, divisionsCollectionName);
      await buildBundle(db, divisionsCollectionName, './bundle-divisions.txt');
    } else {
      console.log("Divisions flag not set - skipping divisions bundle")
    }
  }

}
