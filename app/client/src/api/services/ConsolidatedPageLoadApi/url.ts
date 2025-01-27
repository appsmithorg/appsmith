import pickBy from "lodash/pickBy";
import identity from "lodash/identity";
import type { ConsolidatedApiParams } from "./types";

export class ConsolidatedApiUtils {
  private static BASE_URL = "v1/consolidated-api";
  private static VIEW_URL = `${this.BASE_URL}/view`;
  private static EDIT_URL = `${this.BASE_URL}/edit`;

  static getViewUrl = (requestParams: ConsolidatedApiParams) => {
    // Remove undefined values from the requestParams object
    const queryParamsObject = pickBy(requestParams, identity);
    const queryParams = new URLSearchParams(queryParamsObject);

    return `${this.VIEW_URL}?${queryParams}`;
  };

  static getEditUrl = (requestParams: ConsolidatedApiParams) => {
    // Remove undefined values from the requestParams object
    const queryParamsObject = pickBy(requestParams, identity);
    const queryParams = new URLSearchParams(queryParamsObject);

    return `${this.EDIT_URL}?${queryParams}`;
  };
}
