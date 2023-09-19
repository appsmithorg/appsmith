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
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;

  return (
    <ContainerComponent {...props}>
      {renderChildren(
        props.children,
        !!props.shouldScrollContents,
        props.widgetId,
        RenderModes.PAGE,
        {
          componentHeight: props.componentHeight,
          componentWidth: props.componentWidth,
        },
        {
          parentColumnSpace: snapColumnSpace,
          parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
        },
      )}
    </ContainerComponent>
  );
};
