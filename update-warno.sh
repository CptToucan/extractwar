#!/bin/bash

./bin/dev generate-ndf-toucan ./read/warno ./read-previous-patch/warno --modDir ../../warno-ndf-data/warno
./bin/dev ndf-to-json ./read/warno warno.json
zip -r BUNDLE.zip patch.json damageTable.json warno.json