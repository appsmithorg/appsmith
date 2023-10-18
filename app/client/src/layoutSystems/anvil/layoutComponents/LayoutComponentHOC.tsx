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
import type { LayoutElementPositions } from "layoutSystems/common/types";

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutOrder,
      parentDropTarget,
      renderMode,
    } = props;

    const renderChildren = () => {
      if (Component.rendersWidgets(props)) {
        return Component.renderChildWidgets(props);
      } else {
        return renderLayouts(
          props.layout as LayoutProps[],
          props.childrenMap,
          canvasId,
          parentDropTarget,
          renderMode,
          layoutOrder,
        );
      }
    };
    const deriveAllHighlightsFn = (
      layoutElementPositions: LayoutElementPositions,
      draggedWidgets: DraggedWidget[],
    ) => {
      return Component.deriveHighlights(
        props,
        layoutElementPositions,
        canvasId,
        draggedWidgets,
        layoutOrder,
        parentDropTarget,
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
