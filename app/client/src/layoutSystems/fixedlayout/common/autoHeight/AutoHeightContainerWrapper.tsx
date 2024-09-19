import { GridDefaults } from "constants/WidgetConstants";
import type { ReactNode } from "react";
import React from "react";
import useWidgetConfig from "utils/hooks/useWidgetConfig";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
} from "widgets/WidgetUtils";
import AutoHeightContainer from "./AutoHeightContainer";

export interface AutoHeightWrapperProps {
  widgetProps: WidgetProps;
  children: ReactNode;
}

export function AutoHeightContainerWrapper(props: WidgetProps) {
  const isCanvas = useWidgetConfig(props.type, "isCanvas");

  if (isCanvas) return props.children;

  const maxDynamicHeight = getWidgetMaxAutoHeight(props);
  const minDynamicHeight = getWidgetMinAutoHeight(props);

  const widgetHeightInPixels =
    (props.bottomRow - props.topRow) * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const isAutoHeightWithLimits =
    props.dynamicHeight === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;

  return (
    <AutoHeightContainer
      isAutoHeightWithLimits={isAutoHeightWithLimits}
      maxDynamicHeight={maxDynamicHeight}
      minDynamicHeight={minDynamicHeight}
      widgetHeightInPixels={widgetHeightInPixels}
      widgetProps={props}
    >
      {props.children}
    </AutoHeightContainer>
  );
}
