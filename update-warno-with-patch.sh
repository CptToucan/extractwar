#!/bin/bash

patch_name=$1  # Parameter for input file

if [ -z "$1" ]; then
  echo "Error: No patch name provided."
  echo "Usage: $0 <patch_file>"
  exit 1
fi

./bin/dev generate-ndf-toucan ./read/warno ./read-previous-patch/warno --modDir ../../warno-ndf-data/warno
./bin/dev ndf-to-json ./read/warno warno.json ./read-previous-patch/warno
./bin/dev upload-firebase-bundle warno.json warno/units-and-divisions.json
./bin/dev upload-firebase-bundle warno.json.stripped warno/units-and-divisions-stripped.json
./bin/dev upload-firebase-bundle damageTable.json warno/damageTable.json
./bin/dev add-patch-to-firebase "$patch_name" patch.json