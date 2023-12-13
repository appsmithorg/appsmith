import {
  ReduxActionErrorTypes,
  type ReduxAction,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { AnvilReduxActionTypes } from "../../actions/actionTypes";
import { addNewZonesToSection, mergeLastZonesOfSection } from "./utils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { batchUpdateWidgetProperty } from "actions/controlActions";
import { saveAnvilLayout } from "../../actions/saveLayoutActions";
import {
  getDefaultSpaceDistributed,
  redistributeSpaceWithDynamicMinWidth,
} from "layoutSystems/anvil/sectionSpaceDistributor/spaceRedistributionUtils";
import type { WidgetLayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { ZoneMinColumnWidth } from "layoutSystems/anvil/utils/constants";

// function to update the zone count of a section widget
function* updateZonesCountOfSectionSaga(
  actionPayload: ReduxAction<{
    zoneCount: number; // New zone count for the section
    sectionWidgetId: string; // ID of the section widget
  }>,
) {
  const { sectionWidgetId, zoneCount } = actionPayload.payload;

  // Check if the provided zone count is within the valid range (1 to 4)
  if (zoneCount <= 4 && zoneCount > 0) {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const sectionWidget = allWidgets[sectionWidgetId];

    // Proceed only if the section widget and its children exist
    if (sectionWidget && sectionWidget.children) {
      const zoneOrder = sectionWidget.layout[0].layout.map(
        (each: any) => each.widgetId,
      );

      const currentZoneCount = zoneOrder ? zoneOrder.length : 0;
      let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

      // If the new zone count is less than the current count, merge the last zones
      if (currentZoneCount > zoneCount) {
        updatedWidgets = yield call(
          mergeLastZonesOfSection,
          currentZoneCount - zoneCount,
          zoneOrder,
        );
      }
      // If the new zone count is more than the current count, add new zones
      else if (currentZoneCount < zoneCount) {
        const updatedObj: {
          updatedWidgets: CanvasWidgetsReduxState;
          zoneIdsCreated: string[];
        } = yield call(
          addNewZonesToSection,
          sectionWidgetId,
          zoneCount - currentZoneCount,
        );
        updatedWidgets = updatedObj.updatedWidgets;
      }
      const previousZoneOrder = sectionWidget.layout[0].layout.map(
        (each: WidgetLayoutProps) => each.widgetId,
      );
      const currentDistributedSpace =
        sectionWidget.spaceDistributed ||
        getDefaultSpaceDistributed(previousZoneOrder);
      const updatedZoneOrder: string[] = updatedWidgets[
        sectionWidgetId
      ].layout[0].layout.map((each: WidgetLayoutProps) => each.widgetId);
      const updatedDistributedSpaceArray = redistributeSpaceWithDynamicMinWidth(
        currentDistributedSpace,
        previousZoneOrder,
        currentZoneCount > zoneCount ? -ZoneMinColumnWidth : ZoneMinColumnWidth,
        currentZoneCount > zoneCount ? currentZoneCount - 1 : currentZoneCount,
        true,
      );
      const updatedDistributedSpace = updatedZoneOrder.reduce(
        (result, each, index) => {
          return {
            ...result,
            [each]: updatedDistributedSpaceArray[index],
          };
        },
        {} as { [key: string]: number },
      );

      // remove distribution if zone count is changed
      const childrenToUpdate = updatedWidgets[sectionWidgetId].children || [];
      childrenToUpdate.forEach((each) => {
        updatedWidgets[each] = {
          ...updatedWidgets[each],
          flexGrow: updatedDistributedSpace[each],
        };
        updatedWidgets[sectionWidgetId] = {
          ...updatedWidgets[sectionWidgetId],
          spaceDistributed: {
            ...updatedWidgets[sectionWidgetId].spaceDistributed,
            [each]: updatedDistributedSpace[each],
          },
          zoneCount,
        };
      });
      updatedWidgets[sectionWidgetId] = {
        ...updatedWidgets[sectionWidgetId],
        zoneCount,
      };
      yield put(saveAnvilLayout(updatedWidgets));
    }
  }
}

// function to check and delete a Section Widget automatically
export function* checkAutoSectionDelete(
  actionPayload: ReduxAction<{
    widgetId: string; // ID of the widget to check for auto-deletion
  }>,
) {
  try {
    const { widgetId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const canvasWidget: FlattenedWidgetProps = allWidgets[widgetId];

    /**
     * Return if:
     * 1. Canvas doesn't exist.
     * 2. Canvas doesn't have a parent.
     * 3. Canvas has children.
     */
    if (
      !canvasWidget ||
      !canvasWidget.parentId ||
      canvasWidget.children?.length
    ) {
      return;
    }

    const parent: FlattenedWidgetProps = allWidgets[canvasWidget.parentId];

    // Return if the parent widget doesn't exist
    if (!parent) {
      return;
    }

    /**
     * If parent is a Section Widget,
     * and Canvas doesn't have any children.
     * Then delete the SectionWidget.
     */
    if (parent.type === SectionWidget.type && !canvasWidget.children?.length) {
      yield put({
        type: WidgetReduxActionTypes.WIDGET_DELETE,
        payload: {
          widgetId: parent.widgetId,
          parentId: parent.parentId,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_CHECK_SECTION_DELETE,
        error,
      },
    });
  }
}

// function to check and update the zone count of a Section Widget
export function* checkSectionZoneCount(
  actionPayload: ReduxAction<{
    widgetId: string; // ID of the widget to check for zone count
  }>,
) {
  try {
    const { widgetId } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    const canvasWidget: FlattenedWidgetProps = allWidgets[widgetId];

    // Return if the widget or its parent doesn't exist
    if (!canvasWidget || !canvasWidget.parentId) {
      return;
    }

    const section: FlattenedWidgetProps = allWidgets[canvasWidget.parentId];

    // Update the zone count if it doesn't match the actual child count
    if (section.zoneCount !== canvasWidget.children?.length) {
      yield put(
        batchUpdateWidgetProperty(section.widgetId, {
          modify: { zoneCount: canvasWidget.children?.length || 1 },
        }),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_CHECK_ZONE_COUNT,
        error,
      },
    });
  }
}

export default function* anvilSectionOperationsSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
      updateZonesCountOfSectionSaga,
    ),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_CHECK_SECTION_DELETE,
      checkAutoSectionDelete,
    ),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_CHECK_ZONE_COUNT,
      checkSectionZoneCount,
    ),
  ]);
}
