/* eslint-disable valid-jsdoc */
import {
  NdfConstant,
  NdfObject,
  ParserMap,
  ParserNdfType,
  ParserStringLiteral,
  ParserTuple,
} from '@izohek/ndf-parser/dist/src/types';
import { NdfParser } from '@izohek/ndf-parser';

const fs = require('fs');

export interface NdfObjectMap {
  [key: string]: (NdfObject | NdfConstant)[];
}
export interface MappedNdf {
  [key: string]: NdfObject | NdfConstant;
}

export interface NdfFilePathMap {
  [key: string]: string;
}

export interface NdfMap {
  [key: string]: string;
}

export const METRE = 1 / 2.83;

/**
 * Responsible for managing Ndf files being extracted from ndf syntax to readable JSON syntax
 */
export class NdfManager {
  constructor(filesToParse: NdfFilePathMap) {
    this.filesToParse = filesToParse;
  }

  /**
   * Map of files to parse
   */
  filesToParse: NdfFilePathMap;

  /**
   * Parsed ndfs stored as keys that map to those in filesToParse
   */
  parsedNdfDescriptors?: NdfObjectMap;

  async parse(): Promise<NdfObjectMap> {
    const descriptors = await this.getNdfsAsJson(this.filesToParse);
    this.parsedNdfDescriptors = descriptors;
    return descriptors;
  }

  /**
   * Extracts file paths in to json descriptors
   * @param ndfFilePaths Map of the file paths that are to be extracted
   * @returns Map of input descriptor files as JSON
   */
  getNdfsAsJson(ndfFilePaths: NdfFilePathMap): NdfObjectMap {
    const filesToRead = ndfFilePaths;
    const jsonDescriptors: NdfObjectMap = {};

    for (const key in filesToRead) {
      if (Object.prototype.hasOwnProperty.call(filesToRead, key)) {
        const annotatedDescriptor = this.extractToAnnotatedDescriptor(
          filesToRead[key]
        );
        jsonDescriptors[key] = annotatedDescriptor;
      }
    }

    return jsonDescriptors;
  }

  /**
   * Extracts a filepath to a JSON descriptor
   * @param filePath path to ndf file
   * @returns a JSON formatted ndf
   */
  extractToAnnotatedDescriptor(filePath: string): (NdfObject | NdfConstant)[] {
    const buffer: string = fs.readFileSync(filePath);
    const descriptorNdf = buffer.toString();
    const parser = new NdfParser(descriptorNdf);
    const jsonDescriptor = parser.parse();
    // Index 1 is the nice syntax, index 0 is raw
    const annotatedDescriptor = jsonDescriptor[1];
    return annotatedDescriptor;
  }

  /**
   * Converts descriptor search results in to a keyed object
   * @param descriptors Array of descriptors to be mapped
   * @returns Mapped descriptors
   */
  static mapDescriptorsToKeyMap(
    descriptors: (NdfObject | NdfConstant)[]
  ): MappedNdf {
    const mappedDescriptors: MappedNdf = {};
    for (const descriptor of descriptors) {
      mappedDescriptors[(descriptor as NdfObject).name] = descriptor;
    }

    return mappedDescriptors;
  }

  /**
   * Extract a tuple from a map
   * @param map Map to extract from
   * @param tupleKey The key of the tuple you want to extract
   * @returns
   */
  static extractTupleFromMap(map: ParserMap, tupleKey: string): unknown {
    const tuple = map.value.find((child) => {
      const tupleValue = (child as ParserTuple).value[0];
      return (tupleValue as ParserStringLiteral).value.includes(tupleKey);
    }) as ParserTuple | undefined;

    if (tuple) {
      return this.extractValueFromTuple(tuple);
    }
  }

  /**
   *  Extracts a value from a search result
   * @param searchResult The search result to extract from
   * @returns The value
   */
  static extractValueFromSearchResult<T>(searchResult: any): T {
    return searchResult?.value?.value;
  }

  /**
   * Extracts a value from a tuple
   * @param tuple The tuple to extract from
   * @returns The value
   */
  static extractValueFromTuple(tuple: ParserTuple): unknown {
    return (tuple.value[1] as ParserStringLiteral).value;
  }

  /**
   * Extracts values from a search result
   * @param searchResult The search result to extract from
   * @returns The value 
   */
  static extractValuesFromSearchResult<T>(searchResult: any): T[] {
    return searchResult?.value?.values;
  }


  /**
   * Extract number from a metre value in the form of (number * metre)
   * @param rawValue The raw value to extract from
   * @returns The number
   */
  static parseNumberFromMetre(rawValue: string): number {
    const metreValue = this.removeBracketsFromValue(rawValue);
    const numberTokens = metreValue.split('*');
    return Number(numberTokens[0]) * METRE;
  }

  /**
   * Extracts a number from a second value in the form of (number * second)
   * @param secondValue The second value to extract from
   * @returns The number
   */
  static parseNumberFromSecond(rawValue: string): number {
    const secondValue = this.removeBracketsFromValue(rawValue);
    const numberTokens = secondValue.split('*');
    return Number(numberTokens[0]);
  }

  /**
   * Removes brackets from a string value (e.g. (number * metre) -> number * metre)
   * @param target The string to remove brackets from
   * @returns The string without brackets
   */
  static removeBracketsFromValue(target: string): string {
    let result = target.replace(/\(/g, '');
    result = result.replace(/\)/g, '');
    return result;
  }

  /**
   *  Extracts the last token from a string delimited by '/'
   * @param target The string to extract from
   * @returns The last token
   */
  static extractLastToken(target: string): string {
    const tokens = target.split('/');
    return tokens[tokens.length - 1];
  }
}
