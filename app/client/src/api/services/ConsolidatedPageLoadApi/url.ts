import { getQueryStringfromObject } from "ee/entities/URLRedirect/URLAssembly";
import type { ConsolidatedApiParams } from "./types";

export class ConsolidatedApiUtils {
  private static BASE_URL = "v1/consolidated-api";
  private static VIEW_URL = `${this.BASE_URL}/view`;
  private static EDIT_URL = `${this.BASE_URL}/edit`;

  static getViewUrl = (requestParams: ConsolidatedApiParams) => {
    const queryParams = getQueryStringfromObject(requestParams);

    return `${this.VIEW_URL}${queryParams}`;
  };

  static getEditUrl = (requestParams: ConsolidatedApiParams) => {
    const queryParams = getQueryStringfromObject(requestParams);

    return `${this.EDIT_URL}${queryParams}`;
  };
}
