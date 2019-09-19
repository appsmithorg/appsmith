import { FetchPageResponse } from "../api/PageApi";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";
import { WidgetProps } from "../widgets/BaseWidget";
import { WidgetType, RenderModes } from "../constants/WidgetConstants";
import { generateReactKey } from "../utils/generators";

export const extractCurrentDSL = (
  fetchPageResponse: FetchPageResponse,
): ContainerWidgetProps<WidgetProps> => {
  return fetchPageResponse.data.layouts[0].dsl;
};

export const generateWidgetProps = (
  parent: ContainerWidgetProps<WidgetProps>,
  type: WidgetType,
  left: number,
  top: number,
  width: number,
  height: number,
): WidgetProps => {
  if (parent && parent.snapColumns && parent.snapRows) {
    const parentColumnWidth = Math.floor(
      ((parent.rightColumn - parent.leftColumn) * parent.parentColumnSpace) /
        parent.snapColumns,
    );
    const parentRowHeight = Math.floor(
      ((parent.bottomRow - parent.topRow) * parent.parentRowSpace) /
        parent.snapRows,
    );
    return {
      type,
      leftColumn: Math.floor(left / parentColumnWidth),
      rightColumn: Math.floor((left + width) / parentColumnWidth),
      topRow: Math.floor(top / parentRowHeight),
      bottomRow: Math.floor((top + height) / parentRowHeight),
      widgetId: generateReactKey(),
      widgetName: generateReactKey(), //TODO: figure out what this is to populate appropriately
      isVisible: true,
      parentColumnSpace: parentColumnWidth,
      parentRowSpace: parentRowHeight,
      executeAction: () => {},
      renderMode: RenderModes.CANVAS, //Is this required?
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
