import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import {
  GridDefaults,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { partition } from "lodash";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { HORIZONTAL_RESIZE_MIN_LIMIT } from "reflow/reflowTypes";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
} from "utils/autoLayout/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  Positioning,
} from "utils/autoLayout/constants";
import {
  getWidgetWidth,
  getWidgetHeight,
  getTopRow,
  getBottomRow,
  getLeftColumn,
  getRightColumn,
} from "utils/autoLayout/flexWidgetUtils";
import { DSLWidget, FlattenedWidgetProps } from "widgets/constants";

type LayerAlignmentData = {
  widgets: FlattenedWidgetProps[];
  width: number;
  type: FlexLayerAlignment;
};

type AlignmentLayerMap = {
  start: LayerAlignmentData;
  center: LayerAlignmentData;
  end: LayerAlignmentData;
};

const nonFlexLayerWidgets = ["MODAL_WIDGET"];

const deletedResponsiveProperties = [
  "mobileLeftColumn",
  "mobileRightColumn",
  "mobileTopRow",
  "mobileBottomRow",
  "responsiveBehavior",
  "alignment",
  "flexVerticalAlignment",
];

/**
 * Main Method to convert Auto DSL to Fixed DSL
 * @param dsl DSL to be Converted to Fixed Layout
 * @param destinationLayout Destination Layout Size
 * @returns Converted Fixed DSL
 */
export default function convertDSLtoFixed(
  dsl: DSLWidget,
  destinationLayout: SupportedLayouts,
) {
  const allWidgets = CanvasWidgetsNormalizer.normalize(dsl).entities
    .canvasWidgets;

  const convertedWidgets = convertNormalizedDSLToFixed(
    allWidgets,
    destinationLayout,
  );

  const convertedDSL = CanvasWidgetsNormalizer.denormalize(
    MAIN_CONTAINER_WIDGET_ID,
    {
      canvasWidgets: convertedWidgets,
    },
  );

  return convertedDSL;
}

/**
 * Convert Normalized Auto DSL to Fixed Layout DSL
 * @param widgets Normalized Auto DSL to be converted
 * @param destinationLayout Destination Layout Size
 * @returns Converted Normalized Fixed Layout DSL
 */
export function convertNormalizedDSLToFixed(
  widgets: CanvasWidgetsReduxState,
  destinationLayout: SupportedLayouts,
) {
  const isMobile = getIsMobile(destinationLayout);

  const alteredWidgets = isMobile
    ? alterLayoutForMobile(
        widgets,
        MAIN_CONTAINER_WIDGET_ID,
        layoutConfigurations[destinationLayout].maxWidth ||
          layoutConfigurations.MOBILE.maxWidth,
      )
    : alterLayoutForDesktop(widgets, MAIN_CONTAINER_WIDGET_ID);

  const convertedWidgets = getFixedCanvasWidget(
    alteredWidgets,
    MAIN_CONTAINER_WIDGET_ID,
    isMobile,
  );

  return convertedWidgets;
}

/**
 * Converts Widget with widgetId and it's children to Fixed layout recursively
 * @param widgets Normalized Auto DSL
 * @param widgetId
 * @param isMobile
 * @returns
 */
function convertAutoWidgetToFixed(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  isMobile: boolean,
): CanvasWidgetsReduxState {
  const currWidget = { ...widgets[widgetId] };
  if (!currWidget) return widgets;

  let currWidgets = { ...widgets };

  if (currWidget.type === "CANVAS_WIDGET") {
    return getFixedCanvasWidget(currWidgets, widgetId, isMobile);
  } else {
    if (currWidget.children && currWidget.children.length > 0) {
      for (const childId of currWidget.children) {
        currWidgets = convertAutoWidgetToFixed(currWidgets, childId, isMobile);
      }
    }

    // Delete responsive properties of widgets
    for (const responsiveProperty of deletedResponsiveProperties) {
      delete currWidget[responsiveProperty];
    }

    currWidgets[widgetId] = { ...currWidget };
  }

  return currWidgets;
}

