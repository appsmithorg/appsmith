import type {
  WidgetPosition,
  WidgetPositions,
} from "layoutSystems/common/types";

/**
 *
 * @param id | string : widget or layout id.
 * @param parentLayoutId | string : layout id of drop target ancestor.
 * @param widgetPositions | WidgetPositions : positions and dimensions of widgets and layouts.
 * @returns WidgetPosition : Position and dimension of target widget / layout wrt to parent drop target layout.
 */
export const getRelativeDimensions =
  (parentLayoutId: string, widgetPositions: WidgetPositions) =>
  (id: string): WidgetPosition => {
    const curr: WidgetPosition = widgetPositions[id];
    const parent: WidgetPosition = widgetPositions[parentLayoutId];

    return {
      ...curr,
      top: curr.top - parent.top,
      left: curr.left - parent.left,
    };
  };
