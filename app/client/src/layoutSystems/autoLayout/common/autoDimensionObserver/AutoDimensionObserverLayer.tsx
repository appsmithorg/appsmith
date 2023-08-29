import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { FLEXBOX_PADDING } from "constants/WidgetConstants";
import { isFunction } from "lodash";
import React, { useContext } from "react";
import { ResponsiveBehavior } from "layoutSystems/autoLayout/utils/constants";
import { getWidgetMinMaxDimensionsInPixel } from "layoutSystems/autoLayout/utils/flexWidgetUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import AutoLayoutDimensionObserver from "./AutoLayoutDimensionObeserver";

export const AutoDimensionObserverLayer = (props: BaseWidgetProps) => {
  const editorContext = useContext(EditorContext);
  const { updateWidgetDimension } = editorContext;
  const { autoDimensionConfig } = props;
  const shouldObserveWidth = isFunction(autoDimensionConfig)
    ? autoDimensionConfig(props).width
    : autoDimensionConfig?.width;
  const shouldObserveHeight = isFunction(autoDimensionConfig)
    ? autoDimensionConfig(props).height
    : autoDimensionConfig?.height;

  if (!shouldObserveHeight && !shouldObserveWidth) return props.children;

  const { minHeight, minWidth } = getWidgetMinMaxDimensionsInPixel(
    props,
    props.mainCanvasWidth || 0,
  );

  const onDimensionUpdate = (width: number, height: number) => {
    if (!updateWidgetDimension) return;
    updateWidgetDimension(
      props.widgetId,
      width + 2 * FLEXBOX_PADDING,
      height + 2 * FLEXBOX_PADDING,
    );
  };

  return (
    <AutoLayoutDimensionObserver
      height={props.componentHeight}
      isFillWidget={props.responsiveBehavior === ResponsiveBehavior.Fill}
      minHeight={minHeight ?? 0}
      minWidth={minWidth ?? 0}
      onDimensionUpdate={onDimensionUpdate}
      shouldObserveHeight={shouldObserveHeight || false}
      shouldObserveWidth={shouldObserveWidth || false}
      type={props.type}
      width={props.componentWidth}
    >
      {props.children}
    </AutoLayoutDimensionObserver>
  );
};
