import { isEmpty } from "lodash";
import { BaseQueryGenerator } from "./BaseQueryGenerator";
import type { CombinedConfig } from "./types";

enum COMMAND_TYPES {
  "FIND" = "FIND",
  "INSERT" = "INSERT",
  "UPDATE" = "UPDATE",
}
export default class MongoDB extends BaseQueryGenerator {
  private buildBasicConig(command: COMMAND_TYPES, tableName: string) {
    return { command: { data: command }, collection: { data: tableName } };
  }
  private buildSelect(combinedConfig: CombinedConfig) {
    const { config, select } = combinedConfig;

    if (!select) return;
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

    if (isEmpty(buildCommand)) return;

    return {
      find: buildCommand,
      ...this.buildBasicConig(COMMAND_TYPES.FIND, config.tableName),
    };
  }
  private buildUpdate(combinedConfig: CombinedConfig) {
    const { config, insert } = combinedConfig;

    if (!insert || !insert.where) return;

    return {
      updateMany: {
        query: { data: insert.where },
        update: { data: insert.value },
      },
      ...this.buildBasicConig(COMMAND_TYPES.UPDATE, config.tableName),
    };
  }
  private buildInsert(combinedConfig: CombinedConfig) {
    const { config, create } = combinedConfig;

    if (!create || !create.value) return;

    return {
      insert: {
        documents: { data: create.value },
      },
      ...this.buildBasicConig(COMMAND_TYPES.INSERT, config.tableName),
    };
  }

  build(combinedConfig: CombinedConfig) {
    const allBuildConfigs = [];
    if (combinedConfig.select) {
      allBuildConfigs.push(this.buildSelect(combinedConfig));
    }
    if (combinedConfig.insert) {
      allBuildConfigs.push(this.buildUpdate(combinedConfig));
    }
    if (combinedConfig.create) {
      allBuildConfigs.push(this.buildInsert(combinedConfig));
    }
    //remove falsey build configs
    return allBuildConfigs.filter((val) => !!val);
  }
}
