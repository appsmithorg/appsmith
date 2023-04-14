import { isEmpty, merge } from "lodash";
import { BaseQueryGenerator } from "./BaseQueryGenerator";
import type { CombinedConfig } from "./types";

enum COMMAND_TYPES {
  "FIND" = "FIND",
  "INSERT" = "INSERT",
  "UPDATE" = "UPDATE",
}
const ALLOWED_INITAL_VALUE_KEYS = ["aggregate", "smartSubstitution"];

export default abstract class MongoDB extends BaseQueryGenerator {
  private static buildBasicConfig(command: COMMAND_TYPES, tableName: string) {
    return { command: { data: command }, collection: { data: tableName } };
  }
  private static buildSelect(combinedConfig: CombinedConfig) {
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
      actionTitle: "Find_query",
      actionPayload: {
        find: buildCommand,
        ...this.buildBasicConfig(COMMAND_TYPES.FIND, config.tableName),
      },
    };
  }
  private static buildUpdate(combinedConfig: CombinedConfig) {
    const { config, insert } = combinedConfig;

    if (!insert || !insert.where) return;

    return {
      actionTitle: "Update_query",
      actionPayload: {
        updateMany: {
          query: { data: insert.where },
          update: { data: insert.value },
        },
        ...this.buildBasicConfig(COMMAND_TYPES.UPDATE, config.tableName),
      },
    };
  }
  private static buildInsert(combinedConfig: CombinedConfig) {
    const { config, create } = combinedConfig;

    if (!create || !create.value) return;

    return {
      actionTitle: "Insert_query",
      actionPayload: {
        insert: {
          documents: { data: create.value },
        },
        ...this.buildBasicConfig(COMMAND_TYPES.INSERT, config.tableName),
      },
    };
  }

  private static createPayload(
    formDataInitialValues: Record<string, any>,
    commandKey: string,
    builtValues: Record<string, any> | undefined,
  ) {
    if (!builtValues || isEmpty(builtValues)) {
      return;
    }
    // if no initial values return payload with builtin values
    if (!formDataInitialValues || isEmpty(formDataInitialValues)) {
      return builtValues;
    }

    const scrubedOutInitalValues = [...ALLOWED_INITAL_VALUE_KEYS, commandKey]
      .filter((key) => formDataInitialValues[key])
      .reduce((acc, key) => {
        acc[key] = formDataInitialValues[key];
        return acc;
      }, {} as Record<string, any>);

    const { actionPayload, actionTitle } = builtValues;
    return {
      actionPayload: {
        formData: merge({}, scrubedOutInitalValues, actionPayload),
      },
      actionTitle,
    };
  }
  static build(
    combinedConfig: CombinedConfig,
    pluginInitalValues: { actionConfiguration: any },
  ) {
    const allBuildConfigs = [];

    const formDataInitialValues =
      pluginInitalValues?.actionConfiguration?.formData;

    if (combinedConfig.select) {
      allBuildConfigs.push(
        this.createPayload(
          formDataInitialValues,
          "find",
          this.buildSelect(combinedConfig),
        ),
      );
    }
    if (combinedConfig.insert) {
      allBuildConfigs.push(
        this.createPayload(
          formDataInitialValues,
          "updateMany",
          this.buildUpdate(combinedConfig),
        ),
      );
    }
    if (combinedConfig.create) {
      allBuildConfigs.push(
        this.createPayload(
          formDataInitialValues,
          "insert",
          this.buildInsert(combinedConfig),
        ),
      );
    }
    //remove falsey build configs
    return allBuildConfigs.filter((val) => !!val);
  }
}
