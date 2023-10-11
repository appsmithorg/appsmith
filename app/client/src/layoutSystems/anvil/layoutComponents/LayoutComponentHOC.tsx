import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
  LayoutProps,
} from "../utils/anvilTypes";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";
import { AnvilCanvasDraggingArena } from "../canvasArenas/AnvilCanvasDraggingArena";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";

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
    const mockFn = () => {
      return [
        mockAnvilHighlightInfo({
          posX: 0,
          posY: 10,
          canvasId: "0",
          layoutOrder: [props.layoutId],
          dropZone: {
            top: 20,
            bottom: 20,
            left: 30,
            right: 50,
          },
          // isVertical: true,
        }),
        mockAnvilHighlightInfo({
          posX: 50,
          posY: 10,
          canvasId: "0",
          layoutOrder: [props.layoutId],
          dropZone: {
            top: 20,
            bottom: 20,
            left: 30,
            right: 30,
          },
          // isVertical: true,
        }),
        mockAnvilHighlightInfo({
          posX: 150,
          posY: 10,
          canvasId: "0",
          layoutOrder: [props.layoutId],
          dropZone: {
            top: 20,
            bottom: 20,
            left: 30,
            right: 30,
          },
          // isVertical: true,
        }),
        mockAnvilHighlightInfo({
          posX: 250,
          posY: 10,
          canvasId: "0",
          layoutOrder: [props.layoutId],
          dropZone: {
            top: 20,
            bottom: 20,
            left: 30,
            right: 30,
          },
          isVertical: true,
        }),
        mockAnvilHighlightInfo({
          posX: 350,
          posY: 10,
          canvasId: "0",
          layoutOrder: [props.layoutId],
          dropZone: {
            top: 20,
            bottom: 20,
            left: 30,
            right: 30,
          },
          isVertical: true,
        }),
      ];
    };
    // TODO: Remove hardcoded props by creating new dragging arena for anvil.
    return (
      <Component {...props}>
        {isDropTarget && renderMode === RenderModes.CANVAS && (
          <AnvilCanvasDraggingArena
            allowedWidgetTypes={props.allowedWidgetTypes || []}
            canvasId="0"
            deriveAllHighlightsFn={mockFn}
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
