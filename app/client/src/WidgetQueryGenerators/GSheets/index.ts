import { isEmpty, isNumber, merge } from "lodash";
import { BaseQueryGenerator } from "WidgetQueryGenerators/BaseQueryGenerator";
import { QUERY_TYPE } from "WidgetQueryGenerators/types";
import type {
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
  GSheetsFormData,
  ActionConfigurationGSheets,
} from "WidgetQueryGenerators/types";
import { removeSpecialChars } from "utils/helpers";
import { DatasourceConnectionMode } from "entities/Datasource";
import type { DatasourceStorage } from "entities/Datasource";

enum COMMAND_TYPES {
  "FIND" = "FETCH_MANY",
  "INSERT" = "INSERT_ONE",
  "UPDATE" = "UPDATE_ONE",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  "COUNT" = "FETCH_MANY",
}
const COMMON_INITIAL_VALUE_KEYS = [
  "smartSubstitution",
  "entityType",
  "queryFormat",
];
const SELECT_INITAL_VALUE_KEYS = [
  "range",
  "where",
  "pagination",
  "tableHeaderIndex",
  "projection",
];

export default abstract class GSheets extends BaseQueryGenerator {
  private static buildBasicConfig(
    command: COMMAND_TYPES,
    tableName: string,
    sheetName?: string,
    tableHeaderIndex?: number,
  ) {
    return {
      command: { data: command },
      sheetUrl: { data: tableName },
      sheetName: { data: sheetName },
      tableHeaderIndex: {
        data: isNumber(tableHeaderIndex)
          ? tableHeaderIndex.toString()
          : undefined,
      },
    };
  }

