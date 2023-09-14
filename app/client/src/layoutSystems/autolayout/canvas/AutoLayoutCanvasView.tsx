import type { RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import FlexBoxComponent from "../common/flexCanvas/FlexBoxComponent";
import type { LayoutDirection } from "../utils/constants";

export const AutoLayoutCanvasView = ({
  direction,
  renderMode,
  widgetProps,
}: {
  widgetProps: BaseWidgetProps;
  renderMode: RenderModes;
  direction: LayoutDirection;
}) => {
  const stretchFlexBox = !widgetProps.children || !widgetProps.children?.length;
  return (
    <FlexBoxComponent
      direction={direction}
      flexLayers={widgetProps.flexLayers || []}
      isMobile={widgetProps.isMobile || false}
      stretchHeight={stretchFlexBox}
      useAutoLayout={widgetProps.useAutoLayout || false}
      widgetId={widgetProps.widgetId}
    >
      {renderChildren(
        widgetProps.children,
        false,
        widgetProps.widgetId,
        renderMode,
        {
          componentHeight: widgetProps.componentHeight,
          componentWidth: widgetProps.componentWidth,
        },
      )}
    </FlexBoxComponent>
  );
};
