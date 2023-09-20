import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystem } from "./autolayout";
import { getFixedLayoutSystem } from "./fixedlayout";
import type { LayoutSystem } from "./types";

/**
 *
 * @param renderMode - render mode specifies whether the application is in edit/deploy mode.
 * @param appPositioningType - layout system of the application.
 * @returns
 *   @property — widgetSystem - widget specific wrappers and enhancers of a layout system
 *   @property — canvasSystem - canvas specific implementation and enhancers of a layout system
 */

export const getLayoutSystem = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
): LayoutSystem => {
  if (appPositioningType === AppPositioningTypes.AUTO) {
    return getAutoLayoutSystem(renderMode);
  } else {
    return getFixedLayoutSystem(renderMode);
  }
};

const LayoutSystemWrapper = ({
  Widget,
  widgetProps,
}: {
  widgetProps: WidgetProps;
  Widget: (props: WidgetProps) => any;
}) => {
  const renderMode = useSelector(getRenderMode);
  const appPositioningType = useSelector(getAppPositioningType);
  // based on appPositioningType and renderMode
  // get the layout system wrapper(adds layout system specific functionality) and
  // properties enhancer(adds/modifies properties of a widget based on layout system)
  const { widgetSystem } = getLayoutSystem(renderMode, appPositioningType);
  const { propertyEnhancer, WidgetWrapper } = widgetSystem;
  const enhancedProperties = propertyEnhancer(widgetProps);
  return (
    <WidgetWrapper {...enhancedProperties}>
      <Widget {...enhancedProperties} />
    </WidgetWrapper>
  );
};

export const withLayoutSystemWidgetHOC = (Widget: any) => {
  return function LayoutWrappedWidget(props: WidgetProps) {
    return <LayoutSystemWrapper Widget={Widget} widgetProps={props} />;
  };
};
