import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { CanvasViewerWrapper } from "layoutSystems/common/canvasViewer/CanvasViewerWrapper";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import React, { useMemo } from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";

export type CanvasProps = ContainerWidgetProps<WidgetProps>;

export const FixedLayoutViewerCanvas = (props: BaseWidgetProps) => {
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;
  const layoutSystemProps = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
  const defaultWidgetProps = {
    positioning: props.positioning,
  };
  const canvasChildren = useMemo(
    () =>
      renderChildren(
        props.children,
        props.widgetId,
        RenderModes.PAGE,
        defaultWidgetProps,
        layoutSystemProps,
        !!props.noPad,
      ),
    [
      props.children,
      props.shouldScrollContents,
      props.widgetId,
      props.componentHeight,
      props.componentWidth,
      snapColumnSpace,
    ],
  );
  const snapRows = getCanvasSnapRows(props.bottomRow);
  return (
    <CanvasViewerWrapper
      isListWidgetCanvas={props.isListWidgetCanvas}
      snapRows={snapRows}
    >
      <ContainerComponent {...props}>{canvasChildren}</ContainerComponent>
    </CanvasViewerWrapper>
  );
};
