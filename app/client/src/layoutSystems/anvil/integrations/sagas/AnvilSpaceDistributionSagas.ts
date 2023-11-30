import { all, put, select, takeLatest } from "redux-saga/effects";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getWidgets } from "sagas/selectors";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { updateAndSaveLayout } from "actions/pageActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

function* reDistributeZoneSpaces(
  action: ReduxAction<{
    sectionLayoutId: string;
    zonesDistributed: {
      [key: string]: number;
    };
  }>,
) {
  const { zonesDistributed } = action.payload;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets = { ...allWidgets };
  const allocatedZoneIds = Object.keys(zonesDistributed);
  const sectionWidgetId =
    updatedWidgets[allocatedZoneIds[0]].parentId || MAIN_CONTAINER_WIDGET_ID;
  const sectionParent = updatedWidgets[sectionWidgetId];
  const allZoneIds = sectionParent.children || [];
  updatedWidgets = {
    ...updatedWidgets,
    [sectionWidgetId]: {
      ...sectionParent,
      spaceDistributed: {},
    },
  };
  allZoneIds.forEach((zoneId) => {
    let zoneWidget = updatedWidgets[zoneId];
    if (zoneWidget) {
      const spaces = zonesDistributed[zoneId];
      if (spaces) {
        zoneWidget = {
          ...zoneWidget,
          flexGrow: spaces,
        };
      }
    }
    updatedWidgets = {
      ...updatedWidgets,
      [zoneId]: {
        ...zoneWidget,
      },
      [sectionWidgetId]: {
        ...updatedWidgets[sectionWidgetId],
        spaceDistributed: {
          ...updatedWidgets[sectionWidgetId].spaceDistributed,
          [zoneId]: zoneWidget.flexGrow,
        },
      },
    };
  });
  yield put(updateAndSaveLayout(updatedWidgets));
}

export default function* anvilSpaceDistributionSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP,
      reDistributeZoneSpaces,
    ),
  ]);
}
