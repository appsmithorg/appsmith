import React, { type ReactNode } from "react";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import { type RenderMode, RenderModes } from "constants/WidgetConstants";
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
          key={each.widgetId}
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
