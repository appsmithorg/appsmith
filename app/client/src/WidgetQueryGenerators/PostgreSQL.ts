import { BaseQueryGenerator } from "./BaseQueryGenerator";
import type { CombinedConfig } from "./types";

export default abstract class PostgreSQL extends BaseQueryGenerator {
  private static buildSelect(combinedConfig: CombinedConfig) {
    const { config, select } = combinedConfig;

    if (!select) return;
    const { limit, offset, orderBy, sortOrder, where } = select;

    const querySegments = [
      {
        isValuePresent: config.tableName,
        template: `SELECT * FROM ${config.tableName}`,
      },
      {
        isValuePresent: config.searchableColumn && where,
        template: `WHERE "${config.searchableColumn}" ilike '%${where}%'`,
      },
      {
        isValuePresent: orderBy,
        template: `ORDER BY "${orderBy}" ${sortOrder || ""}`,
      },
      {
        isValuePresent: limit,
        template: `LIMIT ${limit}`,
      },
      {
        isValuePresent: offset,
        template: `OFFSET ${offset}`,
      },
    ];
    const consolidatedQuery = querySegments
      .filter(({ isValuePresent }) => !!isValuePresent)
      .reduce((acc, curr, index) => {
        return acc + (index ? "\n" : "") + curr.template;
      }, "");

    return {
      actionTitle: "Find_query",
      actionPayload: {
        body: consolidatedQuery,
      },
    };
  }

  private static buildUpdate(combinedConfig: CombinedConfig) {
    const { config, insert } = combinedConfig;

    if (!insert) return;
    if (!insert || !insert.where) return;
    const { value, where } = insert;
    return {
      actionTitle: "Update_query",
      actionPayload: {
        body: `UPDATE ${config.tableName} SET\n${value}\nWHERE ${where}`,
      },
    };
  }
  private static buildInsert(combinedConfig: CombinedConfig) {
    const { config, create } = combinedConfig;

    if (!create || !create.value) return;

    return {
      actionTitle: "Insert_query",
      actionPayload: {
        body: `INSERT INTO ${config.tableName}\n${create.value}`,
      },
    };
  }
  public static build(
    combinedConfig: CombinedConfig,
    pluginInitalValues: { actionConfiguration: any },
  ) {
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

    return allBuildConfigs
      .filter((val) => !!val)
      .map((val) => ({
        ...val,
        actionPayload: {
          ...(val?.actionPayload || {}),
          ...(pluginInitalValues?.actionConfiguration || {}),
        },
      }));
  }
}
