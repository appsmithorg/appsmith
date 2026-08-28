import { get } from "lodash";

import type { Stylesheet } from "entities/AppTheming";
import type { CardWidgetProps } from "../../constants";

/**
 * Getter for the stylesheet value of a footer action property
 * (mirrors ButtonGroupWidget's getStylesheetValue helper).
 */
export const getFooterActionStylesheetValue = (
  props: CardWidgetProps,
  propertyPath: string,
  widgetStylesheet?: Stylesheet,
) => {
  const propertyName = propertyPath.split(".").slice(-1)[0];

  return get(
    widgetStylesheet,
    `childStylesheet.footerAction.${propertyName}`,
    "",
  );
};
