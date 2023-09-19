import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import type { CanvasProps } from "layoutSystems/fixedlayout/canvas/FixedLayoutEditorCanvas";
import { CanvasSelectionArena } from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/CanvasSelectionArena";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { AutoCanvasDraggingArena } from "../editor/AutoLayoutCanvasArenas/AutoCanvasDraggingArena";
import { AutoLayoutCanvasView } from "./AutoLayoutCanvasView";
import { getDirection } from "./utils";

export const AutoLayoutEditorCanvas = (props: BaseWidgetProps) => {
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
    <DropTargetComponent
      bottomRow={props.bottomRow}
      isListWidgetCanvas={props.isListWidgetCanvas}
      isMobile={props.isMobile}
      minHeight={props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
      mobileBottomRow={props.mobileBottomRow}
      noPad={props.noPad}
      parentId={props.parentId}
      snapColumnSpace={snapColumnSpace}
      useAutoLayout={props.useAutoLayout}
      widgetId={props.widgetId}
    >
      <ContainerComponent {...canvasProps}>
        <AutoCanvasDraggingArena
          {...snapGrid}
          alignItems={props.alignItems}
          canExtend={props.canExtend}
          direction={direction}
          dropDisabled={!!props.dropDisabled}
          noPad={props.noPad}
          parentId={props.parentId}
          snapRows={snapRows}
          widgetId={props.widgetId}
          widgetName={props.widgetName}
        />
        <CanvasSelectionArena
          {...snapGrid}
          canExtend={props.canExtend}
          dropDisabled={!!props.dropDisabled}
          parentId={props.parentId}
          snapRows={snapRows}
          widgetId={props.widgetId}
        />
        <AutoLayoutCanvasView
          direction={direction}
          renderMode={RenderModes.CANVAS}
          widgetProps={props}
        />
      </ContainerComponent>
    </DropTargetComponent>
  );
};
