import { AppTheme } from "entities/AppTheming";
import { TableWidgetProps } from "../constants";
import { get } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";

/**
 * this is a getter function to get stylesheet value of the property from the config
 *
 * @param props
 * @param propertyPath
 * @param widgetStylesheet
 * @returns
 */
export const getStylesheetValue = (
  props: TableWidgetProps,
  propertyPath: string,
  widgetStylesheet?: AppTheme["stylesheet"][string],
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];
  const columnName = propertyPath.split(".").slice(-2)[0];
  const columnType = get(props, `primaryColumns.${columnName}.columnType`);

  return get(widgetStylesheet, `childStylesheet.${columnType}.${propertyName}`);
};

/**
 * this is a getter function to get stylesheet value of the property from the config
 *
 * @param props
 * @param propertyPath
 * @param widgetStylesheet
 * @returns
 */
export const getPrimaryColumnStylesheetValue = (
  props: TableWidgetProps,
  propertyPath: string,
  widgetStylesheet?: AppTheme["stylesheet"][string],
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];
  const columnName = propertyPath.split(".").slice(-2)[0];
  const columnType = get(props, `primaryColumns.${columnName}.columnType`);
  const themeStylesheetValue: any = get(
    widgetStylesheet,
    `childStylesheet.${columnType}.${propertyName}`,
  );

  const { jsSnippets, stringSegments } = getDynamicBindings(
    themeStylesheetValue,
  );

  const js = combineDynamicBindings(jsSnippets, stringSegments);

  return `{{${props.widgetName}.sanitizedTableData.map((currentRow) => ( ${js}))}}`;
};
