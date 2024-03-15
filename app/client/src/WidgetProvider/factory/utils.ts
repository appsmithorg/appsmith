import { memoize } from "lodash";
import type { WidgetType } from ".";
import WidgetFactory from ".";

export const checkIsDropTarget = memoize(function isDropTarget(
  type: WidgetType,
) {
  return !!WidgetFactory.widgetConfigMap.get(type)?.isCanvas;
});
