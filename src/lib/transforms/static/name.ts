import { Transform } from "../transform";
import { nameRect } from "../../../var/unit-card-rects";

const badReconPrefix = [
  "FoD1 ",
  "to®] ",
  "te®1 ",
  "EoD] ",
  "(GBI ",
  "fo®I ",
  "fd®] ",
  "fG®1 ",
  "foDI ",
  "fo®] ",
  "b ",
  "[GOI ",
  "3 ",
  "a1 ",
  "3B ",
  "ES®",
  "[od! ",
  "to®] ",
  "wI ",
  " [ ",
  "6% ",
  "[ ",
  "GBI ",
  "o1 ",
  "[G®I ",
  "{1 ",
  "(6B ",
  "G® ",
  "™ ",
  "eI ",
  "GÂ® ",
  "â„¢ ",
  "eI "
]

export class NameTransform extends Transform {
  name = "name";
  rectangle = nameRect;
  deserialize(input: string): string {
    for(const prefix of badReconPrefix) {
      if(input.startsWith(prefix)) {
        const slicedInput = input.slice(prefix.length);
        const newOutput = `(%) ${slicedInput}`;
        return newOutput
      }
    }

    const output = input;
    return output;
  }
}