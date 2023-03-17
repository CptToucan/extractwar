import { NdfConstant, NdfObject, ParserObject, ParserStringLiteral } from "@izohek/ndf-parser/dist/src/types";

export function isNdfObject(ndf: NdfObject | NdfConstant): ndf is NdfObject {
  return (ndf as NdfObject).ndf === 'object-parser';
}

export function isParserStringLiteral(ndf: ParserObject | ParserStringLiteral): ndf is ParserStringLiteral {
  return (ndf as ParserObject).ndf === 'string';
}