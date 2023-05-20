#!/bin/bash

cd ../../warno-ndf-data/frago
git pull
cd ../../programming/extractwar
./bin/dev generate-ndf-toucan ./read/frago ./read-previous-patch/frago --modDir ../../warno-ndf-data/frago
./bin/dev ndf-to-json ./read/frago frago.json
./bin/dev upload-firebase-bundle frago.json frago/units-and-divisions.json