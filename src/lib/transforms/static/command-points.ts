import { Transform } from '../transform';

export class CommandPointsTransform extends Transform {
  name = 'commandPoints';

  deserialize(input: string): string {
    const commandPoints = Number.parseInt(input, 10);
    if(commandPoints > 500 && input.startsWith("32") || input.startsWith("37")) {
      const lastNumbers = input.slice(2);
      return `3${lastNumbers}`;
    }

    return input;
  }
}
