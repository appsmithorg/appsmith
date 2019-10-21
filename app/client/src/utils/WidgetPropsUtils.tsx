import { FetchPageResponse } from "../api/PageApi";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import { WidgetConfigProps } from "../reducers/entityReducers/widgetConfigReducer";
import { WidgetProps, WidgetOperations } from "../widgets/BaseWidget";
import { WidgetType, RenderModes } from "../constants/WidgetConstants";
import { generateReactKey } from "../utils/generators";
import { Colors } from "../constants/Colors";
import { GridDefaults, WidgetTypes } from "../constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "../widgets/ContainerWidget";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROWS } = GridDefaults;
type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = {
  backgroundColor: "#ffffff",
  bottomRow: 1024,
  children: [],
  leftColumn: 0,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  renderMode: "CANVAS",
  rightColumn: 1024,
  snapColumns: 16,
  snapRows: 32,
  topRow: 0,
  type: "CONTAINER_WIDGET",
  widgetId: "0",
};

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  return fetchPageResponse.data.layouts[0].dsl || defaultDSL;
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
  occupied: OccupiedSpace[] | null,
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
) => {
  return (
    (parentRowCols.cols || GridDefaults.DEFAULT_GRID_COLUMNS) < offset.right ||
    (parentRowCols.rows || GridDefaults.DEFAULT_GRID_ROWS) < offset.bottom
  );
};

export const noCollision = (
  clientOffset: XYCoord,
  colWidth: number,
  rowHeight: number,
  widget: WidgetProps & Partial<WidgetConfigProps>,
  dropTargetOffset: XYCoord,
  occupiedSpaces: OccupiedSpace[] | null,
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

export const widgetOperationParams = (
  widget: WidgetProps & Partial<WidgetConfigProps>,
  widgetOffset: XYCoord,
  parentOffset: XYCoord,
  parentColumnSpace: number,
  parentRowSpace: number,
  widgetId?: string,
) => {
  if (widgetOffset) {
    const [leftColumn, topRow] = getDropZoneOffsets(
      parentColumnSpace,
      parentRowSpace,
      widgetOffset,
      parentOffset,
    );
    // If this is an existing widget, we'll have the widgetId
    // Therefore, this is a move operation on drop of the widget
    if (widget.widgetId) {
      return [
        WidgetOperations.MOVE,
        widget.widgetId,
        {
          leftColumn,
          topRow,
          parentId: widget.parentId,
          newParentId: widgetId,
        },
      ];
      // If this is not an existing widget, we'll not have the widgetId
      // Therefore, this is an operation to add child to this container
    } else {
      const widgetDimensions = {
        columns: widget.columns,
        rows: widget.rows,
      };
      return [
        WidgetOperations.ADD_CHILD,
        widgetId,
        {
          type: widget.type,
          leftColumn,
          topRow,
          ...widgetDimensions,
          parentRowSpace,
          parentColumnSpace,
        },
      ];
    }
  }
};

export const updateWidgetPosition = (
  widget: WidgetProps,
  leftColumn: number,
  topRow: number,
  parent?: WidgetProps,
) => {
  const newPositions = {
    leftColumn,
    topRow,
    rightColumn: leftColumn + (widget.rightColumn - widget.leftColumn),
    bottomRow: topRow + (widget.bottomRow - widget.topRow),
  };
  if (parent) {
  }
  return {
    ...widget,
    ...newPositions,
  };
};

export const updateWidgetSize = (
  widget: WidgetProps,
  deltaHeight: number,
  deltaWidth: number,
): WidgetProps => {
  const origHeight = (widget.bottomRow - widget.topRow) * widget.parentRowSpace;
  const origWidth =
    (widget.rightColumn - widget.leftColumn) * widget.parentColumnSpace;
  return {
    ...widget,
    rightColumn:
      widget.leftColumn + (origWidth + deltaWidth) / widget.parentColumnSpace,
    bottomRow:
      widget.topRow + (origHeight + deltaHeight) / widget.parentRowSpace,
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
): ContainerWidgetProps<WidgetProps> => {
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
        snapRows: DEFAULT_GRID_ROWS,
        orientation: "VERTICAL",
        children: [],
      };
    }
    return {
      ...widgetConfig,
      type,
      widgetId: generateReactKey(),
      widgetName: widgetName,
      isVisible: true,
      parentColumnSpace,
      parentRowSpace,
      renderMode: RenderModes.CANVAS,
      ...sizes,
      ...others,
      backgroundColor: Colors.WHITE,
    };
  } else {
    if (parent)
      throw Error("Failed to create widget: Parent's size cannot be calculate");
    else throw Error("Failed to create widget: Parent was not provided ");
  }
};

export default {
  extractCurrentDSL,
  generateWidgetProps,
};
