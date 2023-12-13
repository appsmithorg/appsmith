import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { addWidgetsToSection } from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { generateReactKey } from "utils/generators";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import type { WidgetProps } from "widgets/BaseWidget";
import { addNewChildToDSL } from "../AnvilDraggingSagas";
import { sectionPreset } from "layoutSystems/anvil/layoutComponents/presets/sectionPreset";

/**
 * Function to get the highlight information for the last column of a Section Widget
 * @param sectionWidget - The Section Widget for which to get the highlight information
 * @returns An object representing the highlight information for the last column
 */
function getSectionLastColumnHighlight(sectionWidget: FlattenedWidgetProps) {
  const layoutId: string = sectionWidget.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = sectionWidget.layout[0].layout.length;

  // Return an object representing the highlight information for the last column
  return {
    canvasId: sectionWidget.widgetId,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  } as AnvilHighlightInfo;
}

/**
 * function to merge two zones in a Section Widget
 * @param allWidgets - The current state of all widgets in the canvas
 * @param mergingIntoZoneId - The ID of the zone to which the other zone will be merged
 * @param mergingFromZoneId - The ID of the zone to be merged into another zone
 * @returns The updated state of widgets after the merge operation
 */
function* mergeZones(
  allWidgets: CanvasWidgetsReduxState,
  mergingIntoZoneId: string,
  mergingFromZoneId: string,
) {
  const zone1: FlattenedWidgetProps = allWidgets[mergingIntoZoneId];
  const zone2: FlattenedWidgetProps = allWidgets[mergingFromZoneId];
  const sectionWidget: FlattenedWidgetProps = allWidgets[zone1.parentId || ""];
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  // Check if necessary widgets exist
  if (sectionWidget && sectionWidget.children && zone1 && zone2) {
    // Merge the layouts of the two zones
    const mergedZoneLayout: LayoutProps[] = [
      ...zone1.layout[0].layout,
      ...zone2.layout[0].layout,
    ];

    // Filter out the layout of the zone to be merged
    const mergedSectionLayout: WidgetLayoutProps[] =
      sectionWidget.layout[0].layout.filter((each: WidgetLayoutProps) => {
        return each.widgetId !== zone2.widgetId;
      });

    // Update the widgets state after the merge
    updatedWidgets = {
      ...updatedWidgets,
      [sectionWidget.widgetId]: {
        ...sectionWidget,
        layout: [
          {
            ...sectionWidget.layout[0],
            layout: mergedSectionLayout,
          },
        ],
        children: sectionWidget.children.filter(
          (each) => each !== zone2.widgetId,
        ),
      },
      [zone1.widgetId]: {
        ...zone1,
        layout: [
          {
            ...zone1.layout[0],
            layout: mergedZoneLayout,
          },
        ],
        children: [...(zone1.children || []), ...(zone2.children || [])],
      },
    };

    // Update the parent IDs for the children of the zone being merged
    (zone2.children || []).forEach((each: string) => {
      updatedWidgets[each] = {
        ...updatedWidgets[each],
        parentId: zone1.widgetId,
      };
    });

    // Delete the widget corresponding to the zone being merged
    delete updatedWidgets[zone2.widgetId];
  }

  return updatedWidgets;
}

/**
 * function to merge the last N zones of a Section Widget
 * @param numberOfZonesToMerge - The number of zones to be merged
 * @param zoneOrder - The order of zone IDs in the Section Widget
 * @returns The updated state of widgets after the merge operation
 */
export function* mergeLastZonesOfSection(
  numberOfZonesToMerge: number,
  zoneOrder: string[],
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  // Check if the merge is valid and the zone order is available
  if (numberOfZonesToMerge > 0 && zoneOrder) {
    let count = 0;
    const currentZoneCount = zoneOrder.length;

    // Iterate over the zones to be merged and perform the merge operation
    do {
      const widgetsPostMerge: CanvasWidgetsReduxState = yield call(
        mergeZones,
        updatedWidgets,
        zoneOrder[currentZoneCount - count - 2],
        zoneOrder[currentZoneCount - count - 1],
      );
      updatedWidgets = {
        ...widgetsPostMerge,
      };
      ++count;
    } while (count < numberOfZonesToMerge);
  }

  return updatedWidgets;
}

/**
 * function to add new zones to a Section Widget
 * @param sectionWidgetId - ID of the Section Widget where zones will be added
 * @param numberOfZonesToCreate - Number of zones to create and add
 * @returns An object containing the updated state of widgets and the IDs of the created zones
 */
export function* addNewZonesToSection(
  sectionWidgetId: string,
  numberOfZonesToCreate: number,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets = { ...allWidgets };
  let count = 0;
  const createdZoneIds: string[] = [];

  // Create and add the specified number of zones to the Section Widget
  do {
    const sectionWidget: FlattenedWidgetProps = updatedWidgets[sectionWidgetId];
    const newWidget: any = {
      newWidgetId: generateReactKey(),
      parentId: sectionWidget.widgetId,
      type: ZoneWidget.type,
    };
    const highlight = getSectionLastColumnHighlight(sectionWidget);
    updatedWidgets = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
      false,
      false,
    );
    createdZoneIds.push(newWidget.newWidgetId);
    count++;
  } while (count < numberOfZonesToCreate);

  return { updatedWidgets, createdZoneIds };
}

/**
 * function to add widgets to a Section Widget
 * @param allWidgets - Current state of all widgets
 * @param draggedWidgets - Widgets being dragged and dropped
 * @param highlight - Highlight information for the drop location
 * @param widgetId - ID of the widget being dropped
 * @returns Updated state of widgets after adding the widgets to the Section Widget
 */
export function* addWidgetToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  widgetId: string,
) {
  /**
   * Add new widgets to section.
   */
  let sectionWidget: WidgetProps = {
    ...allWidgets[highlight.canvasId],
    children: (allWidgets[highlight.canvasId].children || []).filter(
      (each: string) => each !== widgetId,
    ),
  };
  const preset: LayoutProps[] = sectionWidget.layout
    ? sectionWidget.layout
    : sectionPreset();
  const res: {
    canvasWidgets: CanvasWidgetsReduxState;
    section: WidgetProps;
  } = yield call(
    addWidgetsToSection,
    allWidgets,
    draggedWidgets,
    highlight,
    sectionWidget,
    preset[0],
  );
  sectionWidget = res.canvasWidgets[highlight.canvasId];

  return {
    ...res.canvasWidgets,
    [sectionWidget.widgetId]: sectionWidget,
  };
}
