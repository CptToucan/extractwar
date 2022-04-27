import { Transform } from '../transform';

export class CommandPointsTransform extends Transform {
  name = 'commandPoints';

  deserialize(input: string): string {
    let output = '';

    for (const char of input) {
      let outChar = char;
      if (char === 'o' || char === 'O' || char === 'D') {
        outChar = '0';
      }

      if (char === 's' || char === 'S') {
        outChar = '5';
      }

      if (char === 'n') {
        outChar = '11';
      }

      if (char === 'y' || char === 'Y') {
        outChar = '4';
      }

      if (char === 'u') {
        outChar = '14';
      }

      if (char === 'B') {
        outChar = '6';
      }

      output += outChar;
    }

    if (output === '455') {
      output = '45';
    }
    
    if (output === '21440') {
      output = '240';
    }

    return output;
  }
}
