import { BaseQueryGenerator } from "../BaseQueryGenerator";
import type {
  ActionConfigurationSQL,
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
} from "../types";
import { QUERY_TYPE } from "../types";
import { removeSpecialChars } from "utils/helpers";
import without from "lodash/without";
import { DatasourceConnectionMode } from "entities/Datasource";

export default abstract class MSSQL extends BaseQueryGenerator {
  private static async buildSelect(
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
        template: "SELECT * FROM ?",
        params: [formConfig.tableName],
      },
      {
        isValuePresent: formConfig.searchableColumn && where,
        template: "WHERE ? LIKE ?",
        params: [formConfig.searchableColumn, `'%{{${where}}}%'`],
      },
      formConfig.primaryColumn
        ? {
            isValuePresent: orderBy,
            template: `ORDER BY ? ?`,
            params: [
              `{{${orderBy} || '${formConfig.primaryColumn}'}}`,
              `{{${sortOrder} ? "" : "DESC"}}`,
            ],
          }
        : {
            isValuePresent: orderBy,
            template: "?",
            params: [
              `{{${orderBy} ? "ORDER BY " + ${orderBy} + "  " + (${sortOrder} ? "" : "DESC") : ""}}`,
            ],
          },
      {
        isValuePresent: offset,
        template: "OFFSET ? ROWS",
        params: [`{{${offset}}}`],
      },
      {
        isValuePresent: limit,
        template: "FETCH NEXT ? ROWS ONLY",
        params: [`{{${limit}}}`],
      },
    ];

    const { params, template } = querySegments
      // Filter out query segments which are not defined
      .filter(({ isValuePresent }) => !!isValuePresent)
      .reduce(
        (acc, curr) => {
          const { params, template } = curr;

          return {
            template: acc.template + " " + template,
            params: [...acc.params, ...params],
          };
        },
        { template: "", params: [] } as { template: string; params: string[] },
      );

    const { formatDialect, sql } = await import("sql-formatter");

    //formats sql string
    const res = formatDialect(template, {
      params,
      dialect: sql,
    });

    return {
      type: QUERY_TYPE.SELECT,
      name: `Select_${removeSpecialChars(formConfig.tableName)}`,
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

    const columns = without(
      formConfig.columns.map((d) => d.name),
      formConfig.primaryColumn,
    );

    return {
      type: QUERY_TYPE.UPDATE,
      name: `Update_${removeSpecialChars(formConfig.tableName)}`,
      payload: {
        body: `UPDATE ${formConfig.tableName} SET ${columns
          .map((column) => `${column}= '{{${value}.${column}}}'`)
          .join(", ")} WHERE ${formConfig.primaryColumn}= '{{${where}.${
          formConfig.dataIdentifier
        }}}';`,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
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

    const columns = without(
      formConfig.columns.map((d) => d.name),
      formConfig.primaryColumn,
    );

    return {
      type: QUERY_TYPE.CREATE,
      name: `Insert_${removeSpecialChars(formConfig.tableName)}`,
      payload: {
        body: `INSERT INTO ${formConfig.tableName} (${columns.map(
          (a) => `${a}`,
        )}) VALUES (${columns
          .map((d) => `'{{${create.value}.${d}}}'`)
          .toString()})`,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
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
      name: `Total_record_${removeSpecialChars(formConfig.tableName)}`,
      payload: {
        body: `SELECT COUNT(*) from ${formConfig.tableName}${
          formConfig.searchableColumn
            ? ` WHERE ${formConfig.searchableColumn} LIKE '%{{${select?.where}}}%'`
            : ""
        };`,
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
    };
  }

  public static async build(
    widgetConfig: WidgetQueryGenerationConfig,
    formConfig: WidgetQueryGenerationFormConfig,
    pluginInitalValues: { actionConfiguration: ActionConfigurationSQL },
  ) {
    const allBuildConfigs = [];

    if (widgetConfig.select) {
      allBuildConfigs.push(await this.buildSelect(widgetConfig, formConfig));
    }

    if (
      widgetConfig.update &&
      formConfig.primaryColumn &&
      formConfig.connectionMode === DatasourceConnectionMode.READ_WRITE
    ) {
      allBuildConfigs.push(this.buildUpdate(widgetConfig, formConfig));
    }

    if (
      widgetConfig.create &&
      formConfig.primaryColumn &&
      formConfig.connectionMode === DatasourceConnectionMode.READ_WRITE
    ) {
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
