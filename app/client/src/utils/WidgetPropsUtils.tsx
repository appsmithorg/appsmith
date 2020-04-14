import { FetchPageResponse } from "api/PageApi";
import { CANVAS_DEFAULT_HEIGHT_PX } from "constants/AppConstants";
import { XYCoord } from "react-dnd";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  WidgetOperation,
  WidgetOperations,
  WidgetProps,
} from "widgets/BaseWidget";
import {
  GridDefaults,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import { snapToGrid } from "./helpers";
import { OccupiedSpace } from "constants/editorConstants";
import { DerivedPropFactory } from "utils/DerivedPropertiesFactory";
import defaultTemplate from "templates/default";
import { generateReactKey } from "./generators";

export type WidgetOperationParams = {
  operation: WidgetOperation;
  widgetId: string;
  payload: any;
};

const { DEFAULT_GRID_ROW_HEIGHT } = GridDefaults;
type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

const defaultDSL = defaultTemplate;

const updateContainers = (dsl: ContainerWidgetProps<WidgetProps>) => {
  if (
    dsl.type === WidgetTypes.CONTAINER_WIDGET ||
    dsl.type === WidgetTypes.FORM_WIDGET
  ) {
    if (
      !(
        dsl.children &&
        dsl.children.length > 0 &&
        (dsl.children[0].type === WidgetTypes.CANVAS_WIDGET ||
          dsl.children[0].type === WidgetTypes.FORM_WIDGET)
      )
    ) {
      const canvas = {
        ...dsl,
        type: WidgetTypes.CANVAS_WIDGET,
        detachFromLayout: true,
        topRow: 0,
        leftColumn: 0,
        rightColumn: dsl.parentColumnSpace * (dsl.rightColumn - dsl.leftColumn),
        bottomRow: dsl.parentRowSpace * (dsl.bottomRow - dsl.topRow),
        widgetName: generateReactKey(),
        widgetId: generateReactKey(),
        parentRowSpace: 1,
        parentColumnSpace: 1,
        containerStyle: "none",
        canExtend: false,
        isVisible: true,
      };
      delete canvas.dynamicBindings;
      delete canvas.dynamicProperties;
      if (canvas.children && canvas.children.length > 0)
        canvas.children = canvas.children.map(updateContainers);
      dsl.children = [{ ...canvas }];
    }
  }
  return dsl;
};

// A rudimentary transform function which updates the DSL based on its version.
// A more modular approach needs to be designed.
const transformDSL = (currentDSL: ContainerWidgetProps<WidgetProps>) => {
  if (currentDSL.version === undefined) {
    // Since this top level widget is a CANVAS_WIDGET,
    // DropTargetComponent needs to know the minimum height the canvas can take
    // See DropTargetUtils.ts
    currentDSL.minHeight = CANVAS_DEFAULT_HEIGHT_PX;
    // For the first time the DSL is created, remove one row from the total possible rows
    // to adjust for padding and margins.
    currentDSL.snapRows =
      Math.floor(currentDSL.bottomRow / DEFAULT_GRID_ROW_HEIGHT) - 1;

    // Force the width of the canvas to 1224 px
    currentDSL.rightColumn = 1224;
    // The canvas is a CANVAS_WIDGET whichdoesn't have a background or borders by default
    currentDSL.backgroundColor = "none";
    currentDSL.containerStyle = "none";
    currentDSL.type = WidgetTypes.CANVAS_WIDGET;
    currentDSL.detachFromLayout = true;
    currentDSL.canExtend = true;

    // Update version to make sure this doesn't run everytime.
    currentDSL.version = 1;
  }

  if (currentDSL.version === 1) {
    if (currentDSL.children && currentDSL.children.length > 0)
      currentDSL.children = currentDSL.children.map(updateContainers);
    currentDSL.version = 2;
  }

  return currentDSL;
};

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  const currentDSL = fetchPageResponse.data.layouts[0].dsl || defaultDSL;
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
    ...widget,
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
  parent: ContainerWidgetProps<WidgetProps>,
  type: WidgetType,
  leftColumn: number,
  topRow: number,
  parentRowSpace: number,
  parentColumnSpace: number,
  widgetName: string,
  widgetConfig: Partial<WidgetProps>,
): ContainerWidgetProps<WidgetProps> => {
  if (parent) {
    const sizes = {
      leftColumn,
      rightColumn: leftColumn + widgetConfig.columns,
      topRow,
      bottomRow: topRow + widgetConfig.rows,
    };

    const others = {};
    const derivedProperties = DerivedPropFactory.getDerivedPropertiesOfWidgetType(
      type,
      widgetName,
    );
    const dynamicBindings: Record<string, true> = {};
    Object.keys(derivedProperties).forEach(prop => {
      dynamicBindings[prop] = true;
    });
    const props = {
      isVisible: true,
      ...widgetConfig,
      type,
      widgetName,
      isLoading: false,
      parentColumnSpace,
      parentRowSpace,
      dynamicBindings,
      ...sizes,
      ...others,
      ...derivedProperties,
      parentId: parent.widgetId,
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
