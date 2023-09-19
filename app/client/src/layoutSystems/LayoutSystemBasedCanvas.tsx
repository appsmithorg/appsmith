import React from "react";
import { useSelector } from "react-redux";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withMeta from "widgets/MetaHOC";
import withWidgetProps from "widgets/withWidgetProps";
import { getLayoutSystem } from "./withLayoutSystemHOC";

const withCanvasEnhancer = (Widget: any, propertyEnhancer: any) => {
  function EnhancedCanvas(props: WidgetProps) {
    const enhancedProps = propertyEnhancer(props);
    return <Widget {...enhancedProps} />;
  }
  return EnhancedCanvas;
};

export const LayoutSystemBasedCanvas = ({
  canvasProps,
}: {
  canvasProps: WidgetProps;
}) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  const { canvasSystem } = getLayoutSystem(renderMode, appPositioningType);
  const { Canvas: CanvasWidget, propertyEnhancer } = canvasSystem;
  const MetaWidget = canvasProps.needsMeta
    ? withMeta(CanvasWidget as any)
    : CanvasWidget;
  const EnhancedWidget = withCanvasEnhancer(MetaWidget, propertyEnhancer);
  // based on appPositioningType and renderMode
  // get the layout system wrapper(adds layout system specific functionality) and
  // properties enhancer(adds/modifies properties of a widget based on layout system)
  const HydratedCanvasWidget = withWidgetProps(EnhancedWidget as any);
  return <HydratedCanvasWidget {...canvasProps} />;
};
