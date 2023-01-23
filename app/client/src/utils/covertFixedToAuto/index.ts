import { FlexLayer } from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { GridDefaults } from "constants/WidgetConstants";
import _ from "lodash";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  Positioning,
  ResponsiveBehavior,
} from "utils/autoLayout/constants";
import WidgetFactory from "utils/WidgetFactory";
import { DSLWidget } from "widgets/constants";

const unHandledWidgets = ["LIST_WIDGET", "FORM_WIDGET", "MODAL_WIDGET"];
const nonFlexLayerWidgets = ["MODAL_WIDGET"];

export function convertDSLtoAuto(dsl: DSLWidget) {
  if (!dsl || !dsl.children || dsl.children.length < 1) return dsl;

  if (dsl.type === "CANVAS_WIDGET") {
    return { ...getAutoCanvasWidget(dsl) };
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

function getAutoCanvasWidget(dsl: DSLWidget): DSLWidget {
  const { calculatedBottomRow, children, flexLayers } = fitChildWidgetsIntoCell(
    dsl.children,
  );

  const bottomRow = calculatedBottomRow
    ? calculatedBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    : dsl.bottomRow;
  const minHeight = calculatedBottomRow
    ? calculatedBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT
    : dsl.minHeight;
  return {
    ...dsl,
    minHeight,
    bottomRow,
    children,
    flexLayers,
    useAutoLayout: true,
    positioning: Positioning.Vertical,
  };
}

function fitChildWidgetsIntoCell(
  widgets: DSLWidget[] | undefined,
): {
  children: DSLWidget[];
  flexLayers: FlexLayer[];
  calculatedBottomRow?: number;
} {
  const flexLayers: FlexLayer[] = [];

  if (!widgets || widgets.length < 1) {
    return { children: [], flexLayers };
  }

  const [nonLayerWidgets, currWidgets] = _.partition(
    widgets,
    (widget) => nonFlexLayerWidgets.indexOf(widget.type) > -1,
  );

  currWidgets.sort((a, b) => {
    if (a.topRow === b.topRow) {
      return a.leftColumn - b.leftColumn;
    }

    return a.topRow - b.topRow;
  });

  let modifiedWidgets: DSLWidget[] = [];
  let widgetsLeft = [...currWidgets];
  let childrenHeight = 0;
  while (widgetsLeft.length > 0) {
    const {
      flexLayer,
      layerHeight,
      leftOverWidgets,
      widgetsInLayer,
    } = getNextLayer(widgetsLeft);
    widgetsLeft = [...leftOverWidgets];
    modifiedWidgets = modifiedWidgets.concat(widgetsInLayer);
    flexLayers.push(flexLayer);

    childrenHeight += layerHeight;
  }

  for (const nonLayerWidget of nonLayerWidgets) {
    modifiedWidgets.push(
      unHandledWidgets.indexOf(nonLayerWidget.type) < 0
        ? convertDSLtoAuto(nonLayerWidget)
        : { ...nonLayerWidget, positioning: Positioning.Fixed },
    );
  }

  return {
    children: modifiedWidgets,
    flexLayers,
    calculatedBottomRow: childrenHeight + GridDefaults.CANVAS_EXTENSION_OFFSET,
  };
}

function getNextLayer(
  currWidgets: DSLWidget[],
): {
  flexLayer: FlexLayer;
  widgetsInLayer: DSLWidget[];
  leftOverWidgets: DSLWidget[];
  layerHeight: number;
} {
  const currentLayerChildren = [];

  const { index, topLeftMostWidget } = getTopLeftMostWidget(currWidgets);

  const {
    alignmentMap,
    isSameWidgetType,
    leftOverWidgets,
    maxBottomRow,
    minTopRow,
    totalWidgetsWidth,
    widgetsInLayer,
  } = getWidgetsInLayer(topLeftMostWidget, index, currWidgets);

  const modifiedWidgetsInLayer = [];
  let alignment = FlexLayerAlignment.None;

  for (const widget of widgetsInLayer) {
    const currWidget =
      unHandledWidgets.indexOf(widget.type) < 0
        ? convertDSLtoAuto(widget)
        : { ...widget, positioning: Positioning.Fixed };
    const widgetConfig = WidgetFactory.getWidgetConfigMap(currWidget.type);
    const responsiveBehavior =
      (widgetConfig.responsiveBehavior as ResponsiveBehavior) ||
      ResponsiveBehavior.Hug;

    currWidget.minWidth = widgetConfig.minWidth || FILL_WIDGET_MIN_WIDTH;

    const { leftColumn, rightColumn } = getModifiedWidgetDimension(
      currWidget,
      widgetsInLayer,
      totalWidgetsWidth,
      isSameWidgetType,
      responsiveBehavior,
    );

    alignment = alignmentMap[currWidget.widgetId] || FlexLayerAlignment.Start;
    const flexVerticalAlignment = getWidgetVerticalAlignment(
      currWidget,
      minTopRow,
      maxBottomRow,
    );

    modifiedWidgetsInLayer.push({
      ...currWidget,
      leftColumn,
      rightColumn,
      responsiveBehavior,
      alignment,
      flexVerticalAlignment,
    });
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

function getTopLeftMostWidget(widgets: DSLWidget[]) {
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

function areWidgetsOverlapping(r1: DSLWidget, r2: DSLWidget) {
  return !(
    r2.leftColumn >= r1.rightColumn ||
    r2.rightColumn <= r1.leftColumn ||
    r2.topRow >= r1.bottomRow ||
    r2.bottomRow <= r1.topRow
  );
}

function getWidgetsInLayer(
  topLeftMostWidget: DSLWidget,
  index: number,
  currWidgets: DSLWidget[],
): {
  widgetsInLayer: DSLWidget[];
  leftOverWidgets: DSLWidget[];
  maxBottomRow: number;
  minTopRow: number;
  isSameWidgetType: boolean;
  totalWidgetsWidth: number;
  alignmentMap: { [key: string]: FlexLayerAlignment };
} {
  const widgetsInLayer = [topLeftMostWidget];
  const leftOverWidgets = [...currWidgets];

  leftOverWidgets.splice(index, 1);

  let totalWidgetsWidth =
    topLeftMostWidget.rightColumn - topLeftMostWidget.leftColumn;

  let currCheckWidget = {
    ...topLeftMostWidget,
    leftColumn: topLeftMostWidget.rightColumn,
    rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
  };
  let isSameWidgetType = true;
  const widgetType = topLeftMostWidget.type;

  let maxBottomRow = currCheckWidget.bottomRow;
  let minTopRow = currCheckWidget.topRow;

  let prevWidgetDistance = topLeftMostWidget.rightColumn;
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

    if (!nextWidgetInLayer) {
      groupedWidgets.push(currentGroup);
      break;
    }

    widgetsInLayer.push(nextWidgetInLayer);
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
    totalWidgetsWidth +=
      nextWidgetInLayer.rightColumn - nextWidgetInLayer.leftColumn;
    if (widgetType !== nextWidgetInLayer.type) isSameWidgetType = false;
    if (currIndex !== undefined) leftOverWidgets.splice(currIndex, 1);
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
    isSameWidgetType,
    totalWidgetsWidth,
    alignmentMap,
  };
}

function getModifiedWidgetDimension(
  currWidget: DSLWidget,
  widgetsInLayer: DSLWidget[],
  totalWidgetsWidth: number,
  isSameWidgetType: boolean,
  responsiveBehavior: ResponsiveBehavior,
): { leftColumn: number; rightColumn: number } {
  const { leftColumn, rightColumn } = currWidget;
  if (responsiveBehavior === ResponsiveBehavior.Fill)
    return { leftColumn, rightColumn };

  if (
    widgetsInLayer.length > 1 &&
    isSameWidgetType &&
    totalWidgetsWidth / GridDefaults.DEFAULT_GRID_COLUMNS > 0.75
  ) {
    return {
      leftColumn,
      rightColumn:
        leftColumn + GridDefaults.DEFAULT_GRID_COLUMNS / widgetsInLayer.length,
    };
  }

  return { leftColumn, rightColumn };
}

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

  return score === undefined || score === NaN ? -1 : score;
}

function processGroupedWidgets(
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

function getCondensedGroupedWidgets(
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
      index: i,
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

  let tempWidgetIds: any[] = [],
    groupLeftColumn = groupedWidgets[0].leftColumn,
    groupRightColumn = groupedWidgets[0].rightColumn;
  for (let i = 0; i < groupedWidgets.length; i++) {
    if (i < gapIndex || i === groupedWidgets.length - 1) {
      tempWidgetIds = tempWidgetIds.concat(groupedWidgets[i].widgets);
      groupRightColumn = groupedWidgets[i].rightColumn;
    }

    if (i === gapIndex) {
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

      tempWidgetIds = [...groupedWidgets[i].widgets];
      groupLeftColumn = groupedWidgets[i].leftColumn;
      groupRightColumn = groupedWidgets[i].rightColumn;
    }
  }

  return condensedGroupedWidgets;
}

function getLayerAlignmentBasedOnScore(alignmentScore: number) {
  if (alignmentScore > 0.4) return FlexLayerAlignment.End;
  else if (alignmentScore < -0.4) return FlexLayerAlignment.Start;
  else return FlexLayerAlignment.Center;
}

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

function getWidgetVerticalAlignment(
  widget: DSLWidget,
  minTopRow: number,
  maxBottomRow: number,
): FlexVerticalAlignment {
  const alignmentScore = getAlignmentScore(
    widget.topRow,
    widget.bottomRow,
    minTopRow,
    maxBottomRow,
  );

  if (alignmentScore < -0.3) return FlexVerticalAlignment.Top;
  else if (alignmentScore > 0.3) return FlexVerticalAlignment.Bottom;
  else return FlexVerticalAlignment.Center;
}
