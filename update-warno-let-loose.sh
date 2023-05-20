#!/bin/bash

cd ../../warno-ndf-data/warno-let-loose
git pull
cd ../../programming/extractwar
./bin/dev generate-ndf-toucan ./read/warno-let-loose ./read-previous-patch/warno-let-loose --modDir ../../warno-ndf-data/warno-let-loose
./bin/dev ndf-to-json ./read/warno-let-loose warno-let-loose.json
./bin/dev upload-firebase-bundle warno-let-loose.json warno-let-loose/units-and-divisions.json