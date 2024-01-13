import WidgetFactory from "WidgetProvider/factory";
import type { WidgetType } from "constants/WidgetConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetLayoutProps } from "../anvilTypes";

/**
 * Check from widget configuration if the widget is a Fill widget.
 * @param type | string
 * @returns boolean
 */
export function isFillWidgetType(type: WidgetType): boolean {
  if (!type) return false;
  const widgetConfig = WidgetFactory.getConfig(type);
  return widgetConfig?.responsiveBehavior === ResponsiveBehavior.Fill;
}

/**
 * Check if a list of widgets (widget props) includes a Fill widget.
 * @param children | WidgetProps[]
 * @returns boolean
 */
export function isFillWidgetPresentInList(
  children: WidgetLayoutProps[],
): boolean {
  if (!children || !children?.length) return false;
  return children.some(
    (child: WidgetLayoutProps) => child && isFillWidgetType(child.widgetType),
  );
}
