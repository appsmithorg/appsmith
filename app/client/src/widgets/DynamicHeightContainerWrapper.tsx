import { WidgetProps } from "./BaseWidget";
import {
  getWidgetMaxDynamicHeight,
  getWidgetMinDynamicHeight,
} from "./WidgetUtils";
import DynamicHeightContainer from "./DynamicHeightContainer";
import React, { ReactNode } from "react";
import useWidgetConfig from "utils/hooks/useWidgetConfig";

export type DynamicHeightWrapperProps = {
  widgetProps: WidgetProps;
  children: ReactNode;
  onUpdateDynamicHeight: (height: number) => void;
};

export function DynamicHeightContainerWrapper(
  props: DynamicHeightWrapperProps,
) {
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

  return (
    <DynamicHeightContainer
      dynamicHeight={widgetProps.dynamicHeight}
      maxDynamicHeight={maxDynamicHeight}
      minDynamicHeight={minDynamicHeight}
      onHeightUpdate={onHeightUpdate}
    >
      {children}
    </DynamicHeightContainer>
  );
}
