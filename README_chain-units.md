Use the command `chain-units-file` to generate an ndf file based on `UniteDescriptor.ndf` where every unit is marked as an upgrade from the previous unit.

`./bin/dev chain-units-file ./read/UniteDescriptor.ndf`

The first argument is the source of the UniteDescriptor.ndf file.

There is a second optional argument sets the output file.  The script defaults to `./new-chain.ndf`
