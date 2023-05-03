import { BaseQueryGenerator } from "../BaseQueryGenerator";
import { format } from "sql-formatter";
import { QUERY_TYPE } from "../types";
import type {
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
  ActionConfigurationPostgreSQL,
} from "../types";

export default abstract class PostgreSQL extends BaseQueryGenerator {
  private static buildSelect(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select } = widgetConfig;
    //if no table name do not build query
    if (!select || !formConfig.tableName) {
      return;
    }

    const { limit, offset, orderBy, sortOrder, where } = select;

    const querySegments = [
      {
        isValuePresent: formConfig.tableName,
        template: "SELECT * FROM $1",
        params: {
          1: formConfig.tableName,
        },
      },
      {
        isValuePresent: formConfig.searchableColumn && where,
        template: "WHERE $2 ilike $3",
        params: {
          2: `"${formConfig.searchableColumn}"`,
          3: `'%{{${where}}}%'`,
        },
      },
      {
        isValuePresent: orderBy,
        template: "ORDER BY $4 $5",
        params: {
          4: `"{{${orderBy} || '${formConfig.primaryColumn}'}}"`,
          5: `{{${sortOrder} ? "" : "DESC"}}`,
        },
      },
      {
        isValuePresent: limit,
        template: "LIMIT $6",
        params: {
          6: `{{${limit}}}`,
        },
      },
      {
        isValuePresent: offset,
        template: "OFFSET $7",
        params: {
          7: `{{${offset}}}`,
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
      type: QUERY_TYPE.SELECT,
      name: "Select_query",
      payload: {
        body: res,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
    };
  }

  private static buildUpdate(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { update } = widgetConfig;
    //if no table name do not build query
    if (!update || !update.where || !formConfig.tableName) {
      return;
    }

    const { value, where } = update;

    return {
      type: QUERY_TYPE.UPDATE,
      name: "Update_query",
      payload: {
        body: `UPDATE ${formConfig.tableName} SET ${formConfig.columns
          .map((column) => `"${column}"= '{{${value}.${column}}}'`)
          .join(", ")} WHERE "${formConfig.primaryColumn}"= {{${where}.${
          formConfig.primaryColumn
        }}};`,
      },
    };
  }

  private static buildInsert(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { create } = widgetConfig;
    //if no table name do not build query
    if (!create || !create.value || !formConfig.tableName) {
      return;
    }

    return {
      type: QUERY_TYPE.CREATE,
      name: "Insert_query",
      payload: {
        body: `INSERT INTO ${formConfig.tableName} (${formConfig.columns.map(
          (a) => `"${a}"`,
        )}) VALUES (${formConfig.columns
          .map((d) => `'{{${create.value}.${d}}}'`)
          .toString()})`,
      },
    };
  }

  private static buildTotal(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
  ) {
    const { select, totalRecord } = widgetConfig;
    //if no table name do not build query
    if (!totalRecord) {
      return;
    }

    return {
      type: QUERY_TYPE.TOTAL_RECORD,
      name: "Total_record_query",
      payload: {
        body: `SELECT COUNT(*) from ${formConfig.tableName}${
          formConfig.searchableColumn
            ? ` where ${formConfig.searchableColumn} ilike '%{{${select?.where}}}%'`
            : ""
        };`,
      },
    };
  }

  public static build(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
    pluginInitalValues: { actionConfiguration: ActionConfigurationPostgreSQL },
  ) {
    const allBuildConfigs = [];
    if (widgetConfig.select) {
      allBuildConfigs.push(this.buildSelect(widgetConfig, formConfig));
    }
    if (widgetConfig.update) {
      allBuildConfigs.push(this.buildUpdate(widgetConfig, formConfig));
    }
    if (widgetConfig.create) {
      allBuildConfigs.push(this.buildInsert(widgetConfig, formConfig));
    }

    if (widgetConfig.totalRecord) {
      allBuildConfigs.push(this.buildTotal(widgetConfig, formConfig));
    }

    return allBuildConfigs
      .filter((val) => !!val)
      .map((val) => ({
        ...val,
        payload: {
          ...(val?.payload || {}),
          ...(pluginInitalValues?.actionConfiguration || {}),
          pluginSpecifiedTemplates: [
            {
              value: false,
            },
          ],
        },
      }));
  }

  static getTotalRecordExpression(binding: string) {
    return `${binding}[0].count`;
  }
}
