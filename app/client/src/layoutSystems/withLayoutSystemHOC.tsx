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

export type LayoutSystem = {
  LayoutSystemWrapper: (props: WidgetProps) => any;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

const getLayoutSystem = (
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
  const { LayoutSystemWrapper, propertyEnhancer } = getLayoutSystem(
    renderMode,
    appPositioningType,
  );
  const enhancedProperties = propertyEnhancer(widgetProps);
  return (
    <LayoutSystemWrapper {...enhancedProperties}>
      <Widget {...enhancedProperties} />
    </LayoutSystemWrapper>
  );
};

export const withLayoutSystemHOC = (Widget: any) => {
  return function LayoutWrappedWidget(props: WidgetProps) {
    return <LayoutSystemWrapper Widget={Widget} widgetProps={props} />;
  };
};
