import { get } from "lodash";

import type { ButtonGroupWidgetProps } from ".";
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
  props: ButtonGroupWidgetProps,
  propertyPath: string,
  widgetStylesheet?: Stylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];

  return get(widgetStylesheet, `childStylesheet.button.${propertyName}`, "");
};

// The isIconNamePresent function checks if an icon name is defined
// for a button or menu item within a ButtonGroupWidget. It extracts the relevant button or menu item based on the provided property path and menu item flag.
// The function returns true if the icon name is present and false if it is not  present.

export const isIconNamePresent = (
  props: ButtonGroupWidgetProps,
  propertyPath: string,
  isMenuItem: boolean = false,
): boolean => {
  const pathArray = propertyPath.split(".");
  const buttonKey = pathArray[pathArray.length - (isMenuItem ? 4 : 2)];
  const button = props.groupButtons[buttonKey];
  const menuItem = isMenuItem
    ? button?.menuItems?.[pathArray[pathArray.length - 2]]
    : null;
  return !!(isMenuItem ? menuItem?.iconName : button?.iconName);
};
