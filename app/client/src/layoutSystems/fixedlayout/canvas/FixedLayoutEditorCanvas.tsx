import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import { CanvasSelectionArena } from "layoutSystems/fixedlayout/editor/FixedLayoutCanvasArenas/CanvasSelectionArena";
import WidgetsMultiSelectBox from "layoutSystems/fixedlayout/common/widgetGrouping/WidgetsMultiSelectBox";
import React, { useMemo } from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { DropTargetComponentWrapper } from "../../common/dropTarget/DropTargetComponentWrapper";
import { FixedCanvasDraggingArena } from "../editor/FixedLayoutCanvasArenas/FixedCanvasDraggingArena";
import { compact, sortBy } from "lodash";

export type CanvasProps = ContainerWidgetProps<WidgetProps>;

export const FixedLayoutEditorCanvas = (props: BaseWidgetProps) => {
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;
  const snapRows = getCanvasSnapRows(props.bottomRow);
  const fixedLayoutDropTargetProps = useMemo(
    () => ({
      bottomRow: props.bottomRow,
      isListWidgetCanvas: props.isListWidgetCanvas,
      minHeight: props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
      noPad: props.noPad,
      parentId: props.parentId,
      snapColumnSpace: snapColumnSpace,
      widgetId: props.widgetId,
    }),
    [
      props.bottomRow,
      props.isListWidgetCanvas,
      props.minHeight,
      props.noPad,
      props.parentId,
      snapColumnSpace,
      props.widgetId,
    ],
  );
  const layoutSystemProps = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
  const defaultWidgetProps = {
    positioning: props.positioning,
  };
  // ToDO: Remove sorting of children on the view, ideally the model should be sorted, coz they are less frequently happening
  // operations. leaving it as is for now, coz it multiple cypress tests are dependent on this.
  const canvasChildren = useMemo(
    () =>
      renderChildren(
        sortBy(compact(props.children), (child: WidgetProps) => child.topRow),
        props.widgetId,
        RenderModes.CANVAS,
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
  return (
    <DropTargetComponentWrapper
      dropDisabled={!!props.dropDisabled}
      dropTargetProps={fixedLayoutDropTargetProps}
      snapColumnSpace={snapColumnSpace}
    >
      <ContainerComponent {...props}>
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
        {canvasChildren}
      </ContainerComponent>
    </DropTargetComponentWrapper>
  );
};
