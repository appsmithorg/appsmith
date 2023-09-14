import DropTargetComponent from "components/editorComponents/DropTargetComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import { CanvasSelectionArena } from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import React from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { FixedCanvasDraggingArena } from "../editor/FixedLayoutCanvasArenas/FixedCanvasDraggingArena";

export type CanvasProps = ContainerWidgetProps<WidgetProps>;

export const FixedLayoutEditorCanvas = (props: BaseWidgetProps) => {
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
  const snapRows = getCanvasSnapRows(props.bottomRow);

  return (
    <DropTargetComponent
      bottomRow={props.bottomRow}
      isListWidgetCanvas={props.isListWidgetCanvas}
      minHeight={props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX}
      noPad={props.noPad}
      parentId={props.parentId}
      snapColumnSpace={snapColumnSpace}
      widgetId={props.widgetId}
    >
      <ContainerComponent {...canvasProps}>
        <FixedCanvasDraggingArena
          {...snapGrid}
          canExtend={props.canExtend}
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
        <WidgetsMultiSelectBox
          {...snapGrid}
          noContainerOffset={!!props.noContainerOffset}
          widgetId={props.widgetId}
          widgetType={props.type}
        />
        {renderChildren(
          canvasProps.children,
          !!canvasProps.shouldScrollContents,
          canvasProps.widgetId,
          RenderModes.CANVAS,
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
    </DropTargetComponent>
  );
};
