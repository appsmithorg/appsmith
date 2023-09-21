import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import { CanvasViewerWrapper } from "layoutSystems/common/canvasViewer/CanvasViewerWrapper";
import type { CanvasProps } from "layoutSystems/fixedlayout/canvas/FixedLayoutEditorCanvas";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { AutoLayoutCanvasView } from "./AutoLayoutCanvasView";
import { getDirection } from "./utils";

export const AutoLayoutViewerCanvas = (props: BaseWidgetProps) => {
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
  const direction = getDirection(props.positioning);
  const snapRows = getCanvasSnapRows(
    props.bottomRow,
    props.mobileBottomRow,
    props.isMobile,
    true,
  );
  return (
    <CanvasViewerWrapper
      isListWidgetCanvas={props.isListWidgetCanvas}
      snapRows={snapRows}
    >
      <ContainerComponent {...canvasProps}>
        <AutoLayoutCanvasView
          direction={direction}
          renderMode={RenderModes.PAGE}
          snapColumnSpace={snapColumnSpace}
          widgetProps={props}
        />
      </ContainerComponent>
    </CanvasViewerWrapper>
  );
};
