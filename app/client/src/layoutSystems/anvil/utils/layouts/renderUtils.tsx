import React from "react";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type { LayoutComponent, LayoutComponentProps } from "../anvilTypes";
import WidgetFactory from "WidgetProvider/factory";
import { RenderModes } from "constants/WidgetConstants";

export function renderWidgets(
  widgets: string[],
  childrenMap: LayoutComponentProps["childrenMap"] = {},
  renderMode: RenderModes = RenderModes.CANVAS,
) {
  return widgets.map((widgetId) => {
    return WidgetFactory.createWidget(childrenMap[widgetId], renderMode);
  });
}

/**
 * Renders a list of layout components.
 * @param layouts | LayoutComponentProps[]
 * @param childrenMap | Record<string, WidgetProps>
 * @returns ReactNode
 */
export function renderLayouts(
  layouts: LayoutComponentProps[],
  childrenMap: LayoutComponentProps["childrenMap"],
) {
  return layouts.map((layout) => {
    const Component: LayoutComponent = LayoutFactory.get(layout.layoutType);
    return (
      <Component
        childrenMap={getChildrenMap(layout, childrenMap)}
        key={layout.layoutId}
        {...layout}
      />
    );
  });
}

/**
 * Filters childrenMap by parsing given layout
 * to construct a map of only those widgets
 * that are rendered by this layout or its child layouts.
 * @param layoutProps | LayoutComponentProps
 * @param map | Record<string, WidgetProps>
 * @param res | Record<string, WidgetProps>
 * @returns Record<string, WidgetProps>
 */
function getChildrenMap(
  layoutProps: LayoutComponentProps,
  map: LayoutComponentProps["childrenMap"],
  res: LayoutComponentProps["childrenMap"] = {},
): LayoutComponentProps["childrenMap"] {
  if (!layoutProps || !map) return res;
  const { layout } = layoutProps;
  if (!layout || !layout.length) return res;

  // Parse each item of layout.
  for (const each of layout) {
    // if type === string => each is a widgetId.
    if (typeof each === "string") {
      // add widget to the resultant map.
      res[each] = map[each];
    } else if (Array.isArray(each)) {
      // if type === array => each could be a list of widgetIDs.
      // ASSUMPTION: AlignedRow will only render widgets.
      for (const id of each) {
        res[id] = map[id];
      }
    } else {
      getChildrenMap(each, map, res);
    }
  }
  return res;
}
