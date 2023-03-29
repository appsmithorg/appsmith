import {
  GridDefaults,
  layoutConfigurations,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import CanvasWidgetsNormalizer from "normalizers/CanvasWidgetsNormalizer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { HORIZONTAL_RESIZE_MIN_LIMIT } from "reflow/reflowTypes";
import {
  alterLayoutForDesktop,
  alterLayoutForMobile,
} from "utils/autoLayout/AutoLayoutUtils";
import { Positioning } from "utils/autoLayout/constants";
import {
  getTopRow,
  getBottomRow,
  getLeftColumn,
  getRightColumn,
} from "utils/autoLayout/flexWidgetUtils";
import type { DSLWidget } from "widgets/constants";

const deletedResponsiveProperties = [
  "mobileLeftColumn",
  "mobileRightColumn",
  "mobileTopRow",
  "mobileBottomRow",
  "responsiveBehavior",
  "alignment",
  "flexVerticalAlignment",
  "widthInPercentage",
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
  const allWidgets =
    CanvasWidgetsNormalizer.normalize(dsl).entities.canvasWidgets;

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

  const mobileWidth =
    layoutConfigurations[destinationLayout].maxWidth ||
    layoutConfigurations.MOBILE.maxWidth;
  const deskTopWidth =
    layoutConfigurations[destinationLayout].maxWidth ||
    layoutConfigurations.DESKTOP.maxWidth;
  const alteredWidgets = isMobile
    ? alterLayoutForMobile(
        widgets,
        MAIN_CONTAINER_WIDGET_ID,
        mobileWidth,
        mobileWidth,
      )
    : alterLayoutForDesktop(widgets, MAIN_CONTAINER_WIDGET_ID, deskTopWidth);

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
    if (
      canvasWidget &&
      canvasWidget.children &&
      canvasWidget.children.length > 0
    ) {
      //even if it is not autoLayout, remove all the unwanted props from it's children
      for (const childId of canvasWidget.children) {
        const currWidget = { ...widgets[childId] };

        if (!currWidget) continue;

        for (const responsiveProperty of deletedResponsiveProperties) {
          delete currWidget[responsiveProperty];
        }

        widgets[childId] = { ...currWidget };
      }
    }

    return widgets;
  }

  //if Mobile, use the existing already calculated positions in `alterLayoutForMobile`
  if (isMobile) {
    return processMobileCanvasChildren(widgets, canvasId);
  } else {
    return processCanvasChildren(widgets, canvasId);
  }
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
 * Process the mobile canvas Widgets with already existing positions/dimensions
 * @param widgets
 * @param canvasId
 * @returns
 */
function processCanvasChildren(
  widgets: CanvasWidgetsReduxState,
  canvasId: string,
) {
  const canvasWidget = { ...widgets[canvasId] };

  let currWidgets = { ...widgets };

  const widgetsToDelete: string[] = [];

  for (const childId of canvasWidget.children || []) {
    const currWidget = currWidgets[childId];

    const leftColumn = getLeftColumn(currWidget, false);
    let rightColumn = getRightColumn(currWidget, false);

    if (
      leftColumn >
      GridDefaults.DEFAULT_GRID_COLUMNS - HORIZONTAL_RESIZE_MIN_LIMIT
    ) {
      delete currWidgets[childId];
      widgetsToDelete.push(childId);
      continue;
    }

    if (rightColumn > GridDefaults.DEFAULT_GRID_COLUMNS) {
      rightColumn = GridDefaults.DEFAULT_GRID_COLUMNS;
    }

    currWidgets[childId] = {
      ...currWidget,
      topRow: getTopRow(currWidget, false),
      bottomRow: getBottomRow(currWidget, false),
      leftColumn,
      rightColumn,
    };

    currWidgets = convertAutoWidgetToFixed(currWidgets, childId, false);
  }

  canvasWidget.children = canvasWidget.children?.filter(
    (childId) => !widgetsToDelete.includes(childId),
  );

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
 * returns if the destinationLayout isMobile ("Logic can be updated later based on updated logic")
 * @param destinationLayout
 * @returns
 */
function getIsMobile(destinationLayout: SupportedLayouts) {
  return destinationLayout === "MOBILE";
}
