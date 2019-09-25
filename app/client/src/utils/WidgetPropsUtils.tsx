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

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROWS } = GridDefaults;

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  return fetchPageResponse.data.layouts[0].dsl;
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
    // Calculate actual drop position by snapping based on x, y and grid cell size
    const [leftColumn, topRow] = snapToGrid(
      parentColumnSpace,
      parentRowSpace,
      widgetOffset.x - parentOffset.x,
      widgetOffset.y - parentOffset.y,
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
          parentWidgetId: widgetId,
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
      widget.leftColumn +
      Math.floor((origWidth + deltaWidth) / widget.parentColumnSpace),
    bottomRow:
      widget.topRow +
      Math.floor((origHeight + deltaHeight) / widget.parentRowSpace),
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
        background: Colors.WHITE,
      };
    }
    return {
      type,
      executeAction: () => {},
      widgetId: generateReactKey(),
      widgetName: generateReactKey(), //TODO: figure out what this is to populate appropriately
      isVisible: true,
      parentColumnSpace,
      parentRowSpace,
      renderMode: RenderModes.CANVAS, //Is this required?
      ...sizes,
      ...others,
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
