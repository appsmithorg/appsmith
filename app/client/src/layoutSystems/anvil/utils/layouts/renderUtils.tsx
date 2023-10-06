import React from "react";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  LayoutComponent,
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import WidgetFactory from "WidgetProvider/factory";
import { type RenderMode, RenderModes } from "constants/WidgetConstants";
import { isFillWidgetPresentInList } from "./widgetUtils";
import { MOBILE_BREAKPOINT } from "../constants";
import {
  FlexLayout,
  type FlexLayoutProps,
} from "layoutSystems/anvil/layoutComponents/components/FlexLayout";
import { extractWidgetIdsFromLayoutProps } from "./layoutUtils";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { isWidgetLayoutProps } from "./typeUtils";

export function renderWidgets(
  widgets: string[],
  childrenMap: LayoutComponentProps["childrenMap"] = {},
  renderMode: RenderMode = RenderModes.CANVAS,
) {
  return widgets.map((widgetId) => {
    return WidgetFactory.createWidget(childrenMap[widgetId], renderMode);
  });
}

/**
 * Renders a list of layout components.
 * @param layouts | LayoutProps[]
 * @param childrenMap | Record<string, WidgetProps>
 * @returns ReactNode
 */
export function renderLayouts(
  layouts: LayoutProps[],
  childrenMap: LayoutComponentProps["childrenMap"],
  canvasId: string,
  renderMode: RenderMode = RenderModes.CANVAS,
): JSX.Element[] {
  return layouts.map((layout) => {
    const Component: LayoutComponent = LayoutFactory.get(layout.layoutType);
    return (
      <Component
        {...layout}
        canvasId={canvasId}
        childrenMap={getChildrenMap(layout, childrenMap)}
        key={layout.layoutId}
        renderMode={renderMode}
      />
    );
  });
}

/**
 * Filters childrenMap by parsing given layout
 * to construct a map of only those widgets
 * that are rendered by this layout or its child layouts.
 * @param layoutProps | LayoutProps
 * @param map | Record<string, WidgetProps>
 * @param res | Record<string, WidgetProps>
 * @returns Record<string, WidgetProps>
 */
export function getChildrenMap(
  layoutProps: LayoutProps,
  map: LayoutComponentProps["childrenMap"],
  res: LayoutComponentProps["childrenMap"] = {},
): LayoutComponentProps["childrenMap"] {
  if (!layoutProps || !map) return res;
  const { layout } = layoutProps;
  if (!layout || !layout.length) return res;

  // Parse each item of layout.
  for (const each of layout) {
    // if each is a widgetId.
    if (isWidgetLayoutProps(each)) {
      // add widget to the resultant map.
      res[(each as WidgetLayoutProps).widgetId] =
        map[(each as WidgetLayoutProps).widgetId];
    } else {
      getChildrenMap(each as LayoutProps, map, res);
    }
  }
  return res;
}

/**
 * If AlignedRow hasFillWidget:
 * then render all children directly within the AlignedRow (row / flex-start / wrap);
 * no need for alignments.
 *
 * Else:
 * render children in 3 alignments: start, center and end.
 * Each alignment has following characteristics:
 * 1. Mobile viewport:
 *   - flex-wrap: wrap.
 *   - flex-basis: auto.
 *   ~ This ensures the alignment takes up as much space as needed by the children.
 *   ~ It can stretch to the full width of the viewport.
 *   ~ or collapse completely if there is no content.
 *
 * 2. Larger view ports:
 *  - flex-wrap: nowrap.
 *  - flex-basis: 0%.
 *  ~ This ensures that alignments share the total space equally, until possible.
 *  ~ Soon as the content in any alignment needs more space, it will wrap to the next line
 *    thanks to flex wrap in the parent layout.
 */
export function renderWidgetsInAlignedRow(
  props: LayoutComponentProps,
): React.ReactNode {
  const { canvasId, childrenMap, layoutId, renderMode } = props;
  // check if layout renders a Fill widget.
  const hasFillWidget: boolean = isFillWidgetPresentInList(
    Object.values(childrenMap || {}),
  );
  const mode: RenderMode = renderMode || RenderModes.CANVAS;
  // If a Fill widget exists, then render the child widgets together.
  if (hasFillWidget) {
    return renderWidgets(
      extractWidgetIdsFromLayoutProps(props),
      childrenMap,
      mode,
    );
  }

  /**
   * else render the child widgets separately
   * in their respective alignments.
   */
  const layout: WidgetLayoutProps[] = props.layout as WidgetLayoutProps[];
  const commonProps: Omit<FlexLayoutProps, "children" | "layoutId"> = {
    alignSelf: "stretch",
    canvasId,
    columnGap: "4px",
    direction: "row",
    flexBasis: { base: "auto", [`${MOBILE_BREAKPOINT}px`]: "0%" },
    flexGrow: 1,
    flexShrink: 1,
    wrap: { base: "wrap", [`${MOBILE_BREAKPOINT}px`]: "nowrap" },
  };

  // TODO: After positionObserver integration,
  // check if use of FlexLayout is causing performance or other issues.
  // WDS Flex can be used as a replacement.
  return [
    <FlexLayout
      {...commonProps}
      justifyContent="start"
      key={`${layoutId}-0`}
      layoutId={`${layoutId}-0`}
    >
      {renderWidgets(
        extractWidgetsForAlignment(layout, FlexLayerAlignment.Start),
        childrenMap,
        mode,
      )}
    </FlexLayout>,
    <FlexLayout
      {...commonProps}
      justifyContent="center"
      key={`${layoutId}-1`}
      layoutId={`${layoutId}-1`}
    >
      {renderWidgets(
        extractWidgetsForAlignment(layout, FlexLayerAlignment.Center),
        childrenMap,
        mode,
      )}
    </FlexLayout>,
    <FlexLayout
      {...commonProps}
      justifyContent="end"
      key={`${layoutId}-2`}
      layoutId={`${layoutId}-2`}
    >
      {renderWidgets(
        extractWidgetsForAlignment(layout, FlexLayerAlignment.End),
        childrenMap,
        mode,
      )}
    </FlexLayout>,
  ];
}

/**
 * Filter out widgetIds that belong to the target alignment.
 * @param layout | WidgetLayoutProps[] : List of widgets
 * @param alignment | FlexLayerAlignment : target alignment
 * @returns string[] : List of widget ids.
 */
function extractWidgetsForAlignment(
  layout: WidgetLayoutProps[],
  alignment: FlexLayerAlignment,
): string[] {
  if (!layout || !layout.length) return [];
  return layout
    .filter((each: WidgetLayoutProps) => each.alignment === alignment)
    .map((each: WidgetLayoutProps) => each.widgetId);
}
