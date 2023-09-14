import React from "react";
import type {
  LayoutComponent,
  LayoutComponentProps,
} from "../utils/anvilTypes";
import LayoutFactory from "./LayoutFactory";

export function renderLayouts(layouts: LayoutComponentProps[]) {
  return layouts.map((layout) => {
    const LayoutComponent = LayoutFactory.get(layout.layoutType);
    return <LayoutComponent key={layout.layoutId} {...layout} />;
  });
}

export function LayoutComponentHOC(LayoutComponent: LayoutComponent) {
  const enhancedLayoutComponent = (props: LayoutComponentProps) => {
    const { isDropTarget, rendersWidgets } = props;

    const renderChildren = () => {
      if (rendersWidgets) {
        // TODO: Create the widget using WidgetFactory and send them to LayoutComponent
        return LayoutComponent.renderChildren(props);
      } else {
        return renderLayouts(props.layout as LayoutComponentProps[]);
      }
    };

    return (
      <>
        {isDropTarget && <div>dragging arena</div>}
        <div>LC Starts</div>
        <LayoutComponent {...props}>{renderChildren()}</LayoutComponent>
        <div>LC Ends</div>
      </>
    );
  };

  // Copy over static properties from LayoutComponent to enhancedLayoutComponent
  Object.assign(enhancedLayoutComponent, LayoutComponent);

  return enhancedLayoutComponent;
}
