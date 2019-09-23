import { FetchPageResponse } from "../api/PageApi";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import { WidgetProps } from "../widgets/BaseWidget";
import { WidgetType, RenderModes } from "../constants/WidgetConstants";
import { generateReactKey } from "../utils/generators";
import { Colors } from "../constants/Colors";
import { GridDefaults, WidgetTypes } from "../constants/WidgetConstants";

const { DEFAULT_GRID_COLUMNS, DEFAULT_GRID_ROWS } = GridDefaults;

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  return fetchPageResponse.data.layouts[0].dsl;
};

export const updateWidgetPosition = (
  widget: WidgetProps,
  left: number,
  top: number,
  parent?: WidgetProps,
) => {
  const newPositions = {
    leftColumn: Math.floor(left / widget.parentColumnSpace),
    topRow: Math.floor(top / widget.parentRowSpace),
    rightColumn:
      Math.floor(left / widget.parentColumnSpace) +
      (widget.rightColumn - widget.leftColumn),
    bottomRow:
      Math.floor(top / widget.parentRowSpace) +
      (widget.bottomRow - widget.topRow),
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
  left: number,
  top: number,
  width: number,
  height: number,
): ContainerWidgetProps<WidgetProps> => {
  if (parent && parent.snapColumns && parent.snapRows) {
    const parentColumnWidth = Math.floor(
      ((parent.rightColumn - parent.leftColumn) * parent.parentColumnSpace) /
        parent.snapColumns,
    );
    const parentRowHeight = Math.floor(
      ((parent.bottomRow - parent.topRow) * parent.parentRowSpace) /
        parent.snapRows,
    );
    const sizes = {
      leftColumn: Math.floor(left / parentColumnWidth),
      rightColumn: Math.floor((left + width) / parentColumnWidth),
      topRow: Math.floor(top / parentRowHeight),
      bottomRow: Math.floor((top + height) / parentRowHeight),
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
      parentColumnSpace: parentColumnWidth,
      parentRowSpace: parentRowHeight,
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
