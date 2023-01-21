import { Command, Flags } from '@oclif/core';
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');

const EXTRACT_FILES = [
    'GameData/Generated/Gameplay/Gfx/Ammunition.ndf',
    'GameData/Generated/Gameplay/Gfx/ArmorDescriptor.ndf',
    'GameData/Generated/Gameplay/Gfx/DamageResistance.ndf',
    'GameData/Generated/Gameplay/Gfx/DamageStairTypeEvolutionOverRangeDescriptor.ndf',
    'GameData/Gameplay/Decks/DivisionCostMatrix.ndf',
    'GameData/Generated/Gameplay/Decks/DivisionRules.ndf',
    'GameData/Generated/Gameplay/Decks/Divisions.ndf',
    'GameData/Gameplay/Constantes/GDConstantes.ndf',
    'GameData/Generated/Gameplay/Decks/Packs.ndf',
    'GameData/Generated/Gameplay/Gfx/UniteDescriptor.ndf',
    'GameData/Generated/Gameplay/Gfx/WeaponDescriptor.ndf'
]

export default class GenerateNdfFiles extends Command {
  static description = 'Generate the latest WARNO mod files';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    prompt: Flags.boolean({ char: 'p' }),
    // @ts-ignore
    warnoDir: Flags.directory({ required: false}),
     // @ts-ignore
    modDir: Flags.directory({ required: false })
  };

  static args = [
    { name: 'outDir', required: false, default: path.join('.', 'read') },
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateNdfFiles);

    const warnoDir = flags.warnoDir ?? path.join(
        'C:', 'Program Files (x86)', 'Steam', 'steamapps', 'common', 'WARNO'
    );
    const modDir = flags.modDir ?? os.tmpdir();
    const createModCmdDir = path.join(warnoDir, 'Mods');
    const createModCmd = "CreateNewMod.bat";

    console.log("WARNO Dir: ", warnoDir);
    console.log("Create Mod Temp Dir: ", modDir);
    console.log("New mod command: ", createModCmdDir, createModCmd)

    const modName = 'warnomod-' + uuidv4();
    const modFullPath = path.join(modDir, modName);

    console.log("Run command: ", createModCmdDir, createModCmd, modFullPath)
    console.log("Output to: ", args.outDir)

    const newModProcess = child_process.spawn(createModCmd, [modFullPath], { cwd: createModCmdDir })

    newModProcess.stdout.on('data', (data: any) => {
        console.log(`stdout: ${data}`);
      });

    newModProcess.stderr.on('data', (data: any) => {
        console.error(`stderr: ${data}`);
      });

    newModProcess.on('exit', () => {
        console.log("New mod created from: ", modFullPath)
        // Finished creating new mod, extract files
        const numFiles = this.extractModFiles(modFullPath, args.outDir)
        console.log(`Extracted ${numFiles} files to: `, args.outDir)
    })
  }

  /**
   * Extract the specific files we want into the given directory.  We don't keep
   * directory structure, only base file name.
   * 
   * @param extractDir 
   * @param destinationDir 
   */
  public extractModFiles(extractDir: string, destinationDir: string) {
    fs.mkdirSync(destinationDir, { recursive: true });

    for (const file of EXTRACT_FILES) {
        const originalPath = path.join(extractDir, file)
        const newPath = path.join(destinationDir, path.basename(file))
        fs.copyFileSync(originalPath, newPath)
    }

    return EXTRACT_FILES.length
  }
}
