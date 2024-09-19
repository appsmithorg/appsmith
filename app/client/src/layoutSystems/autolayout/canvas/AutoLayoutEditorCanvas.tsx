import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import { DropTargetComponentWrapper } from "layoutSystems/common/dropTarget/DropTargetComponentWrapper";
import { CanvasSelectionArena } from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/CanvasSelectionArena";
import React, { useMemo } from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { AutoCanvasDraggingArena } from "../editor/AutoLayoutCanvasArenas/AutoCanvasDraggingArena";
import { AutoLayoutCanvasView } from "./AutoLayoutCanvasView";
import { getDirection } from "./utils";

/**
 * This component implements the Canvas for Auto Layout System in Edit mode.
 * It renders layers like CanvasDraggingArena, CanvasSelectionArena, etc which are responsible for
 * drag and drop, scrolling, etc.
 */

export const AutoLayoutEditorCanvas = (props: BaseWidgetProps) => {
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;
  const direction = getDirection(props.positioning);
  const snapRows = getCanvasSnapRows(
    props.bottomRow,
    props.mobileBottomRow,
    props.isMobile,
    true,
  );
  const autoLayoutDropTargetProps = useMemo(
    () => ({
      bottomRow: props.bottomRow,
      isListWidgetCanvas: props.isListWidgetCanvas,
      isMobile: props.isMobile,
      minHeight: props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
      mobileBottomRow: props.mobileBottomRow,
      noPad: props.noPad,
      parentId: props.parentId,
      snapColumnSpace: snapColumnSpace,
      useAutoLayout: props.useAutoLayout,
      widgetId: props.widgetId,
    }),
    [
      props.bottomRow,
      props.isListWidgetCanvas,
      props.isMobile,
      props.minHeight,
      props.mobileBottomRow,
      props.noPad,
      props.parentId,
      snapColumnSpace,
      props.useAutoLayout,
      props.widgetId,
    ],
  );

  return (
    <DropTargetComponentWrapper
      dropDisabled={props.dropDisabled}
      dropTargetProps={autoLayoutDropTargetProps}
      snapColumnSpace={snapColumnSpace}
    >
      <ContainerComponent {...props}>
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
          snapColumnSpace={snapColumnSpace}
          widgetProps={props}
        />
      </ContainerComponent>
    </DropTargetComponentWrapper>
  );
};
