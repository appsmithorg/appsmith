import { pickBy, identity } from "lodash";
import type { ConsolidatedApiParams } from "./types";

export class ConsolidatedApiUtils {
  private static BASE_URL = "v1/consolidated-api";
  private static VIEW_URL = `${this.BASE_URL}/view`;
  private static EDIT_URL = `${this.BASE_URL}/edit`;

  static getViewUrl = (requestParams: ConsolidatedApiParams) => {
    // Remove undefined values from the requestParams object
    const queryParamsObject = pickBy(requestParams, identity);
    const queryParamsString = new URLSearchParams(queryParamsObject).toString();

    return `${this.VIEW_URL}?${queryParamsString}`;
  };

  static getEditUrl = (requestParams: ConsolidatedApiParams) => {
    // Remove undefined values from the requestParams object
    const queryParamsObject = pickBy(requestParams, identity);
    const queryParamsString = new URLSearchParams(queryParamsObject).toString();

    return `${this.EDIT_URL}?${queryParamsString}`;
  };
}
