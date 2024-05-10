import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { put } from "redux-saga/effects";

interface BuildingBlockDropInitiateEvent {
  applicationId: string;
  workspaceId: string;
  buildingblockName: string;
}

export function* initiateBuildingBlockDropEvent({
  applicationId,
  buildingblockName,
  workspaceId,
}: BuildingBlockDropInitiateEvent) {
  AnalyticsUtil.logEvent("DROP_BUILDING_BLOCK_INITIATED", {
    applicationId,
    workspaceId,
    source: "explorer",
    eventData: {
      buildingBlockName: buildingblockName,
    },
  });
  yield put({
    type: ReduxActionTypes.SET_BUILDING_BLOCK_DRAG_START_TIME,
    payload: { startTime: Date.now() },
  });
}
