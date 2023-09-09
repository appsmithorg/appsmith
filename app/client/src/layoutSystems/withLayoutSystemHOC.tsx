/* eslint-disable no-console */
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
import { getAnvilSystem } from "./anvil";

export type LayoutSystem = {
  LayoutSystemWrapper: (props: WidgetProps) => any;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

const getLayoutSystem = (
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
): LayoutSystem => {
  console.log("####", { appPositioningType });
  switch (appPositioningType) {
    case AppPositioningTypes.ANVIL:
      return getAnvilSystem(renderMode);
    case AppPositioningTypes.AUTO:
      return getAutoLayoutSystem(renderMode);
    default:
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
  const { LayoutSystemWrapper, propertyEnhancer } = getLayoutSystem(
    renderMode,
    AppPositioningTypes.ANVIL || appPositioningType,
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
