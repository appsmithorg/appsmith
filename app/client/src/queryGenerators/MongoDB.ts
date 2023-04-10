import { BaseQueryGenerator, COMMAND_TYPES } from "./BaseQueryGenerator";
import type { CombinedConfig } from "./types";

export default class MongoDB extends BaseQueryGenerator {
  buildSelect(combinedConfig: CombinedConfig) {
    const { config, select } = combinedConfig;
    //TODO: what should we do about columns?
    const buildCommand = Object.keys(select).reduce(
      (acc: Record<string, any>, key: string) => {
        const value = select[key as keyof typeof select];
        if (key === "offset") {
          acc["skip"] = { data: value };
        }
        if (key === "where") {
          acc["query"] = { data: `{ ${config.searchableColumn}: ${value} }` };
        }
        if (key === "orderBy") {
          acc["sort"] = { data: `{ ${value}: ${select["sortOrder"]} }` };
        }
        if (key === "limit") {
          acc["limit"] = { data: value };
        }
        return acc;
      },
      {},
    );
    return {
      find: buildCommand,
      ...super.build(COMMAND_TYPES.FIND, config.tableName),
    };
  }
  buildUpdate(combinedConfig: CombinedConfig) {
    const { config, insert } = combinedConfig;

    if (insert?.where) {
      return {
        updateMany: {
          query: { data: insert.where },
          update: { data: insert.value },
        },
        ...super.build(COMMAND_TYPES.UPDATE, config.tableName),
      };
    }
  }
  buildInsert(combinedConfig: CombinedConfig) {
    const { config, create } = combinedConfig;

    if (create?.value) {
      return {
        insert: {
          documents: { data: create.value },
        },
        ...super.build(COMMAND_TYPES.INSERT, config.tableName),
      };
    }
  }
}
