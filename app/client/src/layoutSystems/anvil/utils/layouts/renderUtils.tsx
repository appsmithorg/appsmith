import React, { type ReactNode } from "react";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import { type RenderMode, RenderModes } from "constants/WidgetConstants";
import { isFillWidgetPresentInList } from "./widgetUtils";
import { AlignmentIndexMap, MOBILE_BREAKPOINT } from "../constants";
import {
  FlexLayout,
  type FlexLayoutProps,
} from "layoutSystems/anvil/layoutComponents/components/FlexLayout";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import { WidgetRenderer } from "layoutSystems/anvil/layoutComponents/WidgetRenderer";

/**
 *
 * @param props | LayoutComponentProps : Component properties of a layout.
 * @param startIndex | number (optional) : The index of the first child.
 * @returns  List of rendered child widgets
 */
export function renderWidgets(props: LayoutComponentProps, startIndex = 0) {
  const { canvasId, layout, parentDropTarget, renderMode } = props;
  /**
   * startIndex is needed because AlignedWidgetRow uses three child Rows to render it's widgets.
   * startIndex is used to correctly determine the index of a widget in the layout.
   */
  const arr: ReactNode[] = (layout as WidgetLayoutProps[])
    .map((each: WidgetLayoutProps, index: number) => {
      return (
        <WidgetRenderer
          canvasId={canvasId}
          key={index + startIndex}
          parentDropTarget={parentDropTarget}
          renderMode={(renderMode as RenderModes) || RenderModes.CANVAS}
          rowIndex={index + startIndex}
          widgetId={each.widgetId}
        />
      );
    })
    .filter(Boolean);
  return arr;
}

/**
 * Renders a list of layout components.
 * @param layouts | LayoutProps[]
 * @param childrenMap | Record<string, WidgetProps>
 * @returns ReactNode
 */
export function renderLayouts(
  layouts: LayoutProps[],
  canvasId: string,
  parentDropTarget: string,
  renderMode: RenderMode = RenderModes.CANVAS,
  layoutOrder: string[],
): JSX.Element[] {
  return layouts.map((layout: LayoutProps, index: number) => {
    const Component: typeof BaseLayoutComponent = LayoutFactory.get(
      layout.layoutType,
    );
    return (
      <Component
        {...layout}
        canvasId={canvasId}
        key={layout.layoutId}
        layoutIndex={index}
        layoutOrder={layoutOrder}
        parentDropTarget={
          layout.isDropTarget ? layout.layoutId : parentDropTarget
        }
        renderMode={renderMode}
      />
    );
  });
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
  const { canvasId, layout, layoutId } = props;
  // check if layout renders a Fill widget.
  const hasFillWidget: boolean = isFillWidgetPresentInList(
    layout as WidgetLayoutProps[],
  );

  // If a Fill widget exists, then render the child widgets together.
  if (hasFillWidget) {
    return renderWidgets(props);
  }

  /**
   * else render the child widgets separately
   * in their respective alignments.
   */
  const commonProps: Omit<
    FlexLayoutProps,
    "children" | "layoutId" | "layoutIndex"
  > = {
    alignSelf: "stretch",
    canvasId,
    columnGap: "4px",
    direction: "row",
    flexBasis: { base: "auto", [`${MOBILE_BREAKPOINT}px`]: "0%" },
    flexGrow: 1,
    flexShrink: 1,
    parentDropTarget: props.parentDropTarget,
    renderMode: props.renderMode,
    wrap: { base: "wrap", [`${MOBILE_BREAKPOINT}px`]: "nowrap" },
  };

  const startChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.Start,
  );
  const centerChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.Center,
  );
  const endChildren: WidgetLayoutProps[] = (
    layout as WidgetLayoutProps[]
  ).filter(
    (each: WidgetLayoutProps) => each.alignment === FlexLayerAlignment.End,
  );

  // TODO: After positionObserver integration,
  // check if use of FlexLayout is causing performance or other issues.
  // WDS Flex can be used as a replacement.
  return [
    <FlexLayout
      {...commonProps}
      justifyContent="start"
      key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Start]}`}
      layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Start]}`}
      layoutIndex={AlignmentIndexMap[FlexLayerAlignment.Start]}
    >
      {renderWidgets({
        ...props,
        layout: startChildren,
      })}
    </FlexLayout>,
    <FlexLayout
      {...commonProps}
      justifyContent="center"
      key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Center]}`}
      layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.Center]}`}
      layoutIndex={AlignmentIndexMap[FlexLayerAlignment.Start]}
    >
      {renderWidgets(
        {
          ...props,
          layout: centerChildren,
        },
        startChildren?.length,
      )}
    </FlexLayout>,
    <FlexLayout
      {...commonProps}
      justifyContent="end"
      key={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.End]}`}
      layoutId={`${layoutId}-${AlignmentIndexMap[FlexLayerAlignment.End]}`}
      layoutIndex={AlignmentIndexMap[FlexLayerAlignment.End]}
    >
      {renderWidgets(
        {
          ...props,
          layout: endChildren,
        },
        startChildren?.length + centerChildren?.length,
      )}
    </FlexLayout>,
  ];
}
