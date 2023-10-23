import { search } from "@izohek/ndf-parser";
import { NdfObject } from "@izohek/ndf-parser/dist/src/types";
import { NdfManager } from "./ndf-manager";


export abstract class AbstractManager {
  constructor(ndf: NdfObject) {
    this.ndf = ndf;
  }

  ndf: NdfObject;

  abstract parse(): unknown;
  
  getFirstSearchResult(key: string): any {
    return search(this.ndf, key)[0];
  }

  getValueFromSearch<T>(key: string): T {

    console.log(NdfManager.extractValueFromSearchResult(
      this.getFirstSearchResult(key)
    ))
    return NdfManager.extractValueFromSearchResult(
      this.getFirstSearchResult(key)
    );
  }
}