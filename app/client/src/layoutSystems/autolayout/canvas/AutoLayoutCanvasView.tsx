import { GridDefaults } from "constants/WidgetConstants";
import type { RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import React, { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import FlexBoxComponent from "../common/flexCanvas/FlexBoxComponent";
import type { AdditionalAutoLayoutProperties } from "./types";
import type { WidgetProps } from "widgets/BaseWidget";
import type { LayoutDirection } from "layoutSystems/common/utils/constants";

/**
 * This is the view component used by Canvas of Auto Layout both in Edit/View mode.
 * This component is responsible for rendering the children of a canvas.
 * It also adds additional layout specific properties to the children like parentColumnSpace, parentRowSpace, isFlexChild, etc.
 */

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
  // setting stretchFlexBox to true would stretch the canvas to 100% of the container widgets height when there are no children in it.
  // else its set to auto height.
  const stretchFlexBox = !widgetProps.children || !widgetProps.children?.length;
  const layoutSystemProps: AdditionalAutoLayoutProperties = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
  const defaultWidgetProps: Partial<WidgetProps> = {
    isFlexChild: true,
    direction,
  };
  const canvasChildren = useMemo(
    () =>
      renderChildren(
        widgetProps.children,
        widgetProps.widgetId,
        renderMode,
        defaultWidgetProps,
        layoutSystemProps,
      ),
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
