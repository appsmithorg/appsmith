import { all, call, debounce, put } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import AuditLogsApi from "@appsmith/api/AuditLogsApi";
import { validateResponse } from "sagas/ErrorSagas";
import type { AuditLogsFiltersReduxState } from "@appsmith/reducers/auditLogsReducer";
import { dbToLogs } from "@appsmith/pages/AuditLogs/utils/dbToLogs";

function* FetchAuditLogsLogsInitSaga(
  action: ReduxAction<AuditLogsFiltersReduxState>,
) {
  try {
    const response: ApiResponse = yield call(
      AuditLogsApi.fetchAuditLogsLogsFromDB,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_SUCCESS,
        payload: dbToLogs(response?.data as any),
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_FAILED,
        payload: response?.responseMeta,
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_FAILED,
      payload: {
        error: "failed",
      },
    });
  }
}

function* FetchAuditLogsMetadataInitSaga() {
  try {
    const response: ApiResponse = yield call(
      AuditLogsApi.fetchAuditLogsMetadataFromDB,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_SUCCESS,
      });
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_EMAILS_SUCCESS,
        payload: (response?.data as any)?.emails || [],
      });
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_EVENTS_SUCCESS,
        payload: (response?.data as any)?.eventName || [],
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_FAILED,
        payload: response?.responseMeta,
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_FAILED,
      payload: {
        error: "failed",
      },
    });
  }
}

function* RefreshAuditLogsInitSaga(
  action: ReduxAction<AuditLogsFiltersReduxState>,
) {
  yield call(FetchAuditLogsMetadataInitSaga);
  yield call(FetchAuditLogsLogsInitSaga, action);
  yield put({
    type: ReduxActionTypes.REFRESH_AUDIT_LOGS_SUCCESS,
  });
}

function* FetchAuditLogsLogsNextPage(
  action: ReduxAction<AuditLogsFiltersReduxState & { cursor: string }>,
) {
  try {
    const response: ApiResponse = yield call(
      AuditLogsApi.fetchAuditLogsLogsNextPageFromDB,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_SUCCESS,
        payload: dbToLogs(response?.data as any),
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_FAILED,
        payload: response?.responseMeta,
      });
    }
  } catch {
    yield put({
      type: ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_FAILED,
      payload: {
        error: "failed",
      },
    });
  }
}

export default function* AuditLogsSagas() {
  yield all([
    debounce(
      1,
      ReduxActionTypes.FETCH_AUDIT_LOGS_METADATA_INIT,
      FetchAuditLogsMetadataInitSaga,
    ),
    debounce(
      1,
      ReduxActionTypes.REFRESH_AUDIT_LOGS_INIT,
      RefreshAuditLogsInitSaga,
    ),
    debounce(
      1,
      ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_INIT,
      FetchAuditLogsLogsInitSaga,
    ),
    debounce(
      1,
      ReduxActionTypes.FETCH_AUDIT_LOGS_LOGS_NEXT_PAGE_INIT,
      FetchAuditLogsLogsNextPage,
    ),
  ]);
}
