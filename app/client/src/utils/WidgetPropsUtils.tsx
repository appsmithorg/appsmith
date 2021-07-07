import { FetchPageResponse } from "api/PageApi";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import {
  GridDefaults,
  LATEST_PAGE_VERSION,
  MAIN_CONTAINER_WIDGET_ID,
  RenderMode,
} from "constants/WidgetConstants";
import { renameKeyInObject, snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";
import defaultTemplate from "templates/default";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { transformDSL } from "./DSLMigrations";
import WidgetFactory, { WidgetType } from "./WidgetFactory";
import { get, isString, set } from "lodash";

const WidgetTypes = WidgetFactory.widgetTypes;

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = defaultTemplate;

export const extractCurrentDSL = (
  fetchPageResponse?: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  const currentDSL = fetchPageResponse?.data.layouts[0].dsl || defaultDSL;
  return transformDSL(currentDSL);
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
    if (widget.detachFromLayout) {
      return true;
    }
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

  // Canvas Widgets do not need to accomodate for widget and container padding.
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
): ContainerWidgetProps<WidgetProps> => {
  if (parent) {
    const sizes = {
      leftColumn,
      rightColumn: leftColumn + widgetConfig.columns,
      topRow,
      bottomRow: topRow + widgetConfig.rows,
    };

    const others = {};
    const props: ContainerWidgetProps<WidgetProps> = {
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
 * adds logBlackList key for all list widget children
 *
 * @param currentDSL
 * @returns
 */
const addLogBlackListToAllListWidgetChildren = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  currentDSL.children = currentDSL.children?.map((children: WidgetProps) => {
    if (children.type === WidgetTypes.LIST_WIDGET) {
      const widgets = get(
        children,
        "children.0.children.0.children.0.children",
      );

      widgets.map((widget: any, index: number) => {
        const logBlackList: { [key: string]: boolean } = {};

        Object.keys(widget).map((key) => {
          logBlackList[key] = true;
        });
        if (!widget.logBlackList) {
          set(
            children,
            `children.0.children.0.children.0.children.${index}.logBlackList`,
            logBlackList,
          );
        }
      });
    }

    return children;
  });

  return currentDSL;
};

/**
 * changes items -> listData
 *
 * @param currentDSL
 * @returns
 */
const migrateItemsToListDataInListWidget = (
  currentDSL: ContainerWidgetProps<WidgetProps>,
) => {
  if (currentDSL.type === WidgetTypes.LIST_WIDGET) {
    currentDSL = renameKeyInObject(currentDSL, "items", "listData");

    currentDSL.dynamicBindingPathList = currentDSL.dynamicBindingPathList?.map(
      (path: { key: string }) => {
        if (path.key === "items") {
          return { key: "listData" };
        }

        return path;
      },
    );

    currentDSL.dynamicBindingPathList?.map((path: { key: string }) => {
      if (
        get(currentDSL, path.key) &&
        path.key !== "items" &&
        path.key !== "listData" &&
        isString(get(currentDSL, path.key))
      ) {
        set(
          currentDSL,
          path.key,
          get(currentDSL, path.key, "").replace("items", "listData"),
        );
      }
    });

    Object.keys(currentDSL.template).map((widgetName) => {
      const currentWidget = currentDSL.template[widgetName];

      currentWidget.dynamicBindingPathList?.map((path: { key: string }) => {
        set(
          currentWidget,
          path.key,
          get(currentWidget, path.key).replace("items", "listData"),
        );
      });
    });
  }

  if (currentDSL.children && currentDSL.children.length > 0) {
    currentDSL.children = currentDSL.children.map(
      migrateItemsToListDataInListWidget,
    );
  }
  return currentDSL;
};
