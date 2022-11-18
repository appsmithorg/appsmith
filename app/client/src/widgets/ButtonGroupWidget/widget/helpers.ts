import { get } from "lodash";

import { ButtonGroupWidgetProps } from ".";
import { AppThemeStylesheet } from "entities/AppTheming";

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
  widgetStylesheet?: AppThemeStylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];

  return get(widgetStylesheet, `childStylesheet.button.${propertyName}`, "");
};
