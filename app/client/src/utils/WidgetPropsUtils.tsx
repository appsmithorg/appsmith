import { FetchPageResponse } from "api/PageApi";
import {
  CANVAS_DEFAULT_WIDTH_PX,
  CANVAS_DEFAULT_HEIGHT_PX,
  CANVAS_BACKGROUND_COLOR,
  CANVAS_DEFAULT_GRID_HEIGHT_PX,
  CANVAS_DEFAULT_GRID_WIDTH_PX,
} from "constants/AppConstants";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetProps,
  WidgetOperations,
  WidgetOperation,
} from "widgets/BaseWidget";
import { WidgetType, RenderModes } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";
import {
  GridDefaults,
  WidgetTypes,
  MAIN_CONTAINER_WIDGET_ID,
  MAIN_CONTAINER_WIDGET_NAME,
} from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROW_HEIGHT } = GridDefaults;
type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = {
  type: WidgetTypes.CONTAINER_WIDGET,
  widgetId: MAIN_CONTAINER_WIDGET_ID,
  widgetName: MAIN_CONTAINER_WIDGET_NAME,

  backgroundColor: CANVAS_BACKGROUND_COLOR,
  children: [],

  leftColumn: 0,
  rightColumn: CANVAS_DEFAULT_WIDTH_PX,
  parentColumnSpace: CANVAS_DEFAULT_GRID_WIDTH_PX,
  snapColumns: GridDefaults.DEFAULT_GRID_COLUMNS,

  topRow: 0,
  bottomRow: CANVAS_DEFAULT_HEIGHT_PX,
  parentRowSpace: CANVAS_DEFAULT_GRID_HEIGHT_PX,
  // 1 row needs to be removed, as padding top and bottom takes up some 1 row worth of space.
  // Widget padding: 8px
  // Container padding: 12px;
  // Total = (8 + 12) * 2 = GridDefaults.DEFAULT_GRID_ROW_HEIGHT = 40
  snapRows: CANVAS_DEFAULT_HEIGHT_PX / GridDefaults.DEFAULT_GRID_ROW_HEIGHT - 1,
};

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  const currentDSL = fetchPageResponse.data.layouts[0].dsl || defaultDSL;
  // 1 row needs to be removed, as padding top and bottom takes up some 1 row worth of space.
  // Widget padding: 8px
  // Container padding: 12px;
  // Total = (8 + 12) * 2 = GridDefaults.DEFAULT_GRID_ROW_HEIGHT = 40
  currentDSL.snapRows =
    Math.floor(currentDSL.bottomRow / DEFAULT_GRID_ROW_HEIGHT) - 1;
  return currentDSL;
};

export const getDropZoneOffsets = (
  colWidth: number,
  rowHeight: number,
  dragOffset: XYCoord,
  parentOffset: XYCoord,
) => {
  // Calculate actual drop position by snapping based on x, y and grid cell size
  return snapToGrid(
    colWidth,
    rowHeight,
    dragOffset.x - parentOffset.x,
    dragOffset.y - parentOffset.y,
  );
};

const areIntersecting = (r1: Rect, r2: Rect) => {
  return !(
    r2.left >= r1.right ||
    r2.right <= r1.left ||
    r2.top >= r1.bottom ||
    r2.bottom <= r1.top
  );
};

export const isDropZoneOccupied = (
  offset: Rect,
  widgetId: string,
  occupied?: OccupiedSpace[],
) => {
  if (occupied) {
    occupied = occupied.filter(widgetDetails => {
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
  const result =
    offset.right < 0 ||
    offset.top < 0 ||
    (parentRowCols.cols || GridDefaults.DEFAULT_GRID_COLUMNS) < offset.right ||
    (parentRowCols.rows || 0) < offset.bottom;

  return result;
};

export const noCollision = (
  clientOffset: XYCoord,
  colWidth: number,
  rowHeight: number,
  widget: WidgetProps & Partial<WidgetConfigProps>,
  dropTargetOffset: XYCoord,
  occupiedSpaces?: OccupiedSpace[],
  rows?: number,
  cols?: number,
): boolean => {
  if (clientOffset && dropTargetOffset && widget) {
    const [left, top] = getDropZoneOffsets(
      colWidth,
      rowHeight,
      clientOffset as XYCoord,
      dropTargetOffset,
    );
    if (left < 0 || top < 0) {
      return false;
    }
    const widgetWidth = widget.columns
      ? widget.columns
      : widget.rightColumn - widget.leftColumn;
    const widgetHeight = widget.rows
      ? widget.rows
      : widget.bottomRow - widget.topRow;
    const currentOffset = {
      left,
      right: left + widgetWidth,
      top,
      bottom: top + widgetHeight,
    };
    return (
      !isDropZoneOccupied(currentOffset, widget.widgetId, occupiedSpaces) &&
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
  widgetOffset: XYCoord,
  parentOffset: XYCoord,
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
  if (widget.widgetId) {
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
      newWidgetId: generateReactKey(),
      leftColumn,
      topRow,
      ...widgetDimensions,
      parentRowSpace,
      parentColumnSpace,
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
  if (widget.type === WidgetTypes.CONTAINER_WIDGET) {
    widget.snapRows = newPositions.bottomRow - newPositions.topRow - 1;
  }

  return {
    ...widget,
    ...newPositions,
  };
};

export const generateWidgetProps = (
  parent: ContainerWidgetProps<WidgetProps>,
  type: WidgetType,
  leftColumn: number,
  topRow: number,
  columns: number,
  rows: number,
  parentRowSpace: number,
  parentColumnSpace: number,
  widgetName: string,
  widgetConfig: Partial<WidgetProps>,
): Partial<ContainerWidgetProps<WidgetProps>> => {
  if (parent && parent.snapColumns && parent.snapRows) {
    const sizes = {
      leftColumn,
      rightColumn: leftColumn + columns,
      topRow,
      bottomRow: topRow + rows,
    };
    let others = {};
    if (type === WidgetTypes.CONTAINER_WIDGET) {
      others = {
        snapColumns: DEFAULT_GRID_COLUMNS,
        snapRows: rows - 1,
        orientation: "VERTICAL",
        children: [],
      };
    }
    return {
      ...widgetConfig,
      type,
      widgetName: widgetName,
      isVisible: true,
      isLoading: false,
      parentColumnSpace,
      parentRowSpace,
      renderMode: RenderModes.CANVAS,
      ...sizes,
      ...others,
    };
  } else {
    if (parent) {
      throw Error("Failed to create widget: Parent's size cannot be calculate");
    } else throw Error("Failed to create widget: Parent was not provided ");
  }
};

export default {
  extractCurrentDSL,
  generateWidgetProps,
};
