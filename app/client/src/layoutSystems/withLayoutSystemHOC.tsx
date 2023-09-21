import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { LayoutSystemTypes } from "reducers/entityReducers/pageListReducer";
import { getLayoutSystemType, getRenderMode } from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystem } from "./autolayout";
import { getFixedLayoutSystem } from "./fixedlayout";

export type LayoutSystem = {
  LayoutSystemWrapper: (props: WidgetProps) => any;
  propertyEnhancer: (props: WidgetProps) => WidgetProps;
};

export const getLayoutSystem = (
  renderMode: RenderModes,
  layoutSystemType: LayoutSystemTypes,
): LayoutSystem => {
  if (layoutSystemType === LayoutSystemTypes.AUTO) {
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
  const layoutSystemType = useSelector(getLayoutSystemType);
  // based on layoutSystemType and renderMode
  // get the layout system wrapper(adds layout system specific functionality) and
  // properties enhancer(adds/modifies properties of a widget based on layout system)
  const { LayoutSystemWrapper, propertyEnhancer } = getLayoutSystem(
    renderMode,
    layoutSystemType,
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
