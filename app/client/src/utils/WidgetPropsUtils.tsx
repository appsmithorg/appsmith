import { FetchPageResponse } from "api/PageApi";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import { GridDefaults, RenderMode } from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
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
  const newPage = !fetchPageResponse;
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || {
    ...defaultDSL,
  };
  return transformDSL(currentDSL, newPage);
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
        rightColumn: Math.round(
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
