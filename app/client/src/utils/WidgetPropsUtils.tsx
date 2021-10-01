import { FetchPageResponse } from "api/PageApi";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import { GridDefaults, RenderMode } from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";
import defaultTemplate from "templates/default";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { transformDSL } from "./DSLMigrations";
import { WidgetType } from "./WidgetFactory";
import { DSLWidget } from "widgets/constants";
import { XYCord } from "pages/common/CanvasArenas/hooks/useCanvasDragging";

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

export type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = defaultTemplate;

export const extractCurrentDSL = (
  fetchPageResponse?: FetchPageResponse,
): DSLWidget => {
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || defaultDSL;
  return transformDSL(currentDSL);
};

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

export const areIntersecting = (r1: Rect, r2: Rect) => {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
};

export const getResizeParamsForPartialBoundaryCollision = (
  collidingBlock: OccupiedSpace,
  blockRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  },
) => {
  const intersectingPoints = [
    { y: blockRect.top, x: blockRect.left, type: "topLeft" },
    { y: blockRect.top, x: blockRect.right, type: "topRight" },
    { y: blockRect.bottom, x: blockRect.left, type: "bottomLeft" },
    {
      y: blockRect.bottom,
      x: blockRect.right,
      type: "bottomRight",
    },
  ].filter((eachPoint) => {
    return isPointInsideRect(eachPoint, collidingBlock);
  });
  if (intersectingPoints.length === 4) {
    return;
  }
  if (intersectingPoints.length === 2) {
    const [point1, point2] = intersectingPoints;
    if (point1.y === point2.y) {
      return {
        direction: point1.type.includes("top") ? "top" : "bottom",
        amount: point1.type.includes("top")
          ? collidingBlock.bottom - point1.y
          : point1.y - collidingBlock.top,
      };
    }
    if (point1.x === point2.x) {
      return {
        direction: point1.type.includes("Left") ? "left" : "right",
        amount: point1.type.includes("Left")
          ? collidingBlock.right - point1.x
          : point1.x - collidingBlock.left,
      };
    }
  }
};

export const getResizeParamsForFullBoundaryCollision = (
  points: {
    y: number;
    x: number;
    type: string;
  }[],
  blockRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  },
):
  | {
      direction: string;
      amount: number;
    }
  | undefined => {
  const [point1, point2] = points;

  if (point1.y === point2.y) {
    return {
      direction: point1.type.includes("top") ? "bottom" : "top",
      amount: point1.type.includes("top")
        ? blockRect.bottom - point1.y
        : point1.y - blockRect.top,
    };
  }
  if (point1.x === point2.x) {
    return {
      direction: point1.type.includes("Left") ? "right" : "left",
      amount: point1.type.includes("Left")
        ? blockRect.right - point1.x
        : point1.x - blockRect.left,
    };
  }
};

export const getResizeParamsForSinglePointCollision = (
  point: {
    y: number;
    x: number;
    type: string;
  },
  blockRect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  },
):
  | {
      direction: string;
      amount: number;
    }
  | undefined => {
  if (point.type === "topLeft") {
    const widthResizedBlockArea =
      (blockRect.bottom - blockRect.top) * (point.x - blockRect.left);
    const heightResizedBlockArea =
      (point.y - blockRect.top) * (blockRect.right - blockRect.left);
    return {
      direction:
        widthResizedBlockArea > heightResizedBlockArea ? "right" : "bottom",
      amount:
        widthResizedBlockArea > heightResizedBlockArea
          ? blockRect.right - point.x
          : blockRect.bottom - point.y,
    };
  }
  if (point.type === "topRight") {
    const widthResizedBlockArea =
      (blockRect.bottom - blockRect.top) * (blockRect.right - point.x);
    const heightResizedBlockArea =
      (point.y - blockRect.top) * (blockRect.right - blockRect.left);
    return {
      direction:
        widthResizedBlockArea > heightResizedBlockArea ? "left" : "bottom",
      amount:
        widthResizedBlockArea > heightResizedBlockArea
          ? point.x - blockRect.left
          : blockRect.bottom - point.y,
    };
  }
  if (point.type === "bottomLeft") {
    const widthResizedBlockArea =
      (blockRect.bottom - blockRect.top) * (point.x - blockRect.left);
    const heightResizedBlockArea =
      (blockRect.bottom - point.y) * (blockRect.right - blockRect.left);
    return {
      direction:
        widthResizedBlockArea > heightResizedBlockArea ? "right" : "top",
      amount:
        widthResizedBlockArea > heightResizedBlockArea
          ? blockRect.right - point.x
          : point.y - blockRect.top,
    };
  }
  if (point.type === "bottomRight") {
    const widthResizedBlockArea =
      (blockRect.bottom - blockRect.top) * (blockRect.right - point.x);
    const heightResizedBlockArea =
      (blockRect.bottom - point.y) * (blockRect.right - blockRect.left);
    return {
      direction:
        widthResizedBlockArea > heightResizedBlockArea ? "left" : "top",
      amount:
        widthResizedBlockArea > heightResizedBlockArea
          ? point.x - blockRect.left
          : point.y - blockRect.top,
    };
  }
};
export const isPointInsideRect = function(point: XYCord, r: Rect) {
  return (
    r.left <= point.x &&
    point.x <= r.right &&
    r.top <= point.y &&
    point.y <= r.bottom
  );
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
        parentId: widget.parentId,
        newParentId: parentWidgetId,
      },
    };
    // If this is not an existing widget, we'll not have the widgetId
    // Therefore, this is an operation to add child to this container
  }
  const widgetDimensions = {
    columns: widget.columns,
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

export const updateWidgetPosition = (
  widget: WidgetProps,
  leftColumn: number,
  topRow: number,
) => {
  const newPositions = {
    leftColumn,
    topRow,
    rightColumn: leftColumn + (widget.rightColumn - widget.leftColumn),
    bottomRow: topRow + (widget.bottomRow - widget.topRow),
  };

  return {
    ...newPositions,
  };
};

export const getCanvasSnapRows = (
  bottomRow: number,
  canExtend: boolean,
): number => {
  const totalRows = Math.floor(
    bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

  // Canvas Widgets do not need to accommodate for widget and container padding.
  // Only when they're extensible
  if (canExtend) {
    return totalRows;
  }
  // When Canvas widgets are not extensible
  return totalRows - 1;
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
