import { NdfParser } from "@izohek/ndf-parser";

const fs = require('fs');

export function extractToAnnotatedDescriptor(filePath: string) {
    const buffer: string = fs.readFileSync(filePath);
    const descriptorNdf = buffer.toString();
    const parser = new NdfParser(descriptorNdf);
    const jsonDescriptor = parser.parse();
    // Index 1 is the nice syntax, index 0 is raw
    const annotatedDescriptor = jsonDescriptor[1];
    return annotatedDescriptor;
}