/**
 * Convert the Canvas Widget of canvasId to Fixed
 * @param widgets
 * @param canvasId
 * @param isMobile
 * @returns
 */
function getFixedCanvasWidget(
  widgets: CanvasWidgetsReduxState,
  canvasId: string,
  isMobile: boolean,
): CanvasWidgetsReduxState {
  const canvasWidget = { ...widgets[canvasId] };
  if (
    !canvasWidget ||
    !canvasWidget.children ||
    !canvasWidget.useAutoLayout ||
    !canvasWidget.flexLayers
  ) {
    return widgets;
  }

  //if Mobile, use the existing already calculated positions in `alterLayoutForMobile`
  if (isMobile) {
    return processMobileCanvasChildren(widgets, canvasId);
  }

  //If not mobile/wrapped use the flexLayer alignments to updated the positions of the widgets
  const { children, updatedWidgets } = processLayers(
    widgets,
    canvasWidget.flexLayers,
  );

  //separate the widgets to be skipped
  const [nonLayerChildren, layerChildren] = partition(
    canvasWidget.children,
    (widgetId) =>
      nonFlexLayerWidgets.indexOf(updatedWidgets[widgetId].type) > -1,
  );

  // delete widgets that are in Layer Children but not in children
  const deletedWidgets = layerChildren.filter((f) => !children.includes(f));

  for (const deletedWidgetId of deletedWidgets) {
    delete updatedWidgets[deletedWidgetId];
  }

  // Delete Canvas widget responsive properties
  delete canvasWidget.flexLayers;
  delete canvasWidget.responsiveBehavior;

  updatedWidgets[canvasId] = {
    ...canvasWidget,
    children: [...children, ...nonLayerChildren],
    useAutoLayout: false,
    positioning: Positioning.Fixed,
  };

  return updatedWidgets;
}

/**
 * Process the mobile canvas Widgets with already existing positions/dimensions
 * @param widgets
 * @param canvasId
 * @returns
 */
function processMobileCanvasChildren(
  widgets: CanvasWidgetsReduxState,
  canvasId: string,
) {
  const canvasWidget = { ...widgets[canvasId] };

  let currWidgets = { ...widgets };

  for (const childId of canvasWidget.children || []) {
    const currWidget = currWidgets[childId];

    currWidgets[childId] = {
      ...currWidget,
      topRow: getTopRow(currWidget, true),
      bottomRow: getBottomRow(currWidget, true),
      leftColumn: getLeftColumn(currWidget, true),
      rightColumn: getRightColumn(currWidget, true),
    };

    currWidgets = convertAutoWidgetToFixed(currWidgets, childId, true);
  }

  // Delete Canvas widget responsive properties
  delete canvasWidget.flexLayers;
  delete canvasWidget.responsiveBehavior;

  currWidgets[canvasId] = {
    ...canvasWidget,
    useAutoLayout: false,
    positioning: Positioning.Fixed,
  };

  return currWidgets;
}

/**
 * Process Layers iteratively to calculate positions based on layer and alignment
 * @param widgets
 * @param flexLayers
 * @returns
 */
function processLayers(
  widgets: CanvasWidgetsReduxState,
  flexLayers: FlexLayer[],
) {
  let bottomRow = 0;
  let updatedWidgets = { ...widgets };
  let children: string[] = [];

  for (const flexLayer of flexLayers) {
    let currChildren;
    ({ bottomRow, currChildren, updatedWidgets } = processIndividualLayer(
      updatedWidgets,
      flexLayer,
      bottomRow,
    ));

    children = [...children, ...currChildren];
  }

  return { updatedWidgets, children };
}

/**
 * Process Individual layer to calculate positions based on layer and alignment
 * @param widgets
 * @param flexLayer
 * @param currentBottomRow
 * @returns
 */
