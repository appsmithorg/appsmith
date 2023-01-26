import { FetchPageResponse } from "api/PageApi";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderMode,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import defaultTemplate from "templates/default";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { transformDSL } from "./DSLMigrations";
import WidgetFactory, {
  NonSerialisableWidgetConfigs,
  WidgetType,
} from "./WidgetFactory";
import { DSLWidget } from "widgets/constants";
import { WidgetDraggingBlock } from "pages/common/CanvasArenas/hooks/useBlocksToBeDraggedOnCanvas";
import { XYCord } from "pages/common/CanvasArenas/hooks/useRenderBlocksOnCanvas";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { BlockSpace, GridProps } from "reflow/reflowTypes";
import { areIntersecting, Rect } from "./boxHelpers";

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

const defaultDSL = defaultTemplate;

export const extractCurrentDSL = (
  fetchPageResponse?: FetchPageResponse,
): DSLWidget => {
  const newPage = !fetchPageResponse;
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || {
    ...defaultDSL,
  };
  return transformDSL(currentDSL as ContainerWidgetProps<WidgetProps>, newPage);
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

export const getCanvasSnapRows = (bottomRow: number): number => {
  const totalRows = Math.floor(
    bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

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

/**
 * This returns the number of rows which is not occupied by a Canvas Widget within
 * a parent container like widget of type widgetType
 * For example, the Tabs Widget takes 4 rows for the tabs
 * @param widgetType Type of widget
 * @param props Widget properties
 * @returns the offset in rows
 */
export const getCanvasHeightOffset = (
  widgetType: WidgetType,
  props: WidgetProps,
) => {
  // Get the non serialisable configs for the widget type
  const config:
    | Record<NonSerialisableWidgetConfigs, unknown>
    | undefined = WidgetFactory.nonSerialisableWidgetConfigMap.get(widgetType);
  let offset = 0;
  // If this widget has a registered canvasHeightOffset function
  if (config?.canvasHeightOffset) {
    // Run the function to get the offset value
    offset = (config.canvasHeightOffset as (props: WidgetProps) => number)(
      props,
    );
  }
  return offset;
};

/**
 * This function computes the heights of canvas widgets which may be effected by the changes in other widget properties (updatedWidgetIds)
 * @param updatedWidgetIds Widgets which have updated
 * @param canvasWidgets The widgets in the redux state, used for computations
 * @returns A list of canvas widget ids with their heights in pixels
 */
export function getCanvasWidgetHeightsToUpdate(
  updatedWidgetIds: string[],
  canvasWidgets: Record<string, FlattenedWidgetProps>,
): Record<string, number> {
  const updatedCanvasWidgets: Record<string, number> = {};
  for (const widgetId of updatedWidgetIds) {
    const widget = canvasWidgets[widgetId];
    if (widget) {
      if (
        widget.type !== "CANVAS_WIDGET" &&
        Array.isArray(widget.children) &&
        widget.children.length > 0
      ) {
        for (const childCanvasWidgetId of widget.children) {
          if (!updatedCanvasWidgets.hasOwnProperty(childCanvasWidgetId)) {
            const bottomRow = getCanvasBottomRow(
              childCanvasWidgetId,
              canvasWidgets,
            );
            if (bottomRow > 0) {
              updatedCanvasWidgets[childCanvasWidgetId] = bottomRow;
            }
          }
        }
      }
      if (widget.parentId && widget.parentId !== MAIN_CONTAINER_WIDGET_ID) {
        if (!updatedCanvasWidgets.hasOwnProperty(widget.parentId)) {
          const bottomRow = getCanvasBottomRow(widget.parentId, canvasWidgets);
          if (bottomRow > 0) updatedCanvasWidgets[widget.parentId] = bottomRow;
        }
      }
    }
  }
  return updatedCanvasWidgets;
}

/**
 * A function to compute the height of a given canvas widget (canvasWidgetId) in pixels
 * @param canvasWidgetId The CANVAS_WIDGET's widgetId. This canvas widget is the one whose bottomRow we need to compute
 * @param canvasWidgets The widgets in the redux state. We use this to get appropriate info regarding types, parent and children for computations
 * @returns The canvas widget's height in pixels (this is also the minHight and bottomRow property values)
 */
export function getCanvasBottomRow(
  canvasWidgetId: string,
  canvasWidgets: Record<string, FlattenedWidgetProps>,
) {
  const canvasWidget = canvasWidgets[canvasWidgetId];
  // If this widget is not defined
  // It is likely a part of the list widget's canvases
  if (canvasWidget === undefined) {
    return 0;
  }
  // If this widget is not a CANVAS_WIDGET
  if (canvasWidget.type !== "CANVAS_WIDGET") {
    return canvasWidget.bottomRow;
  }

  const children = canvasWidget.children;
  let parentHeightInRows = Math.ceil(
    canvasWidget.bottomRow / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );

  // Hypothetical thoughts:
  // If this is the MainContainer
  // We need some special handling.
  // What we can do is use the viewport height and compute the minimum using that
  // in the edit mode
  // In the view mode, we can do the same?
  // This is because, we might have changed the "bottomRow" somewhere and that will
  // cause it to consider that value, and give us a large scroll.

  if (canvasWidget.parentId) {
    const parentWidget = canvasWidgets[canvasWidget.parentId];
    // If the parent widget is undefined but the parentId exists
    // It is likely a part of the list widget
    if (parentWidget === undefined) {
      return 0;
    }
    // If the parent is list widget, let's return the canvasWidget.bottomRow
    // We'll be handling this specially in withWidgetProps
    if (parentWidget.type === "LIST_WIDGET") {
      return canvasWidget.bottomRow;
    }

    // Widgets like Tabs widget have an offset we need to subtract
    const parentHeightOffset = getCanvasHeightOffset(
      parentWidget.type,
      parentWidget,
    );
    // The parent's height in rows
    parentHeightInRows = parentWidget.bottomRow - parentWidget.topRow;

    // If the parent is modal widget, we need to consider the `height` instead
    // of the bottomRow
    // TODO(abhinav): We could use one or the other and not have both, maybe
    // update the bottomRow of the modal widget instead?
    if (parentWidget.type === "MODAL_WIDGET" && parentWidget.height) {
      parentHeightInRows = Math.floor(
        parentWidget.height / GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      );
    }
    // Subtract the canvas offset due to some parent elements
    parentHeightInRows = parentHeightInRows - parentHeightOffset;
  }

  if (Array.isArray(children) && children.length > 0) {
    const bottomRow = children.reduce((prev, next) => {
      return canvasWidgets[next].bottomRow > prev
        ? canvasWidgets[next].bottomRow
        : prev;
    }, parentHeightInRows);

    return bottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  }
  return parentHeightInRows * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
}
