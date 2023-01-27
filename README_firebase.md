ExtractWar allows for uploading parsed data to Firebase collections and building Firebase bundle files.

You need to provide `./firebase-creds.json` at the root of the project with your Firebase admin service account private key.

You can generate a new bundle with the command where output.json is the output from parse-ndf: `.\bin\dev build-firebase-bundles output.json`

By default, we'll try to build all the data.  You can skip generating certain bundles by using flags:
1. `.\bin\dev build-firebase-bundles output.json --no-divisions`
2. `.\bin\dev build-firebase-bundles output.json --no-units`

New patch data process:
1. Update NDFs: `./bin/dev generate-ndf-files`
2. Parse NDFS: `./bin/dev parse-ndf ./read/ output.json`
3. Update Firebase: `./bin/dev build-firebase-bundles output.json`
4. Manually upload bundle files to Firebase storage
