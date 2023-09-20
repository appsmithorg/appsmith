import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
} from "../utils/anvilTypes";
import LayoutFactory from "./LayoutFactory";
import { CanvasDraggingArena } from "../editor/CanvasArena/CanvasDraggingArena";
import { mapValues } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import { RenderModes } from "constants/WidgetConstants";

// TODO: Move this function to utils directory
export function renderLayouts(
  layouts: LayoutComponentProps[],
  childrenMap: LayoutComponentProps["childrenMap"],
) {
  return layouts.map((layout) => {
    const LayoutComponent = LayoutFactory.get(layout.layoutType);
    return (
      <LayoutComponent
        childrenMap={childrenMap}
        key={layout.layoutId}
        {...layout}
      />
    );
  });
}

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { isDropTarget, rendersWidgets } = props;

    const renderChildren = () => {
      if (rendersWidgets) {
        const widgetsMap = mapValues(props.childrenMap, (widgetProps) =>
          WidgetFactory.createWidget(widgetProps, RenderModes.CANVAS),
        );
        return Component.renderChildren(props, widgetsMap);
      } else {
        return renderLayouts(
          props.layout as LayoutComponentProps[],
          props.childrenMap,
        );
      }
    };

    return (
      <Component {...props}>
        {isDropTarget && (
          <CanvasDraggingArena
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
