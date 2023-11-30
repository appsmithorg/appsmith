import { all, put, select, takeLatest } from "redux-saga/effects";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getWidgets } from "sagas/selectors";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { updateAndSaveLayout } from "actions/pageActions";
import { SectionColumns } from "layoutSystems/anvil/utils/constants";
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
  const unAllocatedZoneIds = allZoneIds.filter(
    (eachZoneId) => !zonesDistributed[eachZoneId],
  );
  const spacesAllocatedRightNow = Object.values(zonesDistributed).reduce(
    (acc, curr) => acc + curr,
    0,
  );
  const remainingSpaces = SectionColumns - spacesAllocatedRightNow;
  const remainingSpacesEqualDistribution =
    unAllocatedZoneIds.length > 0
      ? remainingSpaces / unAllocatedZoneIds.length
      : 0;
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
      } else {
        zoneWidget = {
          ...zoneWidget,
          flexGrow: remainingSpacesEqualDistribution,
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
