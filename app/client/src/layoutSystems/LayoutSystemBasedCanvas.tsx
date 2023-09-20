import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { getLayoutSystem } from "./withLayoutSystemWidgetHOC";

// ToDo: destructure withWidgetProps to withCanvasProps by picking only necessary props of a canvas.

/**
 * Canvas of a Layout System is the module that provides necessary utilities to position and order widgets.
 * Canvas also provides editing layout system specific editing experiences like Drag and Drop, Drag to Select, Widget Grouping, etc.
 * This Component Hydrates canvas with enhanced properties from withWidgetProps and picks the layout system specific Canvas Implementation.
 */
export const LayoutSystemBasedCanvas = withWidgetProps(((
  props: WidgetProps,
) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  const { canvasSystem } = useMemo(
    () => getLayoutSystem(renderMode, appPositioningType),
    [
      {
        renderMode,
        appPositioningType,
      },
    ],
  );
  const { Canvas, propertyEnhancer } = canvasSystem;
  return <Canvas {...propertyEnhancer(props)} />;
}) as any);