function processIndividualLayer(
  widgets: CanvasWidgetsReduxState,
  flexLayer: FlexLayer,
  currentBottomRow: number,
) {
  const { children: flexChildren } = flexLayer;

  let currChildren: string[] = [];

  let layerHeight = 0;

  const alignmentLayerMap: AlignmentLayerMap = {
    start: { widgets: [], width: 0, type: FlexLayerAlignment.Start },
    center: { widgets: [], width: 0, type: FlexLayerAlignment.Center },
    end: { widgets: [], width: 0, type: FlexLayerAlignment.End },
  };

  //update alignment layer map by iterating each children within layer
  for (const child of flexChildren) {
    const widget = widgets[child.id];

    if (widget.detachFromLayout) continue;

    currChildren.push(child.id);
    layerHeight = Math.max(layerHeight, getWidgetHeight(widget, false));

    if (child.align === "end") {
      alignmentLayerMap.end.widgets.push(widget);
      alignmentLayerMap.end.width += getWidgetWidth(widget, false);
    } else if (child.align === "center") {
      alignmentLayerMap.center.widgets.push(widget);
      alignmentLayerMap.center.width += getWidgetWidth(widget, false);
    } else {
      alignmentLayerMap.start.widgets.push(widget);
      alignmentLayerMap.start.width += getWidgetWidth(widget, false);
    }
  }

  //using alignmentLayerMap calculate and update positions of each children within layer
  const { children, currWidgets, nextBottomRow } = placeWidgetsWithoutWrap(
    widgets,
    alignmentLayerMap,
    currentBottomRow,
    layerHeight,
  );

  currChildren = [...children];

  return {
    updatedWidgets: currWidgets,
    bottomRow: nextBottomRow,
    currChildren,
  };
}

/**
 * returns if the destinationLayout isMobile ("Logic can be updated later based on updated logic")
 * @param destinationLayout
 * @returns
 */
function getIsMobile(destinationLayout: SupportedLayouts) {
  return destinationLayout === "MOBILE";
}

/**
 * using alignmentLayerMap calculate and update positions of each children within layer without wrapping
 * @param widgets
 * @param alignmentLayerMap
 * @param currentBottomRow
 * @returns
 */
function placeWidgetsWithoutWrap(
  widgets: CanvasWidgetsReduxState,
  alignmentLayerMap: AlignmentLayerMap,
  currentBottomRow: number,
  layerHeight: number,
): {
  currWidgets: CanvasWidgetsReduxState;
  nextBottomRow: number;
  children: string[];
} {
  let children: string[] = [];
  let availableLeftColumn = 0;

  let maxBottomRow = currentBottomRow;

  let currWidgets = { ...widgets };

  const layerAlignmentDataList = Object.values(alignmentLayerMap);

  for (const layerAlignmentData of layerAlignmentDataList) {
    const { type, widgets, width } = layerAlignmentData;

    if (widgets.length > 0) {
      const {
        children: currChildren,
        convertedWidgets,
        currentAvailableLeftColumn,
        maxBottomRow: currMaxBottomRow,
      } = calculateWidgetDimensionForAlignment(
        currWidgets,
        availableLeftColumn,
        widgets,
        width,
        type,
        currentBottomRow,
        layerHeight,
      );
      currWidgets = { ...convertedWidgets };
      children = [...children, ...currChildren];
      availableLeftColumn = currentAvailableLeftColumn;
      maxBottomRow = Math.max(currMaxBottomRow, maxBottomRow);
    }
  }

  return { currWidgets, children, nextBottomRow: maxBottomRow };
}

/**
 * Calculate widget positions of each widget in alignedWidgets
 * @param widgets
 * @param availableLeftColumn currently available left column
 * @param alignedWidgets widgets to be updated in the current Alignment
 * @param alignedWidth width of all widgets in the alignment
 * @param flexLayerAlignment
 * @param currentBottomRow Current bottom Row.
 * @returns
 */
