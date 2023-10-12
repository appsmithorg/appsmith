import React from "react";
import type {
  DraggedWidget,
  LayoutComponent,
  LayoutComponentProps,
  LayoutProps,
} from "../utils/anvilTypes";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import { AnvilCanvasDraggingArena } from "../canvasArenas/AnvilCanvasDraggingArena";
import type { WidgetPositions } from "layoutSystems/common/types";

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { canvasId, isDropTarget, layoutId, renderMode } = props;

    const renderChildren = () => {
      if (Component.rendersWidgets(props)) {
        return Component.renderChildWidgets(props);
      } else {
        return renderLayouts(
          props.layout as LayoutProps[],
          props.childrenMap,
          canvasId,
          renderMode,
        );
      }
    };
    const deriveAllHighlightsFn = (
      widgetPositions: WidgetPositions,
      draggedWidgets: DraggedWidget[],
    ) => {
      return Component.deriveHighlights(
        props,
        widgetPositions,
        canvasId,
        draggedWidgets,
      );
    };
    // TODO: Remove hardcoded props by creating new dragging arena for anvil.
    return (
      <Component {...props}>
        {isDropTarget && renderMode === RenderModes.CANVAS && (
          <AnvilCanvasDraggingArena
            allowedWidgetTypes={props.allowedWidgetTypes || []}
            canvasId={canvasId}
            deriveAllHighlightsFn={deriveAllHighlightsFn}
            layoutId={layoutId}
          />
        )}
        {renderChildren()}
      </Component>
    );
  };

  // Copy over static properties from LayoutComponent to enhancedLayoutComponent
  Object.assign(enhancedLayoutComponent, Component);

  return enhancedLayoutComponent;
}
