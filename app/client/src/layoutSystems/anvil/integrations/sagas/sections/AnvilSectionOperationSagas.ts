import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { updateAndSaveLayout } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { AnvilReduxActionTypes } from "../../actions/actionTypes";
import { addNewZonesToSection, mergeLastZonesOfSection } from "./utils";

function* updateZonesCountOfSectionSaga(
  actionPayload: ReduxAction<{
    zoneCount: number;
    sectionWidgetId: string;
  }>,
) {
  const { sectionWidgetId, zoneCount } = actionPayload.payload;
  if (zoneCount <= 4 && zoneCount > 0) {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const sectionWidget = allWidgets[sectionWidgetId];
    if (sectionWidget && sectionWidget.children) {
      const sectionCanvasId = sectionWidget.children[0];
      if (sectionCanvasId) {
        const sectionCanvas = allWidgets[sectionCanvasId];
        const zoneOrder = sectionCanvas.layout[0].layout.map(
          (each: any) => each.widgetId,
        );
        const currentZoneCount = zoneOrder ? zoneOrder.length : 0;
        let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

        if (currentZoneCount > zoneCount) {
          updatedWidgets = yield call(
            mergeLastZonesOfSection,
            currentZoneCount - zoneCount,
            zoneOrder,
          );
        } else if (currentZoneCount < zoneCount) {
          const updatedObj: {
            updatedWidgets: CanvasWidgetsReduxState;
            zoneIdsCreated: string[];
          } = yield call(
            addNewZonesToSection,
            sectionCanvas.widgetId,
            zoneCount - currentZoneCount,
          );
          updatedWidgets = updatedObj.updatedWidgets;
        }
        updatedWidgets[sectionWidgetId] = {
          ...updatedWidgets[sectionWidgetId],
          zoneCount,
        };
        yield put(updateAndSaveLayout(updatedWidgets));
      }
    }
  }
}

export default function* anvilSectionOperationsSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
      updateZonesCountOfSectionSaga,
    ),
  ]);
}
