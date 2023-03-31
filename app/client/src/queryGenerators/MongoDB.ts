import type { CombinedConfig, GetQueryGenerationConfigResponse } from "./types";
import { BaseQueryGenerator } from "./baseQueryGenerator";

export default class MongoDB extends BaseQueryGenerator {
  buildSelectQuery(combinedConfig: CombinedConfig) {
    const { config, select } = combinedConfig;
    //what should we do about columns
    const buildCommand = Object.keys(select)
      .map((key) => {
        const value = select[key];
        if (key === "offset") {
          return { skip: value };
        }
        // TODO: the equaivalent key for where is filter but the app is generating query
        if (key === "where") {
          return { filter: { [config.searchableColumn]: value } };
        }
        if (key === "orderBy") {
          return { sort: { [value]: select["sortOrder"] } };
        }
        if (key === "sortOrder") {
          return;
        }
        //all other keys do not require translation like limit
        return { [key]: value };
      })
      .filter((val) => !!val);
    return buildCommand;
  }

  build() {}
}
