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
    return NdfManager.extractValueFromSearchResult(
      this.getFirstSearchResult(key)
    );
  }


  /**
   *  Get the value from the search result of the legacy key, if it exists.  Otherwise, get the value from the search result of the key.
   * @param legacyKey 
   * @param key 
   * @returns 
   */
  getLegacyValueFromSearchWithUpgradeFallback<T>(legacyKey: string, key: string): T {
    const legacyValue = this.getValueFromSearch<T>(legacyKey);
    if (legacyValue) {
      return legacyValue;
    }
    return this.getValueFromSearch<T>(key);
  }

  /**
   * Get the first search result from the legacy key, if it exists.  Otherwise, get the first search result from the key.
   * @param legacyKey 
   * @param key 
   * @returns 
   */
  getFirstLegacySearchResult(legacyKey: string, key: string): any {
    const legacyResult = search(this.ndf, legacyKey)[0];
    if (legacyResult) {
      return legacyResult;
    }
    return this.getFirstSearchResult(key);
  }

}