import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { getAutoLayoutSystemCanvasWrapper } from "./autolayout";
import { getFixedLayoutSystemCanvasWrapper } from "./fixedlayout";
import { getLayoutSystem } from "./withLayoutSystemHOC";

export type LayoutSystem = {
  LayoutSystemWrapper: (props: WidgetProps) => any;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

const getLayoutSystemBasedCanvas = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
): ((props: WidgetProps) => any) => {
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return getAutoLayoutSystemCanvasWrapper(renderMode);
  } else {
    return getFixedLayoutSystemCanvasWrapper(renderMode);
  }
};

export const LayoutSystemBasedCanvas = ({
  canvasProps,
}: {
  canvasProps: WidgetProps;
}) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  const { propertyEnhancer } = getLayoutSystem(renderMode, appPositioningType);
  // based on appPositioningType and renderMode
  // get the layout system wrapper(adds layout system specific functionality) and
  // properties enhancer(adds/modifies properties of a widget based on layout system)
  const CanvasWidget = getLayoutSystemBasedCanvas(
    renderMode,
    appPositioningType,
  );
  const HydratedCanvasWidget = withWidgetProps(CanvasWidget as any);
  return (
    <HydratedCanvasWidget
      {...propertyEnhancer(canvasProps)}
    ></HydratedCanvasWidget>
  );
};
