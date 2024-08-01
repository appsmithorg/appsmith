import {
  setLayoutConversionStateAction,
  updateSnapshotDetails,
} from "actions/autoLayoutActions";
import type { ApiResponse } from "api/ApiResponses";
import ApplicationApi from "ee/api/ApplicationApi";
import type { PageDefaultMeta } from "ee/api/ApplicationApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import log from "loglevel";
import type { SnapshotDetails } from "reducers/uiReducers/layoutConversionReducer";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getLogToSentryFromResponse } from "utils/helpers";
import { validateResponse } from "./ErrorSagas";
import { updateApplicationLayoutType } from "./AutoLayoutUpdateSagas";
import { LayoutSystemTypes } from "layoutSystems/types";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

//Saga to create application snapshot
export function* createSnapshotSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.createApplicationSnapShot({
      applicationId,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      return true;
    }
  } catch (error) {
    throw error;
  }
}

//Saga to fetch application snapshot
export function* fetchSnapshotSaga() {
  let response: ApiResponse<SnapshotDetails> | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.getSnapShotDetails({
      applicationId,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      return response?.data;
    }
  } catch (error) {
    if (getLogToSentryFromResponse(response)) {
      log.error(error);
      throw error;
    }
  }
}

//Saga to restore application snapshot
function* restoreApplicationFromSnapshotSaga() {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: ApiResponse<any> | undefined;
  let appId = "";
  try {
    appId = yield select(getCurrentApplicationId);
    AnalyticsUtil.logEvent("RESTORE_SNAPSHOT", {
      appId,
    });

    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.restoreApplicationFromSnapshot({
      applicationId,
    });

    const currentLayoutSystemType: LayoutSystemTypes =
      yield select(getLayoutSystemType);

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    // update the pages list temporarily with incomplete data.
    if (response?.data?.pages) {
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS,
        payload: {
          pages: response.data.pages.map((page: PageDefaultMeta) => ({
            pageId: page.id,
            basePageId: page.baseId,
            isDefault: page.isDefault,
          })),
          applicationId,
          baseApplicationId: response.data.baseId,
        },
      });
    }

    //update layout system type from
    yield call(
      updateApplicationLayoutType,
      currentLayoutSystemType === LayoutSystemTypes.FIXED
        ? LayoutSystemTypes.AUTO
        : LayoutSystemTypes.FIXED,
    );

    if (isValidResponse) {
      //update conversion form state to success
      yield put(
        setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
      );
    }
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    let error: Error = e;
    if (error) {
      error.message = `Layout conversion error - while restoring snapshot: ${error.message}`;
    } else {
      error = new Error("Layout conversion error - while restoring snapshot");
    }

    log.error(error);
    //update conversion form state to error
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_ERROR, error),
    );

    AnalyticsUtil.logEvent("CONVERSION_FAILURE", {
      flow: "RESTORE_SNAPSHOT",
      appId,
    });
  }
}

//Saga to delete application snapshot
export function* deleteApplicationSnapshotSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.deleteApplicationSnapShot({
      applicationId,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(updateSnapshotDetails(undefined));
    }
  } catch (error) {
    log.error(error);
    throw error;
  }
}

//Saga to update snapshot details by fetching info from backend
function* updateSnapshotDetailsSaga() {
  try {
    const snapshotDetails: SnapshotDetails | undefined =
      yield call(fetchSnapshotSaga);
    yield put(updateSnapshotDetails(snapshotDetails));
  } catch (error) {
    throw error;
  }
}

export default function* snapshotSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.RESTORE_SNAPSHOT,
      restoreApplicationFromSnapshotSaga,
    ),
    takeLatest(
      [
        ReduxActionTypes.FETCH_LAYOUT_SNAPSHOT_DETAILS,
        ReduxActionTypes.START_CONVERSION_FLOW,
      ],
      updateSnapshotDetailsSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_SNAPSHOT, deleteApplicationSnapshotSaga),
  ]);
}
