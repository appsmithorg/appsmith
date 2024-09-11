import type { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import { getAutoLayoutSystem } from "./autolayout";
import { getFixedLayoutSystem } from "./fixedlayout";
import type { LayoutSystem } from "./types";
import { LayoutSystemTypes } from "./types";
import { getAnvilLayoutSystem } from "./anvil";

/**
 *
 * @param renderMode - render mode specifies whether the application is in edit/deploy mode.
 * @param layoutSystemType - layout system of the application.
 * @returns
 *   @property — widgetSystem - widget specific wrappers and enhancers of a layout system
 *   @property — canvasSystem - canvas specific implementation and enhancers of a layout system
 */

export const getLayoutSystem = (
  renderMode: RenderModes,
  layoutSystemType: LayoutSystemTypes,
): LayoutSystem => {
  switch (layoutSystemType) {
    case LayoutSystemTypes.ANVIL:
      return getAnvilLayoutSystem(renderMode);
    case LayoutSystemTypes.AUTO:
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
  Widget: (props: WidgetProps) => JSX.Element;
}) => {
  const renderMode = useSelector(getRenderMode);
  const layoutSystemType = useSelector(getLayoutSystemType);
  // based on layoutSystemType and renderMode
  // get the layout system wrapper(adds layout system specific functionality) and
  // properties enhancer(adds/modifies properties of a widget based on layout system)
  const { widgetSystem } = getLayoutSystem(renderMode, layoutSystemType);
  const { propertyEnhancer, WidgetWrapper } = widgetSystem;
  const enhancedProperties = propertyEnhancer(widgetProps);
  return (
    <WidgetWrapper {...enhancedProperties}>
      <Widget {...enhancedProperties} />
    </WidgetWrapper>
  );
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withLayoutSystemWidgetHOC = (Widget: any) => {
  return function LayoutWrappedWidget(props: WidgetProps) {
    return <LayoutSystemWrapper Widget={Widget} widgetProps={props} />;
  };
};
