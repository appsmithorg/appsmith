import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
} from "../utils/anvilTypes";
import LayoutFactory from "./LayoutFactory";
import { CanvasDraggingArena } from "../editor/CanvasArena/CanvasDraggingArena";

// TODO: Move this function to utils directory
export function renderLayouts(layouts: LayoutComponentProps[]) {
  return layouts.map((layout) => {
    const LayoutComponent = LayoutFactory.get(layout.layoutType);
    return <LayoutComponent key={layout.layoutId} {...layout} />;
  });
}

export function LayoutComponentHOC(Component: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { isDropTarget, rendersWidgets } = props;

    const renderChildren = () => {
      if (rendersWidgets) {
        // TODO: Create the widget using WidgetFactory and send them to LayoutComponent
        // const childrenMap = {
        //   widget1: WidgetFactory.createWidget(widgetProps, RenderModes.CANVAS),
        // }
        return Component.renderChildren(props);
      } else {
        return renderLayouts(props.layout as LayoutComponentProps[]);
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
