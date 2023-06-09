import { isEmpty, merge } from "lodash";
import { BaseQueryGenerator } from "WidgetQueryGenerators/BaseQueryGenerator";
import { QUERY_TYPE } from "WidgetQueryGenerators/types";
import type {
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
  GSheetsFormData,
  ActionConfigurationGSheets,
} from "WidgetQueryGenerators/types";

enum COMMAND_TYPES {
  "FIND" = "FETCH_MANY",
  "INSERT" = "INSERT_ONE",
  "UPDATE" = "UPDATE_ONE",
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
      tableHeaderIndex: { data: tableHeaderIndex },
    };
  }
  private static buildFind(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;

    if (select) {
      return {
        type: QUERY_TYPE.SELECT,
        name: "Find_query",
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
          sortBy: {
            data: [
              {
                column: `{{${select["orderBy"]}}}`,
                order: select["sortOrder"],
              },
            ],
          },
          pagination: {
            data: {
              limit: `{{${select["limit"]}}}`,
              offset: `{{${select["offset"]}}}`,
            },
          },
          ...this.buildBasicConfig(
            COMMAND_TYPES.FIND,
            formConfig.tableName,
            formConfig.sheetName,
            formConfig.tableHeaderIndex,
          ),
        },
        dynamicBindingPathList: [
          {
            key: "formData.where.data",
          },
          {
            key: "formData.sortBy.data",
          },
          {
            key: "formData.pagination.data",
          },
        ],
      };
    }
  }

  private static buildTotalRecord(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;

    if (select) {
      return {
        type: QUERY_TYPE.TOTAL_RECORD,
        name: "Total_record_query",
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

    if (update) {
      return {
        type: QUERY_TYPE.UPDATE,
        name: "Update_query",
        //tableHeaderIndex
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

    if (create) {
      return {
        type: QUERY_TYPE.CREATE,
        name: "Insert_query",
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

    const allowedInitalValueKeys = [
      ...COMMON_INITIAL_VALUE_KEYS,
      ...(commandKey === "find" ? SELECT_INITAL_VALUE_KEYS : []),
    ];
    const scrubedOutInitalValues = allowedInitalValueKeys
      .filter((key) => initialValues[key as keyof GSheetsFormData])
      .reduce((acc, key) => {
        acc[key] = initialValues[key as keyof GSheetsFormData];
        return acc;
      }, {} as Record<string, object>);

    const { formData, ...rest } = builtValues;

    return {
      payload: {
        formData: merge({}, scrubedOutInitalValues, formData),
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
    if (widgetConfig.update) {
      configs.push(
        this.createPayload(
          initialValues,
          "updateMany",
          this.buildUpdate(widgetConfig, formConfig),
        ),
      );
    }
    if (widgetConfig.create) {
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

  static getTotalRecordExpression(binding: string) {
    return `${binding}.length`;
  }
}
