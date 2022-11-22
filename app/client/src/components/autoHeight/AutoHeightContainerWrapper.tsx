import React, { ReactNode } from "react";
import useWidgetConfig from "utils/hooks/useWidgetConfig";
import { DynamicHeight } from "utils/WidgetFeatures";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getWidgetMaxDynamicHeight,
  getWidgetMinDynamicHeight,
} from "widgets/WidgetUtils";
import AutoHeightContainer from "./AutoHeightContainer";

export type AutoHeightWrapperProps = {
  widgetProps: WidgetProps;
  children: ReactNode;
  onUpdateDynamicHeight: (height: number) => void;
};

function AutoHeightContainerWrapper(props: AutoHeightWrapperProps) {
  const { children, widgetProps } = props;
  const isCanvas = useWidgetConfig(widgetProps.type, "isCanvas");
  // eslint-disable-next-line react/jsx-no-useless-fragment
  if (isCanvas) return <>{children}</>;

  const onHeightUpdate = (height: number) => {
    requestAnimationFrame(() => {
      props.onUpdateDynamicHeight(height);
    });
  };

  const maxDynamicHeight = getWidgetMaxDynamicHeight(widgetProps);
  const minDynamicHeight = getWidgetMinDynamicHeight(widgetProps);

  const isAutoHeightWithLimits =
    widgetProps.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;

  return (
    <AutoHeightContainer
      isAutoHeightWithLimits={isAutoHeightWithLimits}
      maxDynamicHeight={maxDynamicHeight}
      minDynamicHeight={minDynamicHeight}
      onHeightUpdate={onHeightUpdate}
      widgetProps={widgetProps}
    >
      {children}
    </AutoHeightContainer>
  );
}

export default AutoHeightContainerWrapper;
