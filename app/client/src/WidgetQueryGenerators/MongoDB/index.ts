import { isEmpty, merge } from "lodash";
import { BaseQueryGenerator } from "WidgetQueryGenerators/BaseQueryGenerator";
import { QUERY_TYPE } from "WidgetQueryGenerators/types";
import type {
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
  ActionConfigurationMongoDB,
  MongoDBFormData,
} from "WidgetQueryGenerators/types";
import { removeSpecialChars } from "utils/helpers";

enum COMMAND_TYPES {
  "FIND" = "FIND",
  "INSERT" = "INSERT",
  "UPDATE" = "UPDATE",
  "COUNT" = "COUNT",
}
const ALLOWED_INITAL_VALUE_KEYS = ["aggregate", "smartSubstitution"];

export default abstract class MongoDB extends BaseQueryGenerator {
  private static buildBasicConfig(command: COMMAND_TYPES, tableName: string) {
    return { command: { data: command }, collection: { data: tableName } };
  }

  private static buildFind(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;

    if (select) {
      return {
        type: QUERY_TYPE.SELECT,
        name: `Find_${removeSpecialChars(formConfig.tableName)}`,
        formData: {
          find: {
            skip: { data: `{{${select["offset"]}}}` },
            query: {
              data: formConfig.searchableColumn
                ? `{{{ ${formConfig.searchableColumn}: {$regex: ${select["where"]}} }}}`
                : "",
            },
            sort: {
              data: `{{ ${select["orderBy"]} ? { [${select["orderBy"]}]: ${select["sortOrder"]} ? 1 : -1 } : {}}}`,
            },
            limit: { data: `{{${select["limit"]}}}` },
          },
          ...this.buildBasicConfig(COMMAND_TYPES.FIND, formConfig.tableName),
        },
        dynamicBindingPathList: [
          {
            key: "formData.find.skip.data",
          },
          {
            key: "formData.find.query.data",
          },
          {
            key: "formData.find.sort.data",
          },
          {
            key: "formData.find.limit.data",
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
        name: `Total_record_${removeSpecialChars(formConfig.tableName)}`,
        formData: {
          count: {
            query: {
              data: formConfig.searchableColumn
                ? `{{{ ${formConfig.searchableColumn}: {$regex: ${select["where"]}} }}}`
                : "",
            },
          },
          ...this.buildBasicConfig(COMMAND_TYPES.COUNT, formConfig.tableName),
        },
        dynamicBindingPathList: [
          {
            key: "formData.count.query.data",
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
        name: `Update_${removeSpecialChars(formConfig.tableName)}`,
        formData: {
          updateMany: {
            query: { data: `{_id: ObjectId('{{${update.where}._id}}')}` },
            update: { data: `{{{$set: _.omit(${update.value}, "_id")}}}` },
          },
          ...this.buildBasicConfig(COMMAND_TYPES.UPDATE, formConfig.tableName),
        },
        dynamicBindingPathList: [
          {
            key: "formData.updateMany.query.data",
          },
          {
            key: "formData.updateMany.update.data",
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
        name: `Insert_${removeSpecialChars(formConfig.tableName)}`,
        formData: {
          insert: {
            documents: { data: `{{${create.value}}}` },
          },
          ...this.buildBasicConfig(COMMAND_TYPES.INSERT, formConfig.tableName),
        },
        dynamicBindingPathList: [
          {
            key: "formData.insert.documents.data",
          },
        ],
      };
    }
  }

  private static createPayload(
    initialValues: MongoDBFormData,
    commandKey: string,
    builtValues: Record<string, object | string> | undefined,
  ) {
    if (!builtValues || isEmpty(builtValues)) {
      return;
    }

    if (!initialValues || isEmpty(initialValues)) {
      return builtValues;
    }

    const scrubedOutInitalValues = [...ALLOWED_INITAL_VALUE_KEYS, commandKey]
      .filter((key) => initialValues[key as keyof MongoDBFormData])
      .reduce((acc, key) => {
        acc[key] = initialValues[key as keyof MongoDBFormData];
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
    pluginInitalValues: { actionConfiguration: ActionConfigurationMongoDB },
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
    return `${binding}.n`;
  }
}
