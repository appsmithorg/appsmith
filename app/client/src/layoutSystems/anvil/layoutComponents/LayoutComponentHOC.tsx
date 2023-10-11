import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
  LayoutProps,
} from "../utils/anvilTypes";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import { AnvilCanvasDraggingArena } from "../canvasArenas/AnvilCanvasDraggingArena";

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { canvasId, isDropTarget, renderMode } = props;

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
    Component.deriveHighlights;
    // TODO: Remove hardcoded props by creating new dragging arena for anvil.
    return (
      <Component {...props}>
        {isDropTarget && renderMode === RenderModes.CANVAS && (
          <AnvilCanvasDraggingArena
            canvasId="0"
            deriveAllHighlightsFn={Component.deriveHighlights}
            layoutId="0"
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