  private static buildFind(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;

    if (select && formConfig.sheetName) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryPayload: any = {
        type: QUERY_TYPE.SELECT,
        name: `Find_${removeSpecialChars(formConfig.sheetName)}`,
        formData: {
          ...this.buildBasicConfig(
            COMMAND_TYPES.FIND,
            formConfig.tableName,
            formConfig.sheetName,
            formConfig.tableHeaderIndex,
          ),
        },
        dynamicBindingPathList: [],
      };

      if (select["where"]) {
        queryPayload.formData.where = {
          data: {
            children: [
              {
                condition: "CONTAINS",
                key: `{{${select["where"]} ? "${formConfig.searchableColumn}" : ""}}`,
                value: `{{${select["where"]}}}`,
              },
            ],
          },
        };

        queryPayload.dynamicBindingPathList.push({
          key: "formData.where.data",
        });
      }

      if (select["sortOrder"] && select["orderBy"]) {
        queryPayload.formData.sortBy = {
          data: [
            {
              column: `{{${select["orderBy"]}}}`,
              order: select["sortOrder"],
            },
          ],
        };

        queryPayload.dynamicBindingPathList.push({
          key: "formData.sortBy.data",
        });
      }

      if (select["limit"] && select["offset"]) {
        queryPayload.formData.pagination = {
          data: {
            limit: `{{${select["limit"]}}}`,
            offset: `{{${select["offset"]}}}`,
          },
        };

        queryPayload.dynamicBindingPathList.push({
          key: "formData.pagination.data",
        });
      }

      return queryPayload;
    }
  }

  private static buildTotalRecord(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;

    if (select && formConfig.sheetName) {
      return {
        type: QUERY_TYPE.TOTAL_RECORD,
        name: `Total_record_${removeSpecialChars(formConfig.sheetName)}`,
        formData: {
          where: {
            data: {
              children: [
                {
                  condition: "CONTAINS",
                  key: `{{${select["where"]} ? "${formConfig.searchableColumn}" : ""}}`,
                  value: `{{${select["where"]}}}`,
                },
              ],
            },
          },
          ...this.buildBasicConfig(
            COMMAND_TYPES.COUNT,
            formConfig.tableName,
            formConfig.sheetName,
            formConfig.tableHeaderIndex,
          ),
        },
        dynamicBindingPathList: [
          {
            key: "formData.where.data",
          },
        ],
      };
    }
  }

  private static buildUpdate(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ): Record<string, object | string> | undefined {
    const { update } = widgetConfig;

    if (update && formConfig.sheetName) {
      return {
        type: QUERY_TYPE.UPDATE,
        name: `Update_${removeSpecialChars(formConfig.sheetName)}`,
        formData: {
          rowObjects: {
            data: `{{${update.value}}}`,
          },
          ...this.buildBasicConfig(
            COMMAND_TYPES.UPDATE,
            formConfig.tableName,
            formConfig.sheetName,
            formConfig.tableHeaderIndex,
          ),
        },
        dynamicBindingPathList: [
          {
            key: "formData.rowObjects.data",
          },
        ],
      };
    }
  }

  private static buildInsert(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { create } = widgetConfig;

    if (create && formConfig.sheetName) {
      return {
        type: QUERY_TYPE.CREATE,
        name: `Insert_${removeSpecialChars(formConfig.sheetName)}`,
        formData: {
          rowObjects: {
            data: `{{${create.value}}}`,
          },
          ...this.buildBasicConfig(
            COMMAND_TYPES.INSERT,
            formConfig.tableName,
            formConfig.sheetName,
            formConfig.tableHeaderIndex,
          ),
        },
        dynamicBindingPathList: [
          {
            key: "formData.rowObjects.data",
          },
        ],
      };
    }
  }

  private static createPayload(
    initialValues: GSheetsFormData,
    commandKey: string,
    builtValues: Record<string, object | string> | undefined,
  ) {
    if (!builtValues || isEmpty(builtValues)) {
      return;
    }

    if (!initialValues || isEmpty(initialValues)) {
      return builtValues;
    }

    const allowedInitialValueKeys = [
      ...COMMON_INITIAL_VALUE_KEYS,
      ...(commandKey === "find" ? SELECT_INITAL_VALUE_KEYS : []),
    ];
    const scrubedOutInitialValues = allowedInitialValueKeys
      .filter((key) => initialValues[key as keyof GSheetsFormData])
      .reduce(
        (acc, key) => {
          acc[key] = initialValues[key as keyof GSheetsFormData];
          return acc;
        },
        {} as Record<string, object>,
      );

    const { formData, ...rest } = builtValues;

    return {
      payload: {
        formData: merge({}, scrubedOutInitialValues, formData),
      },
      ...rest,
    };
  }

  static build(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
    pluginInitalValues: { actionConfiguration: ActionConfigurationGSheets },
  ) {
    const configs = [];

    const initialValues = pluginInitalValues?.actionConfiguration?.formData;

    if (widgetConfig.select) {
      configs.push(
        this.createPayload(
          initialValues,
          "find",
          this.buildFind(widgetConfig, formConfig),
        ),
      );
    }
    if (
      widgetConfig.update &&
      formConfig.connectionMode === DatasourceConnectionMode.READ_WRITE
    ) {
      configs.push(
        this.createPayload(
          initialValues,
          "updateMany",
          this.buildUpdate(widgetConfig, formConfig),
        ),
      );
    }
    if (
      widgetConfig.create &&
      formConfig.connectionMode === DatasourceConnectionMode.READ_WRITE
    ) {
      configs.push(
        this.createPayload(
          initialValues,
          "insert",
          this.buildInsert(widgetConfig, formConfig),
        ),
      );
    }

    if (widgetConfig.totalRecord) {
      configs.push(
        this.createPayload(
          initialValues,
          "count",
          this.buildTotalRecord(widgetConfig, formConfig),
        ),
      );
    }

    return configs.filter((val) => !!val);
  }

  static getConnectionMode(
    datasourceConfiguration: DatasourceStorage["datasourceConfiguration"],
  ) {
    return datasourceConfiguration?.authentication?.scopeString?.includes(
      "spreadsheets.readonly",
    )
      ? DatasourceConnectionMode.READ_ONLY
      : DatasourceConnectionMode.READ_WRITE;
  }

  static getTotalRecordExpression(binding: string) {
    return `${binding}.length`;
  }
}