function calculateWidgetDimensionForAlignment(
  widgets: CanvasWidgetsReduxState,
  availableLeftColumn: number,
  alignedWidgets: FlattenedWidgetProps[],
  alignedWidth: number,
  flexLayerAlignment: FlexLayerAlignment,
  currentBottomRow: number,
  layerHeight: number,
): {
  convertedWidgets: CanvasWidgetsReduxState;
  children: string[];
  currentAvailableLeftColumn: number;
  maxBottomRow: number;
} {
  //Compare calculated leftColumn based on width to availableLeftColumn
  let currentAvailableLeftColumn = Math.max(
    getCalculatedLeftColumn(
      alignedWidth,
      GridDefaults.DEFAULT_GRID_COLUMNS,
      flexLayerAlignment,
    ),
    availableLeftColumn,
  );
  let maxBottomRow = currentBottomRow;

  let currWidgets: CanvasWidgetsReduxState = { ...widgets };
  const children = [];

  for (const widget of alignedWidgets) {
    const width = getWidgetWidth(widget, false);
    const height = getWidgetHeight(widget, false);

    //if the currentAvailableLeftColumn cannot possibly fit another widget within,
    //return with not adding the ids in the children, which can be further used to delete those widgets
    if (
      currentAvailableLeftColumn >=
      GridDefaults.DEFAULT_GRID_COLUMNS - HORIZONTAL_RESIZE_MIN_LIMIT
    )
      return {
        convertedWidgets: currWidgets,
        children,
        currentAvailableLeftColumn,
        maxBottomRow,
      };

    const leftColumn = currentAvailableLeftColumn;
    const rightColumn = Math.min(
      currentAvailableLeftColumn + width,
      GridDefaults.DEFAULT_GRID_COLUMNS,
    );
    const topRow = getTopRowFromVerticalAlignment(
      currentBottomRow,
      widget.flexVerticalAlignment,
      layerHeight,
      getWidgetHeight(widget, false),
    );

    //update positions
    currWidgets[widget.widgetId] = {
      ...widget,
      topRow,
      bottomRow: topRow + height,
      leftColumn: leftColumn,
      rightColumn: rightColumn,
    };

    //call convertAutoWidgetToFixed to recursively calculate positions
    currWidgets = convertAutoWidgetToFixed(currWidgets, widget.widgetId, false);
    children.push(widget.widgetId);
    currentAvailableLeftColumn = rightColumn;
    maxBottomRow = Math.max(maxBottomRow, currentBottomRow + height);
  }

  return {
    convertedWidgets: currWidgets,
    children,
    currentAvailableLeftColumn,
    maxBottomRow,
  };
}

/**
 * return the leftColumn required to add the widgets based
 * on totalWidth of all widgets and alignment
 * @param width
 * @param totalWidth
 * @param flexLayerAlignment
 * @returns
 */
function getCalculatedLeftColumn(
  width: number,
  totalWidth: number,
  flexLayerAlignment: FlexLayerAlignment,
): number {
  if (
    flexLayerAlignment === FlexLayerAlignment.Start ||
    flexLayerAlignment === FlexLayerAlignment.None
  ) {
    return 0;
  } else if (flexLayerAlignment === FlexLayerAlignment.Center) {
    return Math.ceil((totalWidth - width) / 2);
  } else {
    return totalWidth - width;
  }
}

/**
 * Get topRow based on vertical alignment of widget
 * @param currentBottomRow
 * @param flexVerticalAlignment
 * @param layerHeight
 * @param widgetHeight
 * @returns
 */
function getTopRowFromVerticalAlignment(
  currentBottomRow: number,
  flexVerticalAlignment: FlexVerticalAlignment | undefined,
  layerHeight: number,
  widgetHeight: number,
): number {
  if (!flexVerticalAlignment || !layerHeight || layerHeight <= widgetHeight) {
    return currentBottomRow;
  }

  if (flexVerticalAlignment === FlexVerticalAlignment.Center) {
    return Math.floor(currentBottomRow + (layerHeight - widgetHeight) / 2);
  } else if (flexVerticalAlignment === FlexVerticalAlignment.Bottom) {
    return currentBottomRow + layerHeight - widgetHeight;
  } else {
    return currentBottomRow;
  }
}
