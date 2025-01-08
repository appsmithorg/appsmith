import type { FetchPageResponse } from "api/PageApi";
import type { WidgetConfigProps } from "WidgetProvider/constants";
import type { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import { WidgetOperations } from "widgets/BaseWidget";
import type { RenderMode } from "constants/WidgetConstants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import defaultTemplate from "templates/default";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetType } from "../WidgetProvider/factory";
import type { DSLWidget } from "WidgetProvider/constants";
import type { BlockSpace, GridProps } from "reflow/reflowTypes";
import type { Rect } from "./boxHelpers";
import { areIntersecting } from "./boxHelpers";

import type {
  WidgetDraggingBlock,
  XYCord,
} from "layoutSystems/common/canvasArenas/ArenaTypes";
import { migrateDSL } from "@shared/dsl";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";

export interface WidgetOperationParams {
  operation: WidgetOperation;
  widgetId: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

const defaultDSL = defaultTemplate;

/**
 * This function is responsible for the following operations:
 * 1. Using the default DSL if the response doesn't give us a DSL
 * 2. Running all the DSL migrations on the DSL (migrateDSL)
 * 3. Transforming the DSL for the specifications of the layout system (only if a DSLTransformer is passed as an argument)
 * @param dslTransformer A function that takes a DSL and returns a DSL transformed for the specifications of the layout system
 * @param fetchPageResponse The response from the fetchPage API Call
 * @returns The updated DSL and the layoutId
 */
export const extractCurrentDSL = async ({
  dslTransformer,
  response,
}: {
  dslTransformer?: (dsl: DSLWidget) => DSLWidget;
  response?: FetchPageResponse;
}): Promise<{ dsl: DSLWidget; layoutId: string | undefined }> => {
  // If fetch page response doesn't exist
  // It means we are creating a new page
  const newPage = !response;
  // Get the DSL from the response or default to the defaultDSL
  const currentDSL = response?.data.layouts[0].dsl || {
    ...defaultDSL,
  };

  let dsl = currentDSL as DSLWidget;

  // Run all the migrations on this DSL
  dsl = (await migrateDSL(
    currentDSL as ContainerWidgetProps<WidgetProps>,
    newPage,
  )) as DSLWidget;

  // If this DSL is meant to be transformed
  // then the dslTransformer would have been passed by the caller
  if (dslTransformer) {
    dsl = dslTransformer(dsl);
  }

  return {
    dsl,
    layoutId: response?.data.layouts[0].id,
  };
};

/**
 * To get updated positions of the dragging blocks
 *
 * @param draggingBlocks
 * @param snapColumnSpace
 * @param snapRowSpace
 * @returns An array of updated positions of the dragging blocks
 */
export function getDraggingSpacesFromBlocks(
  draggingBlocks: WidgetDraggingBlock[],
  snapColumnSpace: number,
  snapRowSpace: number,
): BlockSpace[] {
  const draggingSpaces = [];

  for (const draggingBlock of draggingBlocks) {
    //gets top and left position of the block
    const [leftColumn, topRow] = getDropZoneOffsets(
      snapColumnSpace,
      snapRowSpace,
      {
        x: draggingBlock.left,
        y: draggingBlock.top,
      },
      {
        x: 0,
        y: 0,
      },
    );

    draggingSpaces.push({
      left: leftColumn,
      top: topRow,
      right: leftColumn + draggingBlock.width / snapColumnSpace,
      bottom: topRow + draggingBlock.height / snapRowSpace,
      id: draggingBlock.widgetId,
      fixedHeight:
        draggingBlock.fixedHeight !== undefined
          ? draggingBlock.rowHeight
          : undefined,
    });
  }

  return draggingSpaces;
}

export const getDropZoneOffsets = (
  colWidth: number,
  rowHeight: number,
  dragOffset: XYCord,
  parentOffset: XYCord,
) => {
  // Calculate actual drop position by snapping based on x, y and grid cell size
  return snapToGrid(
    colWidth,
    rowHeight,
    dragOffset.x - parentOffset.x,
    dragOffset.y - parentOffset.y,
  );
};

export const getMousePositionsOnCanvas = (
  e: MouseEvent,
  gridProps: GridProps,
) => {
  const mouseTop = Math.floor(
    (e.offsetY - CONTAINER_GRID_PADDING - WIDGET_PADDING) /
      gridProps.parentRowSpace,
  );
  const mouseLeft = Math.floor(
    (e.offsetX - CONTAINER_GRID_PADDING - WIDGET_PADDING) /
      gridProps.parentColumnSpace,
  );

  return {
    id: "mouse",
    top: mouseTop,
    left: mouseLeft,
    bottom: mouseTop + 1,
    right: mouseLeft + 1,
  };
};

export const isDropZoneOccupied = (
  offset: Rect,
  widgetId: string,
  occupied?: OccupiedSpace[],
) => {
  if (occupied) {
    occupied = occupied.filter((widgetDetails) => {
      return (
        widgetDetails.id !== widgetId && widgetDetails.parentId !== widgetId
      );
    });

    for (let i = 0; i < occupied.length; i++) {
      if (areIntersecting(occupied[i], offset)) {
        return true;
      }
    }

    return false;
  }

  return false;
};

export const isWidgetOverflowingParentBounds = (
  parentRowCols: { rows?: number; cols?: number },
  offset: Rect,
): boolean => {
  return (
    offset.right < 0 ||
    offset.top < 0 ||
    (parentRowCols.cols || GridDefaults.DEFAULT_GRID_COLUMNS) < offset.right ||
    (parentRowCols.rows || 0) < offset.bottom
  );
};

export const noCollision = (
  clientOffset: XYCord,
  colWidth: number,
  rowHeight: number,
  dropTargetOffset: XYCord,
  widgetWidth: number,
  widgetHeight: number,
  widgetId: string,
  occupiedSpaces?: OccupiedSpace[],
  rows?: number,
  cols?: number,
  detachFromLayout = false,
): boolean => {
  if (detachFromLayout) {
    return true;
  }

  if (clientOffset && dropTargetOffset) {
    const [left, top] = getDropZoneOffsets(
      colWidth,
      rowHeight,
      clientOffset as XYCord,
      dropTargetOffset,
    );

    if (left < 0 || top < 0) {
      return false;
    }

    const currentOffset = {
      left,
      right: left + widgetWidth,
      top,
      bottom: top + widgetHeight,
    };

    return (
      !isDropZoneOccupied(currentOffset, widgetId, occupiedSpaces) &&
      !isWidgetOverflowingParentBounds({ rows, cols }, currentOffset)
    );
  }

  return false;
};

export const currentDropRow = (
  dropTargetRowSpace: number,
  dropTargetVerticalOffset: number,
  draggableItemVerticalOffset: number,
  widget: WidgetProps & Partial<WidgetConfigProps>,
) => {
  const widgetHeight = widget.rows
    ? widget.rows
    : widget.bottomRow - widget.topRow;
  const top = Math.round(
    (draggableItemVerticalOffset - dropTargetVerticalOffset) /
      dropTargetRowSpace,
  );
  const currentBottomOffset = top + widgetHeight;

  return currentBottomOffset;
};

export const widgetOperationParams = (
  widget: WidgetProps & Partial<WidgetConfigProps>,
  widgetOffset: XYCord,
  parentOffset: XYCord,
  parentColumnSpace: number,
  parentRowSpace: number,
  parentWidgetId: string, // parentWidget
  widgetSizeUpdates: {
    width: number;
    height: number;
  },
  fullWidth = false,
): WidgetOperationParams => {
  const [leftColumn, topRow] = getDropZoneOffsets(
    parentColumnSpace,
    parentRowSpace,
    widgetOffset,
    parentOffset,
  );

  // If this is an existing widget, we'll have the widgetId
  // Therefore, this is a move operation on drop of the widget
  if (widget.widgetName) {
    return {
      operation: WidgetOperations.MOVE,
      widgetId: widget.widgetId,
      payload: {
        leftColumn,
        topRow,
        bottomRow: Math.round(
          topRow + widgetSizeUpdates.height / parentRowSpace,
        ),
        rightColumn: fullWidth
          ? GridDefaults.DEFAULT_GRID_COLUMNS
          : Math.round(
              leftColumn + widgetSizeUpdates.width / parentColumnSpace,
            ),
        parentId: widget.parentId,
        newParentId: parentWidgetId,
      },
    };
    // If this is not an existing widget, we'll not have the widgetId
    // Therefore, this is an operation to add child to this container
  }

  const widgetDimensions = {
    columns: fullWidth ? GridDefaults.DEFAULT_GRID_COLUMNS : widget.columns,
    rows: widget.rows,
  };

  return {
    operation: WidgetOperations.ADD_CHILD,
    widgetId: parentWidgetId,
    payload: {
      type: widget.type,
      leftColumn,
      topRow,
      ...widgetDimensions,
      parentRowSpace,
      parentColumnSpace,
      newWidgetId: widget.widgetId,
    },
  };
};

export const getCanvasSnapRows = (
  bottomRow: number,
  mobileBottomRow?: number,
  isMobile?: boolean,
  isAutoLayoutActive?: boolean,
): number => {
  const bottom =
    isMobile && mobileBottomRow !== undefined && isAutoLayoutActive
      ? mobileBottomRow
      : bottomRow;
  const totalRows = Math.floor(bottom / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);

  return isAutoLayoutActive ? totalRows : totalRows - 1;
};

export const getSnapColumns = (): number => {
  return GridDefaults.DEFAULT_GRID_COLUMNS;
};

export const generateWidgetProps = (
  parent: FlattenedWidgetProps,
  type: WidgetType,
  leftColumn: number,
  topRow: number,
  parentRowSpace: number,
  parentColumnSpace: number,
  widgetName: string,
  widgetConfig: {
    widgetId: string;
    renderMode: RenderMode;
  } & Partial<WidgetProps>,
  version: number,
): DSLWidget => {
  if (parent) {
    const sizes = {
      leftColumn,
      rightColumn: leftColumn + widgetConfig.columns,
      topRow,
      bottomRow: topRow + widgetConfig.rows,
    };
    const mobileSizes = {
      mobileLeftColumn: leftColumn,
      mobileRightColumn: leftColumn + widgetConfig.columns,
      mobileTopRow: topRow,
      mobileBottomRow: topRow + widgetConfig.rows,
    };

    const others = {};
    const props: DSLWidget = {
      // Todo(abhinav): abstraction leak
      isVisible: "MODAL_WIDGET" === type ? undefined : true,
      ...widgetConfig,
      type,
      widgetName,
      isLoading: false,
      parentColumnSpace,
      parentRowSpace,
      ...sizes,
      ...mobileSizes,
      ...others,
      parentId: parent.widgetId,
      version,
    };

    delete props.rows;
    delete props.columns;

    return props;
  } else {
    if (parent) {
      throw Error("Failed to create widget: Parent's size cannot be calculate");
    } else throw Error("Failed to create widget: Parent was not provided ");
  }
};
