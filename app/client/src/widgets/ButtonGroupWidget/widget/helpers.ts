import type { Stylesheet } from "entities/AppTheming";
import { get } from "lodash";

import type { ButtonGroupWidgetProps } from ".";

/**
 * this is a getter function to get stylesheet value of the property from the config
 *
 * @param props
 * @param propertyPath
 * @param widgetStylesheet
 * @returns
 */
export const getStylesheetValue = (
  props: ButtonGroupWidgetProps,
  propertyPath: string,
  widgetStylesheet?: Stylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];

  return get(widgetStylesheet, `childStylesheet.button.${propertyName}`, "");
};
