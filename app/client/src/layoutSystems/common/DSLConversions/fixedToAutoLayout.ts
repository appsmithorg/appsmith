import { nestDSL, flattenDSL } from "@shared/dsl";
import {
  GridDefaults,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { get, partition } from "lodash";
import { alterLayoutForDesktop } from "layoutSystems/autolayout/utils/AutoLayoutUtils";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import {
  isDynamicValue,
  isPathDynamicTrigger,
} from "utils/DynamicBindingUtils";
import WidgetFactory from "WidgetProvider/factory";
// import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "WidgetProvider/constants";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";

const unHandledWidgets = ["LIST_WIDGET"];
const specialCaseWidgets = ["LIST_WIDGET_V2"];
const nonFlexLayerWidgets = ["MODAL_WIDGET"];

/**
 * This method converts the fixed to auto-layout and updates the positions
 * @param dsl DSL to be Converted
 * @returns dsl in an AutoLayout dsl format
 */
export default function convertDSLtoAutoAndUpdatePositions(
  dsl: DSLWidget,
  canvasWidth = layoutConfigurations.DESKTOP.maxWidth,
) {
  const autoDSL = convertDSLtoAuto(dsl);

  if (!autoDSL || !autoDSL.children) return autoDSL;

  const normalizedAutoDSL = flattenDSL(autoDSL);

  const alteredNormalizedAutoDSL = alterLayoutForDesktop(
    normalizedAutoDSL,
    MAIN_CONTAINER_WIDGET_ID,
    canvasWidth,
    true,
  );

  const alteredAutoDSL: DSLWidget = nestDSL(alteredNormalizedAutoDSL);

  return alteredAutoDSL;
}

/**
 *
 * @param dsl DSL to be Converted
 * @returns dsl in an AutoLayout dsl format
 */
export function convertDSLtoAuto(dsl: DSLWidget) {
  if (!dsl || !dsl.children) return dsl;

  if (dsl.type === "CANVAS_WIDGET") {
    return { ...getAutoCanvasWidget(dsl) };
  }

  if (specialCaseWidgets.indexOf(dsl.type) > -1) {
    return handleSpecialCaseWidgets(dsl);
  }

  const currDSL: DSLWidget = { ...dsl, children: [] };

  for (const child of dsl.children || []) {
    if (child.type === "CANVAS_WIDGET") {
      currDSL.children?.push(getAutoCanvasWidget(child));
    } else {
      currDSL.children?.push(convertDSLtoAuto(child));
    }
  }

  return currDSL;
}

/**
 * This is specifically for Auto widget
 * @param dsl
 * @returns auto-layout converted Auto Widget
 */
export function getAutoCanvasWidget(dsl: DSLWidget): DSLWidget {
  const { calculatedBottomRow, children, flexLayers } =
    fitChildWidgetsIntoLayers(dsl.children);

  let bottomRow = calculatedBottomRow
    ? calculatedBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    : dsl.bottomRow;
  let minHeight = calculatedBottomRow
    ? calculatedBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    : dsl.minHeight;

  if (dsl.widgetId === MAIN_CONTAINER_WIDGET_ID) {
    bottomRow = Math.max(bottomRow, dsl.bottomRow);
    minHeight =
      minHeight && dsl.minHeight && Math.max(minHeight, dsl.minHeight);
  }

  // Add responsive propertied to the Canvas Widget props
  return {
    ...dsl,
    minHeight,
    bottomRow,
    children,
    flexLayers,
    useAutoLayout: true,
    responsiveBehavior: ResponsiveBehavior.Fill,
    positioning: Positioning.Vertical,
  };
}

/**
 * This method fits Children widgets into respective cells and layers
 * @param widgets
 * @returns modified Children, FlexLayers and new bottom most row of the Canvas
 */
export function fitChildWidgetsIntoLayers(widgets: DSLWidget[] | undefined): {
  children: DSLWidget[];
  flexLayers: FlexLayer[];
  calculatedBottomRow?: number;
} {
  const flexLayers: FlexLayer[] = [];

  if (!widgets || widgets.length < 1) {
    return { children: [], flexLayers };
  }

  //separate the widgets to be skipped
  const [nonLayerWidgets, currWidgets] = partition(
    widgets,
    (widget) => nonFlexLayerWidgets.indexOf(widget.type) > -1,
  );

  //Sort Widgets from top to bottom
  currWidgets.sort((a, b) => {
    if (a.topRow === b.topRow) {
      return a.leftColumn - b.leftColumn;
    }

    return a.topRow - b.topRow;
  });

  let modifiedWidgets: DSLWidget[] = [];
  let widgetsLeft = [...currWidgets];
  let childrenHeight = 0;

  //Iterate till widgets are left in the Children array
  while (widgetsLeft.length > 0) {
    const { flexLayer, layerHeight, leftOverWidgets, widgetsInLayer } =
      getNextLayer(widgetsLeft);

    widgetsLeft = [...leftOverWidgets];
    modifiedWidgets = modifiedWidgets.concat(widgetsInLayer);
    flexLayers.push(flexLayer);

    childrenHeight += layerHeight;
  }

  //Add unhandled widgets to children
  for (const nonLayerWidget of nonLayerWidgets) {
    const { propertyUpdates, removableDynamicBindingPathList } =
      getPropertyUpdatesBasedOnConfig(nonLayerWidget);

    modifiedWidgets.push(
      unHandledWidgets.indexOf(nonLayerWidget.type) < 0
        ? verifyDynamicPathBindingList(
            { ...convertDSLtoAuto(nonLayerWidget), ...propertyUpdates },
            removableDynamicBindingPathList,
          )
        : { ...nonLayerWidget, positioning: Positioning.Fixed },
    );

    flexLayers.push({
      children: [
        {
          id: nonLayerWidget.widgetId,
          align: FlexLayerAlignment.Center,
        },
      ],
    });
  }

  return {
    children: modifiedWidgets,
    flexLayers,
    calculatedBottomRow: childrenHeight + GridDefaults.CANVAS_EXTENSION_OFFSET,
  };
}

/**
 * get next layer of widgets of all the widgets supplied and return left Over Widgets
 * @param currWidgets
 * @returns
 */
function getNextLayer(currWidgets: DSLWidget[]): {
  flexLayer: FlexLayer;
  widgetsInLayer: DSLWidget[];
  leftOverWidgets: DSLWidget[];
  layerHeight: number;
} {
  const currentLayerChildren = [];

  const { index, topLeftMostWidget } = getTopLeftMostWidget(currWidgets);

  const {
    alignmentMap,
    leftOverWidgets,
    maxBottomRow,
    minTopRow,
    widgetsInLayer,
  } = getWidgetsInLayer(topLeftMostWidget, index, currWidgets);

  const modifiedWidgetsInLayer = [];
  let alignment = FlexLayerAlignment.None;

  //Recursively call convertDSLtoAuto to convert Children Widgets
  for (const widget of widgetsInLayer) {
    const currWidget =
      unHandledWidgets.indexOf(widget.type) < 0
        ? convertDSLtoAuto(widget)
        : { ...widget, positioning: Positioning.Fixed };

    const { propertyUpdates, removableDynamicBindingPathList } =
      getPropertyUpdatesBasedOnConfig(currWidget);

    //Get Alignment of the Widget
    alignment = alignmentMap[currWidget.widgetId] || FlexLayerAlignment.Start;
    const flexVerticalAlignment = getWidgetVerticalAlignment(currWidget);

    const modifiedCurrentWidget =
      removeNullValuesFromObject<DSLWidget>(currWidget);

    modifiedWidgetsInLayer.push(
      verifyDynamicPathBindingList(
        {
          ...modifiedCurrentWidget,
          ...propertyUpdates,
          alignment,
          flexVerticalAlignment,
        },
        removableDynamicBindingPathList,
      ),
    );

    //If the widget type is not to be added in layer then add only to Children
    if (nonFlexLayerWidgets.indexOf(currWidget.type) < 0) {
      currentLayerChildren.push({
        id: currWidget.widgetId,
        align: alignment,
      });
    }
  }

  const flexLayer = { children: currentLayerChildren };

  return {
    flexLayer,
    widgetsInLayer: modifiedWidgetsInLayer,
    leftOverWidgets,
    layerHeight: maxBottomRow - minTopRow,
  };
}

/**
 * This method returns the left most widget of the top layer among the left over widgets
 * @param widgets
 * @returns top left most widgets and index of it in the array
 */
export function getTopLeftMostWidget(widgets: DSLWidget[]) {
  const topMostWidget = widgets[0];

  let modifiedTopMostWidget: DSLWidget = {
    ...topMostWidget,
    leftColumn: 0,
  };

  let topLeftMostWidget: DSLWidget = { ...topMostWidget };
  let index = 0;

  for (let i = 0; i < widgets.length; i++) {
    const currWidget = widgets[i];

    if (currWidget.topRow >= modifiedTopMostWidget.bottomRow) break;

    if (
      currWidget.widgetId === modifiedTopMostWidget.widgetId &&
      !areWidgetsOverlapping(currWidget, modifiedTopMostWidget)
    )
      continue;

    if (
      currWidget.leftColumn <= topLeftMostWidget.leftColumn &&
      currWidget.topRow < topLeftMostWidget.bottomRow
    ) {
      topLeftMostWidget = { ...currWidget };
      modifiedTopMostWidget = {
        ...currWidget,
        leftColumn: 0,
      };
      index = i;
    }
  }

  return { topLeftMostWidget, index };
}

/**
 * This method generates the widgets in the layer
 * @param topLeftMostWidget
 * @param index
 * @param currWidgets
 * @returns widgetsInLayer, leftOverWidgets, alignment of all widgets in the layer
 */
function getWidgetsInLayer(
  topLeftMostWidget: DSLWidget,
  index: number,
  currWidgets: DSLWidget[],
): {
  widgetsInLayer: DSLWidget[];
  leftOverWidgets: DSLWidget[];
  maxBottomRow: number;
  minTopRow: number;
  alignmentMap: { [key: string]: FlexLayerAlignment };
} {
  const widgetsInLayer = [topLeftMostWidget];
  const leftOverWidgets = [...currWidgets];

  leftOverWidgets.splice(index, 1);

  //This is the widget against other widgets are checked against
  let currCheckWidget = {
    ...topLeftMostWidget,
    leftColumn: topLeftMostWidget.rightColumn,
    rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  let maxBottomRow = currCheckWidget.bottomRow;
  let minTopRow = currCheckWidget.topRow;

  let prevWidgetDistance = topLeftMostWidget.rightColumn;
  // current Group to group widgets, if the distance between them is greater than
  // 10% of the total width of canvas
  let currentGroup = {
    widgets: [topLeftMostWidget.widgetId],
    leftColumn: topLeftMostWidget.leftColumn,
    rightColumn: topLeftMostWidget.rightColumn,
  };
  const groupedWidgets = [];

  if (leftOverWidgets.length === 0) {
    groupedWidgets.push(currentGroup);
  }

  while (leftOverWidgets.length > 0) {
    const { currIndex, nextWidgetInLayer } = getNextWidgetInLayer(
      leftOverWidgets,
      maxBottomRow,
      currCheckWidget,
    );

    //add current group to widget groups
    if (!nextWidgetInLayer) {
      groupedWidgets.push(currentGroup);
      break;
    }

    widgetsInLayer.push(nextWidgetInLayer);

    //If space between widgets is greater than 10% add current group to array of groups
    // or add widget to the current Group
    if (
      (nextWidgetInLayer.leftColumn - prevWidgetDistance) /
        GridDefaults.DEFAULT_GRID_COLUMNS >=
      0.1
    ) {
      groupedWidgets.push(currentGroup);
      currentGroup = {
        widgets: [nextWidgetInLayer.widgetId],
        leftColumn: nextWidgetInLayer.leftColumn,
        rightColumn: nextWidgetInLayer.rightColumn,
      };
    } else {
      currentGroup.widgets.push(nextWidgetInLayer.widgetId);
      currentGroup.rightColumn = nextWidgetInLayer.rightColumn;
    }

    prevWidgetDistance = nextWidgetInLayer.rightColumn;

    if (currIndex !== undefined) {
      leftOverWidgets.splice(currIndex, 1);
    }

    maxBottomRow = Math.max(maxBottomRow, nextWidgetInLayer.bottomRow);
    minTopRow = Math.min(minTopRow, nextWidgetInLayer.topRow);

    currCheckWidget = {
      ...nextWidgetInLayer,
      leftColumn: nextWidgetInLayer.rightColumn,
      rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
    };

    if (leftOverWidgets.length === 0) {
      groupedWidgets.push(currentGroup);
    }
  }

  const alignmentMap = processGroupedWidgets(groupedWidgets);

  return {
    widgetsInLayer,
    leftOverWidgets,
    maxBottomRow,
    minTopRow,
    alignmentMap,
  };
}

/**
 * This method gets the next widget in layer and also the index of it in the Array
 * @param leftOverWidgets
 * @param maxBottomRow
 * @param currCheckWidget
 * @returns
 */
function getNextWidgetInLayer(
  leftOverWidgets: DSLWidget[],
  maxBottomRow: number,
  currCheckWidget: DSLWidget,
) {
  let nextWidgetInLayer: DSLWidget | undefined, currIndex;

  for (let i = 0; i < leftOverWidgets.length; i++) {
    const currWidget = leftOverWidgets[i];

    if (currWidget.topRow >= maxBottomRow) break;

    if (!areWidgetsOverlapping(currWidget, currCheckWidget)) continue;

    if (
      !nextWidgetInLayer ||
      (currWidget.leftColumn < nextWidgetInLayer.leftColumn &&
        currWidget.topRow <= nextWidgetInLayer.bottomRow)
    ) {
      nextWidgetInLayer = { ...currWidget };
      currIndex = i;
    }
  }

  return { currIndex, nextWidgetInLayer };
}

/**
 * This method scores the alignment of the widget with total width,
 * This has a range of -1 to 1, -1 being Start, 0 being center, 1 being end.
 * The value varies in a logarithmic curve in such a way that
 * closer to the edges the value increases substantially rather than minutely around the center
 * This also takes into account the width of the widget itself to give an accurate score for widgets of various sizes
 * @param widgetMin
 * @param widgetMax
 * @param totalMin
 * @param totalMax
 * @returns number
 */
export function getAlignmentScore(
  widgetMin: number,
  widgetMax: number,
  totalMin: number,
  totalMax: number,
) {
  const width = widgetMax - widgetMin;
  const totalWidth = totalMax - totalMin;

  if (width === totalWidth) return -1;

  const orientationScore =
    (totalMax - widgetMax - (widgetMin - totalMin)) / totalWidth;

  const tempWidgetMin = totalMin,
    tempWidgetMax = totalMin + width;
  const maxScore =
    (totalMax - tempWidgetMax - (tempWidgetMin - totalMin)) / totalWidth;

  const directionalIndicator = orientationScore < 0 ? 1 : -1;

  const score = parseFloat(
    (
      (directionalIndicator * orientationScore * orientationScore) /
      (maxScore * maxScore)
    ).toFixed(2),
  );

  return score === undefined || Number.isNaN(score) ? -1 : score;
}

/**
 * This Method takes in groups of widgets and return alignments of all the widgets.
 * @param groupedWidgets
 * @returns alignments of individual widget
 */
export function processGroupedWidgets(
  groupedWidgets: {
    widgets: string[];
    leftColumn: number;
    rightColumn: number;
  }[],
) {
  let condensedGroupedWidgets = [...groupedWidgets];

  if (groupedWidgets.length > 3) {
    condensedGroupedWidgets = getCondensedGroupedWidgets(groupedWidgets);
  }

  let widgetAlignments: { [key: string]: FlexLayerAlignment } = {};

  switch (condensedGroupedWidgets.length) {
    //Check the alignment of the group and assign the value to all the widgets
    case 1:
      const alignmentScore = getAlignmentScore(
        condensedGroupedWidgets[0].leftColumn,
        condensedGroupedWidgets[0].rightColumn,
        0,
        GridDefaults.DEFAULT_GRID_COLUMNS,
      );
      const alignment = getLayerAlignmentBasedOnScore(alignmentScore);

      widgetAlignments = createAlignmentMapFromGroupedWidgets(
        condensedGroupedWidgets[0],
        alignment,
      );
      break;
    //same as previous case
    case 2:
      const alignmentScore1 = getAlignmentScore(
        condensedGroupedWidgets[0].leftColumn,
        condensedGroupedWidgets[0].rightColumn,
        0,
        GridDefaults.DEFAULT_GRID_COLUMNS,
      );
      const alignment1 = getLayerAlignmentBasedOnScore(alignmentScore1);

      const alignmentScore2 = getAlignmentScore(
        condensedGroupedWidgets[1].leftColumn,
        condensedGroupedWidgets[1].rightColumn,
        0,
        GridDefaults.DEFAULT_GRID_COLUMNS,
      );
      const alignment2 = getLayerAlignmentBasedOnScore(alignmentScore2);

      widgetAlignments = createAlignmentMapFromGroupedWidgets(
        condensedGroupedWidgets[0],
        alignment2,
      );

      widgetAlignments = {
        ...createAlignmentMapFromGroupedWidgets(
          condensedGroupedWidgets[0],
          alignment1,
        ),
        ...createAlignmentMapFromGroupedWidgets(
          condensedGroupedWidgets[1],
          alignment2,
        ),
      };
      break;
    //If there are three distinct groups, they can be assigned to distinct alignments
    case 3:
      widgetAlignments = {
        ...createAlignmentMapFromGroupedWidgets(
          condensedGroupedWidgets[0],
          FlexLayerAlignment.Start,
        ),
        ...createAlignmentMapFromGroupedWidgets(
          condensedGroupedWidgets[1],
          FlexLayerAlignment.Center,
        ),
        ...createAlignmentMapFromGroupedWidgets(
          condensedGroupedWidgets[2],
          FlexLayerAlignment.End,
        ),
      };
      break;
  }

  return widgetAlignments;
}

/**
 * If there are more than 3 distinct groups, they will be condensed into 3 different groups
 * @param groupedWidgets
 * @returns
 */
export function getCondensedGroupedWidgets(
  groupedWidgets: {
    widgets: string[];
    leftColumn: number;
    rightColumn: number;
  }[],
) {
  if (groupedWidgets.length <= 3) return groupedWidgets;

  let gapsArray = [];

  for (let i = 1; i < groupedWidgets.length; i++) {
    gapsArray.push({
      gap: groupedWidgets[i].leftColumn - groupedWidgets[i - 1].rightColumn,
      index: i - 1,
    });
  }

  gapsArray = gapsArray
    .sort(
      (
        a: { gap: number; index: number },
        b: { gap: number; index: number },
      ) => {
        return b.gap - a.gap;
      },
    )
    .slice(0, 2)
    .sort(
      (
        a: { gap: number; index: number },
        b: { gap: number; index: number },
      ) => {
        return a.index - b.index;
      },
    );

  const condensedGroupedWidgets = [];

  let count = 0;
  let gapIndex = gapsArray[count].index;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tempWidgetIds: any[] = [],
    groupLeftColumn = groupedWidgets[0].leftColumn,
    groupRightColumn = groupedWidgets[0].rightColumn;

  for (let i = 0; i < groupedWidgets.length; i++) {
    if (i < gapIndex) {
      tempWidgetIds = tempWidgetIds.concat(groupedWidgets[i].widgets);
      groupLeftColumn =
        tempWidgetIds.length > 0
          ? groupLeftColumn
          : groupedWidgets[i].leftColumn;
      groupRightColumn = groupedWidgets[i].rightColumn;
    }

    if (i === gapIndex) {
      tempWidgetIds = tempWidgetIds.concat(groupedWidgets[i].widgets);
      groupLeftColumn =
        tempWidgetIds.length > 0
          ? groupLeftColumn
          : groupedWidgets[i].leftColumn;
      groupRightColumn = groupedWidgets[i].rightColumn;

      condensedGroupedWidgets.push({
        widgets: tempWidgetIds,
        leftColumn: groupLeftColumn,
        rightColumn: groupRightColumn,
      });

      if (count === 0) {
        count = 1;
        gapIndex = gapsArray[count].index;
      } else {
        gapIndex = groupedWidgets.length - 1;
      }

      tempWidgetIds = [];
      groupRightColumn = groupedWidgets[i].rightColumn;
    }
  }

  return condensedGroupedWidgets;
}

/**
 * Method to get Alignment based on score
 * @param alignmentScore
 * @returns
 */
function getLayerAlignmentBasedOnScore(alignmentScore: number) {
  if (alignmentScore > 0.4) return FlexLayerAlignment.End;
  else if (alignmentScore < -0.4) return FlexLayerAlignment.Start;
  else return FlexLayerAlignment.Center;
}

/**
 * Create Alignment map of widgets
 * @param groupedWidget
 * @param alignment
 * @returns
 */
function createAlignmentMapFromGroupedWidgets(
  groupedWidget: { widgets: string[]; leftColumn: number; rightColumn: number },
  alignment: FlexLayerAlignment,
) {
  const alignmentMap: { [key: string]: FlexLayerAlignment } = {};

  for (const widgetId of groupedWidget.widgets) {
    alignmentMap[widgetId] = alignment;
  }

  return alignmentMap;
}

/**
 * Method to get Vertical Alignment of widget
 * @param widget
 * @returns
 */
function getWidgetVerticalAlignment(widget: DSLWidget): FlexVerticalAlignment {
  const widgetConfig = WidgetFactory.widgetConfigMap.get(widget.type);

  return widgetConfig?.flexVerticalAlignment || FlexVerticalAlignment.Bottom;
}

function areWidgetsOverlapping(r1: DSLWidget, r2: DSLWidget) {
  return !(
    r2.leftColumn >= r1.rightColumn ||
    r2.rightColumn <= r1.leftColumn ||
    r2.topRow >= r1.bottomRow ||
    r2.bottomRow <= r1.topRow
  );
}

/**
 * Methods to get all the property updates required based on teh config
 * @param widget
 * @returns
 */
function getPropertyUpdatesBasedOnConfig(widget: DSLWidget) {
  const widgetConfig = WidgetFactory.widgetConfigMap.get(widget.type);

  let propertyUpdates: Partial<WidgetProps> = {};
  const removableDynamicBindingPathList: string[] = [];

  //get Responsive Behaviour
  propertyUpdates.responsiveBehavior =
    (widgetConfig?.responsiveBehavior as ResponsiveBehavior) ||
    ResponsiveBehavior.Hug;

  if (widgetConfig?.dynamicHeight && widgetConfig.isCanvas) {
    propertyUpdates.dynamicHeight = widgetConfig.dynamicHeight;
  }

  //Add widget specific property Defaults, for autoLayout widget
  const { disabledPropsDefaults } =
    WidgetFactory.getWidgetAutoLayoutConfig(widget.type) || {};

  if (disabledPropsDefaults) {
    propertyUpdates = {
      ...propertyUpdates,
      ...disabledPropsDefaults,
    };
  }

  //get minWidth of the type
  if (widgetConfig?.minWidth) {
    propertyUpdates.minWidth = widgetConfig.minWidth;
  }

  //Delete Dynamic values as they fail, while saving the application layout
  for (const propertyPath in propertyUpdates) {
    if (widget[propertyPath] && isDynamicValue(widget[propertyPath])) {
      removableDynamicBindingPathList.push(propertyPath);
    }
  }

  return { propertyUpdates, removableDynamicBindingPathList };
}

function handleSpecialCaseWidgets(dsl: DSLWidget): DSLWidget {
  if (dsl.type === "LIST_WIDGET_V2" && dsl?.children?.[0]?.children?.[0]) {
    dsl.children[0].children = [convertDSLtoAuto(dsl.children[0].children[0])];
    const flexLayers: FlexLayer[] = [
      {
        children: [
          {
            id: dsl.children[0].children[0].widgetId,
            align: FlexLayerAlignment.Center,
          },
        ],
      },
    ];

    dsl.children[0].flexLayers = flexLayers;
    dsl.children[0].responsiveBehavior = ResponsiveBehavior.Fill;
    dsl.children[0].positioning = Positioning.Vertical;
    dsl.children[0].children[0].isFlexChild = true;
    dsl.children[0].children[0].isListItemContainer = true;
  }

  return dsl;
}

/**
 * Removes null values from object
 * @param object
 * @returns
 */
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeNullValuesFromObject<T extends { [key: string]: any }>(
  object: T,
): T {
  const copiedObject: T = { ...object };

  //remove null values and dynamic trigger paths which have "null" values
  Object.keys(copiedObject).forEach(
    (k) =>
      copiedObject[k] == null ||
      (isPathDynamicTrigger(copiedObject, k) &&
        copiedObject[k] === "null" &&
        delete copiedObject[k]),
  );

  return copiedObject;
}

/**
 * remove removableDynamicBindingPathList values from DynamicBindingPathList
 * @param widget
 * @param removableDynamicBindingPathList
 * @returns
 */
function verifyDynamicPathBindingList(
  widget: DSLWidget,
  removableDynamicBindingPathList: string[],
) {
  if (!removableDynamicBindingPathList || !widget.dynamicBindingPathList)
    return widget;

  const dynamicBindingPathList: DynamicPath[] = [];

  for (const dynamicBindingPath of widget.dynamicBindingPathList) {
    //if the values are not dynamic, remove from the dynamic binding path list
    const dynamicValue = get(widget, dynamicBindingPath.key);

    if (!dynamicValue || !isDynamicValue(dynamicValue)) {
      continue;
    }

    if (removableDynamicBindingPathList.indexOf(dynamicBindingPath.key) < 0) {
      dynamicBindingPathList.push(dynamicBindingPath);
    }
  }

  widget.dynamicBindingPathList = dynamicBindingPathList;

  return widget;
}
