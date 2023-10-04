import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { getLayoutSystem } from "./withLayoutSystemWidgetHOC";

// ToDo(#27615): destructure withWidgetProps to withCanvasProps by picking only necessary props of a canvas.

/**
 * Canvas of a Layout System is the module that provides necessary utilities to position and order widgets.
 * Canvas also provides editing layout system specific editing experiences like Drag and Drop, Drag to Select, Widget Grouping, etc.
 * This Component Hydrates canvas with enhanced properties from withWidgetProps and picks the layout system specific Canvas Implementation.
 */

const LayoutSystemBasedCanvas = memo((props: WidgetProps) => {
  const renderMode = useSelector(getRenderMode);
  const layoutSystemType = useSelector(getLayoutSystemType);
  const { canvasSystem } = useMemo(
    () => getLayoutSystem(renderMode, layoutSystemType),
    [
      {
        renderMode,
        layoutSystemType,
      },
    ],
  );
  const { Canvas, propertyEnhancer } = canvasSystem;
  return <Canvas {...propertyEnhancer(props)} />;
});

const HydratedLayoutSystemBasedCanvas = withWidgetProps(
  LayoutSystemBasedCanvas as any,
);

export const renderAppsmithCanvas = (props: WidgetProps) => {
  return <HydratedLayoutSystemBasedCanvas {...props} />;
};
