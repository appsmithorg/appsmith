import { GridDefaults } from "constants/WidgetConstants";
import type { RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import React, { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import FlexBoxComponent from "../common/flexCanvas/FlexBoxComponent";
import type { LayoutDirection } from "../utils/constants";

export const AutoLayoutCanvasView = ({
  direction,
  renderMode,
  snapColumnSpace,
  widgetProps,
}: {
  widgetProps: BaseWidgetProps;
  renderMode: RenderModes;
  snapColumnSpace: number;
  direction: LayoutDirection;
}) => {
  const stretchFlexBox = !widgetProps.children || !widgetProps.children?.length;
  const canvasChildren = useMemo(
    () =>
      renderChildren(widgetProps.children, widgetProps.widgetId, renderMode, {
        parentColumnSpace: snapColumnSpace,
        parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        isFlexChild: true,
        direction,
      }),
    [
      widgetProps.children,
      widgetProps.widgetId,
      renderMode,
      snapColumnSpace,
      direction,
    ],
  );
  return (
    <FlexBoxComponent
      direction={direction}
      flexLayers={widgetProps.flexLayers || []}
      isMobile={widgetProps.isMobile || false}
      stretchHeight={stretchFlexBox}
      useAutoLayout={widgetProps.useAutoLayout || false}
      widgetId={widgetProps.widgetId}
    >
      {canvasChildren}
    </FlexBoxComponent>
  );
};
