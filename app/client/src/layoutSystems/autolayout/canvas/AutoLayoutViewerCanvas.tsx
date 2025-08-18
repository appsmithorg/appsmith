import { RenderModes } from "constants/WidgetConstants";
import { CanvasViewerWrapper } from "layoutSystems/common/canvasViewer/CanvasViewerWrapper";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { AutoLayoutCanvasView } from "./AutoLayoutCanvasView";
import { getDirection } from "./utils";

/**
 * This component implements the Canvas for Auto Layout System in View mode.
 */

export const AutoLayoutViewerCanvas = (props: BaseWidgetProps) => {
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
      <ContainerComponent {...props}>
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
