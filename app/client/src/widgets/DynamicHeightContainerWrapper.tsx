import { WidgetProps } from "./BaseWidget";
import {
  getWidgetMaxDynamicHeight,
  getWidgetMinDynamicHeight,
} from "./WidgetUtils";
import DynamicHeightContainer from "./DynamicHeightContainer";
import React, { ReactNode } from "react";
import useWidgetConfig from "utils/hooks/useWidgetConfig";
import { GridDefaults } from "constants/WidgetConstants";

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
    if (height === 0) return;
    requestAnimationFrame(() => {
      props.onUpdateDynamicHeight(height);
    });
  };

  const maxDynamicHeight = getWidgetMaxDynamicHeight(widgetProps);
  const minDynamicHeight = getWidgetMinDynamicHeight(widgetProps);

  const widgetHeightInPixels =
    (widgetProps.bottomRow - widgetProps.topRow) *
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

  return (
    <DynamicHeightContainer
      dynamicHeight={widgetProps.dynamicHeight}
      maxDynamicHeight={maxDynamicHeight}
      minDynamicHeight={minDynamicHeight}
      onHeightUpdate={onHeightUpdate}
      widgetHeightInPixels={widgetHeightInPixels}
      widgetProps={widgetProps}
    >
      {children}
    </DynamicHeightContainer>
  );
}
