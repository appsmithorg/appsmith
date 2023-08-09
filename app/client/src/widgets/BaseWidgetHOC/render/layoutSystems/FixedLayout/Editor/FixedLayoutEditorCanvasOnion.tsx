import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { CanvasSelectionArena } from "pages/common/CanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import { renderChildren } from "../../../common/canvasOnionUtils";
import { FixedLayoutViewCanvas } from "../Viewer/FixedLayoutViewerCanvasOnion";

const FixedLayoutCanvas = (props: BaseWidgetProps) => {
  const snapColumnSpace = props.componentWidth
    ? (props.componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
      GridDefaults.DEFAULT_GRID_COLUMNS
    : 0;
  const snapRows = getCanvasSnapRows(
    props.bottomRow,
    props.mobileBottomRow,
    props.isMobile,
    false,
  );
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
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
      <ContainerComponent {...props}>
        <CanvasDraggingArena
          {...snapGrid}
          alignItems={props.alignItems}
          canExtend={props.canExtend}
          dropDisabled={!!props.dropDisabled}
          noPad={props.noPad}
          parentId={props.parentId}
          snapRows={snapRows}
          useAutoLayout={false}
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
        <WidgetsMultiSelectBox
          {...snapGrid}
          noContainerOffset={!!props.noContainerOffset}
          widgetId={props.widgetId}
          widgetType={props.type}
        />
        {renderChildren(
          props.children,
          props.shouldScrollContents,
          props.widgetId,
          RenderModes.CANVAS,
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
    </DropTargetComponent>
  );
};

export const FixedLayoutEditorCanvasOnion = (props: BaseWidgetProps) => {
  return (
    <WidgetComponent {...props}>
      {props.dropDisabled ? (
        <FixedLayoutViewCanvas {...props} />
      ) : (
        <FixedLayoutCanvas {...props} />
      )}
    </WidgetComponent>
  );
};
