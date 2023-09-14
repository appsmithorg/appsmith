import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";

export type CanvasProps = ContainerWidgetProps<WidgetProps>;

export const FixedLayoutViewerCanvas = (props: BaseWidgetProps) => {
  const canvasProps: CanvasProps = {
    ...props,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
    containerStyle: "none",
    detachFromLayout: true,
    minHeight: props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
    shouldScrollContents: false,
  };
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;

  return (
    <ContainerComponent {...canvasProps}>
      {renderChildren(
        canvasProps.children,
        !!canvasProps.shouldScrollContents,
        canvasProps.widgetId,
        RenderModes.PAGE,
        {
          componentHeight: canvasProps.componentHeight,
          componentWidth: canvasProps.componentWidth,
        },
        {
          parentColumnSpace: snapColumnSpace,
          parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        },
      )}
    </ContainerComponent>
  );
};
