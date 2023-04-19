import { BaseQueryGenerator } from "./BaseQueryGenerator";
import type { CombinedConfig } from "./types";
import { format } from "sql-formatter";

export default abstract class PostgreSQL extends BaseQueryGenerator {
  private static buildSelect(combinedConfig: CombinedConfig) {
    const { config, select } = combinedConfig;
    //if no table name do not build query
    if (!select || !config.tableName) {
      return;
    }

    const { limit, offset, orderBy, sortOrder, where } = select;

    const querySegments = [
      {
        isValuePresent: config.tableName,
        template: "SELECT * FROM $1",
        params: {
          1: config.tableName,
        },
      },
      {
        isValuePresent: config.searchableColumn && where,
        template: "WHERE $2 ilike $3",
        params: {
          2: `"${config.searchableColumn}"`,
          3: `'%${where}%'`,
        },
      },
      {
        isValuePresent: orderBy,
        template: "ORDER BY $4 $5",
        params: {
          4: `"${orderBy}"`,
          5: sortOrder || "",
        },
      },
      {
        isValuePresent: limit,
        template: "LIMIT $6",
        params: {
          6: limit,
        },
      },
      {
        isValuePresent: offset,
        template: "OFFSET $7",
        params: {
          7: offset,
        },
      },
    ];

    const { params, template } = querySegments
      //we need to filter out query segments which are not defined
      .filter(({ isValuePresent }) => !!isValuePresent)
      .reduce(
        (acc, curr) => {
          const { params, template } = curr;
          return {
            template: acc.template + " " + template,
            params: { ...acc.params, ...params },
          };
        },
        { template: "", params: {} },
      );
    //formats sql string
    const res = format(template, {
      params,
      language: "postgresql",
    });
    return {
      actionTitle: "Find_query",
      actionPayload: {
        body: res,
      },
    };
  }

  private static buildUpdate(combinedConfig: CombinedConfig) {
    const { config, insert } = combinedConfig;
    //if no table name do not build query
    if (!insert || !insert.where || !config.tableName) {
      return;
    }

    const { value, where } = insert;

    const res = format("UPDATE $1 SET $2 WHERE $3", {
      params: {
        1: config.tableName,
        2: value,
        3: where,
      },
      language: "postgresql",
    });

    return {
      actionTitle: "Update_query",
      actionPayload: {
        body: res,
      },
    };
  }

  private static buildInsert(combinedConfig: CombinedConfig) {
    const { config, create } = combinedConfig;
    //if no table name do not build query
    if (!create || !create.value || !config.tableName) {
      return;
    }

    const res = format("INSERT INTO $1 $2", {
      params: {
        1: config.tableName,
        2: create.value,
      },
      language: "postgresql",
    });

    return {
      actionTitle: "Insert_query",
      actionPayload: {
        body: res,
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
