#!/bin/bash

./bin/dev generate-ndf-toucan ./read/warno ./read-previous-patch/warno --modDir ../../warno-ndf-data/warno
./bin/dev ndf-to-json ./read/warno warno.json
./bin/dev upload-firebase-bundle warno.json warno/units-and-divisions.json
./bin/dev upload-firebase-bundle warno.json.stripped warno/units-and-divisions-stripped.json