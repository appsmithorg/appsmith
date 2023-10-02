import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
} from "../utils/anvilTypes";
import { AutoCanvasDraggingArena } from "layoutSystems/autolayout/editor/AutoLayoutCanvasArenas/AutoCanvasDraggingArena";
import { renderLayouts } from "../utils/layouts/renderUtils";

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { isDropTarget } = props;

    const renderChildren = () => {
      if (Component.rendersWidgets(props)) {
        return Component.renderChildWidgets(props);
      } else {
        return renderLayouts(
          props.layout as LayoutComponentProps[],
          props.childrenMap,
        );
      }
    };

    // TODO: Remove hardcoded props by creating new dragging arena for anvil.
    return (
      <Component {...props}>
        {isDropTarget && (
          <AutoCanvasDraggingArena
            canExtend
            snapColumnSpace={18.40625}
            snapRowSpace={10}
            snapRows={129}
            widgetId="0"
            {...props}
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
