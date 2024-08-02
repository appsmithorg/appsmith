import type { TableWidgetProps } from "../constants";
import { get } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import type { Stylesheet } from "entities/AppTheming";

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
  widgetStylesheet?: Stylesheet,
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
  widgetStylesheet?: Stylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];
  const columnName = propertyPath.split(".").slice(-2)[0];
  const columnType = get(props, `primaryColumns.${columnName}.columnType`);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themeStylesheetValue: any = get(
    widgetStylesheet,
    `childStylesheet.${columnType}.${propertyName}`,
  );

  const { jsSnippets, stringSegments } =
    getDynamicBindings(themeStylesheetValue);

  const js = combineDynamicBindings(jsSnippets, stringSegments);

  return `{{${props.widgetName}.sanitizedTableData.map((currentRow) => ( ${js}))}}`;
};
