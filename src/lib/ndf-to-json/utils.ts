import { NdfConstant, NdfObject, ParserObject, ParserStringLiteral } from "@izohek/ndf-parser/dist/src/types";
const fs = require('fs');


export function isNdfObject(ndf: NdfObject | NdfConstant): ndf is NdfObject {
  return (ndf as NdfObject).ndf === 'object-parser';
}

export function isParserStringLiteral(ndf: ParserObject | ParserStringLiteral): ndf is ParserStringLiteral {
  return (ndf as ParserObject).ndf === 'string';
}



export function extractValuesFromFile(filePath: string): number[][] | null {
    const content: string = fs.readFileSync(filePath, 'utf-8');

    // Remove single-line comments
    const contentWithoutSingleLineComments = content.replace(/\/\/.*/g, '');

    // Remove multi-line comments
    const contentWithoutMultiLineComments = contentWithoutSingleLineComments.replace(/\/\*[\S\s]*?\*\//g, '');

    // Extract values using regular expression
    const match = contentWithoutMultiLineComments.match(/Values\s*=\s*\[\s*(\[[^\]]*]\s*,?\s*)*]/);
    if (match) {
        const valuesStr: string = match[0].replace(/Values\s*=\s*/, '');
        // Convert to list of lists
        // eslint-disable-next-line no-eval
        const valuesList: number[][] = eval(valuesStr);
        return valuesList;
    }

    return null;
}


