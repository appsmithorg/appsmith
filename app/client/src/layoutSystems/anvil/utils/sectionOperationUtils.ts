import type {
  AnvilHighlightInfo,
  LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { generateReactKey } from "utils/generators";
import type BaseLayoutComponent from "../layoutComponents/BaseLayoutComponent";
import LayoutFactory from "../layoutComponents/LayoutFactory";
import { defaultHighlightRenderInfo } from "../utils/constants";
import { anvilWidgets } from "widgets/wds/constants";
import { getUpdatedListOfWidgetsAfterAddingNewWidget } from "../integrations/sagas/anvilWidgetAdditionSagas";

/**
 * Function to get the highlight information for the last column of a Section Widget
 * @param sectionWidget - The Section Widget for which to get the highlight information
 * @returns An object representing the highlight information for the last column
 */
function getSectionLastColumnHighlight(
  sectionWidget: FlattenedWidgetProps,
): AnvilHighlightInfo {
  const layoutId: string = sectionWidget.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = sectionWidget.layout[0].layout.length;

  // Return an object representing the highlight information for the last column
  return {
    ...defaultHighlightRenderInfo,
    layoutId,
    canvasId: sectionWidget.widgetId,
    layoutOrder,
    rowIndex,
    alignment: FlexLayerAlignment.Start,
  };
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

    // Filter out the zone2 (which will be removed) from layout of section.
    const sectionComp: typeof BaseLayoutComponent = LayoutFactory.get(
      sectionWidget.layout[0].layoutType,
    );

    // Update the widgets state after the merge
    updatedWidgets = {
      ...updatedWidgets,
      [sectionWidget.widgetId]: {
        ...sectionWidget,
        layout: [
          sectionComp.removeChild(sectionWidget.layout[0], {
            alignment: FlexLayerAlignment.Start,
            widgetId: zone2.widgetId,
            widgetType: zone2.type,
          }),
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
      count += 1;
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newWidget: any = {
      newWidgetId: generateReactKey(),
      parentId: sectionWidget.widgetId,
      type: anvilWidgets.ZONE_WIDGET,
    };
    const highlight = getSectionLastColumnHighlight(sectionWidget);

    updatedWidgets = yield call(
      getUpdatedListOfWidgetsAfterAddingNewWidget,
      highlight,
      newWidget,
      false,
      true,
    );
    createdZoneIds.push(newWidget.newWidgetId);
    count += 1;
  } while (count < numberOfZonesToCreate);

  return { updatedWidgets, createdZoneIds };
}
