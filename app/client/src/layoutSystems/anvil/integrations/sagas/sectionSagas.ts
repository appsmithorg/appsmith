import {
  ReduxActionErrorTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { updateAndSaveLayout } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import {
  MAX_ZONE_COUNT,
  MIN_ZONE_COUNT,
} from "layoutSystems/anvil/utils/constants";
import {
  addNewZonesToSection,
  mergeLastZonesOfSection,
} from "layoutSystems/anvil/utils/sectionOperationUtils";

// function to update the zone count of a section widget
function* updateZonesCountOfSectionSaga(
  actionPayload: ReduxAction<{
    zoneCount: number; // New zone count for the section
    sectionWidgetId: string; // ID of the section widget
  }>,
) {
  try {
    const { sectionWidgetId, zoneCount } = actionPayload.payload;

    // Check if the provided zone count is within the valid range (1 to 4)
    if (zoneCount <= MAX_ZONE_COUNT && zoneCount >= MIN_ZONE_COUNT) {
      const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
      const sectionWidget: FlattenedWidgetProps = allWidgets[sectionWidgetId];

      // Proceed only if the section widget and its children exist
      if (sectionWidget && sectionWidget.children) {
        const zoneOrder: string[] = sectionWidget.layout[0].layout.map(
          (each: any) => each.widgetId,
        );

        const currentZoneCount: number = zoneOrder ? zoneOrder.length : 0;
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

        // Update the section widget with the new zone count and save the layout
        updatedWidgets[sectionWidgetId] = {
          ...updatedWidgets[sectionWidgetId],
          zoneCount,
        };
        yield put(updateAndSaveLayout(updatedWidgets));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
        error,
      },
    });
  }
}

export default function* anvilSectionSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
      updateZonesCountOfSectionSaga,
    ),
  ]);
}
