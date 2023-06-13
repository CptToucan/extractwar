import { Command } from '@oclif/core';
const fs = require('fs');

export default class ChainUnitsFile extends Command {
  static description = 'Build a UniteDescriptor.ndf file where all units upgrades of the previous unit';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = { };

  static args = [
    { name: 'dataFile', required: true },
    { name: 'outputFile', required: false, default: 'new-chain.ndf'}
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(ChainUnitsFile);

    console.log("Use ndf file: ", args.dataFile);
    console.log("Output to new ndf file: ", args.outputFile);

    const data = fs.readFileSync(args.dataFile);

    // Split ndf file into an array of each exported object
    const unitDescriptorNdfBlocks = data.toString().split(/(?=export)/g).slice(1);

    // capture ordered list of descriptor ids
    const descriptorIds = unitDescriptorNdfBlocks.map((data: any) => {
        return (/export (.*) is TEntityDescriptor/.exec(data) ?? [])[1]
    });

    const upgradeFromUnitRegex = /UpgradeFromUnit = (.*)/g

    for (let index = 0; index < unitDescriptorNdfBlocks.length; index++) {
        const upgradeUnitMatch = unitDescriptorNdfBlocks[index]
            .match(upgradeFromUnitRegex)
        
        if (upgradeUnitMatch) {
            // unit ndf already has an upgradefromunit
            // replace value
            unitDescriptorNdfBlocks[index] = index > 0 
                ? unitDescriptorNdfBlocks[index]
                    .replace(upgradeFromUnitRegex, "UpgradeFromUnit = " + descriptorIds[index - 1])
                : unitDescriptorNdfBlocks[index]
        } else {
            // unit ndf does not have upgradefrom unit
            // needs insert upgradefromunit
            if (index > 0) {
                const newBlock = unitDescriptorNdfBlocks[index]
                    .split(/(?=IsAce = .*)/g)
                
                unitDescriptorNdfBlocks[index] = [
                    newBlock[0],
                    "UpgradeFromUnit = " + descriptorIds[index - 1],
                    newBlock.slice(1)
                ].join('\n', );
            }
        }
    }

    fs.writeFileSync(args.outputFile, unitDescriptorNdfBlocks.join('\n'));
  }

}
