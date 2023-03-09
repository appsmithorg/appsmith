import {
  setLayoutConversionStateAction,
  updateSnapshotDetails,
} from "actions/autoLayoutActions";
import { ApiResponse } from "api/ApiResponses";
import ApplicationApi from "api/ApplicationApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import {
  CONVERSION_STATES,
  SnapShotDetails,
} from "reducers/uiReducers/layoutConversionReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getLogToSentryFromResponse } from "utils/helpers";
import { validateResponse } from "./ErrorSagas";

export function* createSnapshotSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.createSnapShotOfApplication({
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

export function* fetchSnapshotSaga() {
  let response: ApiResponse<SnapShotDetails> | undefined;
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
      const snapShotDetails = response?.data;

      return snapShotDetails;
    }
  } catch (error) {
    if (getLogToSentryFromResponse(response)) {
      log.error(error);
      throw error;
    }
  }
}

function* restoreApplicationFromSnapshotSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.restoreSnapShotOfApplication({
      applicationId,
    });

    const isValidResponse: boolean = yield validateResponse(
      response,
      false,
      getLogToSentryFromResponse(response),
    );

    if (isValidResponse) {
      yield put(updateSnapshotDetails(undefined));
      yield put(
        setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_SUCCESS),
      );
    }
  } catch (error) {
    log.error(error);
    yield put(
      setLayoutConversionStateAction(CONVERSION_STATES.COMPLETED_ERROR),
    );
    throw error;
  }
}

function* deleteApplicationSnapshotSaga() {
  let response: ApiResponse | undefined;
  try {
    const applicationId: string = yield select(getCurrentApplicationId);
    response = yield ApplicationApi.deleteSnapShotOfApplication({
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

function* updateSnapshotDetailsSaga() {
  try {
    const snapShotDetails: { updatedTime: Date } | undefined = yield call(
      fetchSnapshotSaga,
    );
    yield put(
      updateSnapshotDetails(
        snapShotDetails
          ? { lastUpdatedTime: snapShotDetails.updatedTime?.toString() }
          : undefined,
      ),
    );
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
        ReduxActionTypes.INIT_CANVAS_LAYOUT,
        ReduxActionTypes.FETCH_SNAPSHOT,
        ReduxActionTypes.START_CONVERSION_FLOW,
      ],
      updateSnapshotDetailsSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_SNAPSHOT, deleteApplicationSnapshotSaga),
  ]);
}
