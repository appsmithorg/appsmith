import ApplicationApi, {
  type exportApplicationRequest,
  type FetchApplicationResponse,
} from "ee/api/ApplicationApi";
import PageApi from "api/PageApi";
import { APP_MODE } from "entities/App";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ApplicationPayload } from "entities/Application";
import type { ApiResponse } from "api/ApiResponses";
import { toast } from "@appsmith/ads";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import {
  createMessage,
  COPY_ENTITY_TO_APP_SUCCESS,
  COPY_ENTITY_TO_APP_ERROR,
} from "ee/constants/messages";
import {
  CopyToAppEntityType,
  type CopyEntityToAppPayload,
} from "pages/Editor/Explorer/CopyToApp/types";
import { validateResponse } from "sagas/ErrorSagas";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const COPY_FILE_NAME = "copy-entity.json";

/**
 * Fetches the applications of a target workspace for the copy-to-app picker.
 *
 * This writes to the dedicated `copyEntityToApp` slice rather than reusing the
 * `FETCH_ALL_APPLICATIONS_OF_WORKSPACE` flow, which mutates
 * `state.ui.selectedWorkspace.applications` — that slice reflects the current
 * editor's workspace and must not be clobbered while editing.
 */
export function* fetchAppsForCopyTargetSaga(
  action: ReduxAction<{ workspaceId: string }>,
) {
  try {
    const response: ApiResponse<ApplicationPayload[]> = yield call(
      ApplicationApi.fetchAllApplicationsOfWorkspace,
      action.payload.workspaceId,
    );
    const isValidResponse: boolean = yield call(validateResponse, response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_SUCCESS,
        payload: { applications: response.data || [] },
      });
    } else {
      // validateResponse returned false (e.g. connection aborted) without
      // throwing; dispatch the error action so `isFetchingApplications` is
      // reset and the picker does not stay stuck loading. `show: false`
      // avoids a duplicate toast.
      yield put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR,
        payload: { show: false },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR,
      payload: { error },
    });
  }
}

/**
 * Fetches the named pages of a target application for the copy-to-app picker.
 *
 * The `/applications/home` payload only carries page ids/slugs (no names), so
 * page names are fetched separately via the same endpoint the editor uses.
 */
export function* fetchPagesForCopyTargetSaga(
  action: ReduxAction<{ applicationId: string }>,
) {
  try {
    const response: FetchApplicationResponse = yield call(
      PageApi.fetchAppAndPages,
      { applicationId: action.payload.applicationId, mode: APP_MODE.EDIT },
    );
    const isValidResponse: boolean = yield call(validateResponse, response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_SUCCESS,
        payload: { pages: response.data?.pages || [] },
      });
    } else {
      // Same as the applications fetch: reset `isFetchingPages` via the error
      // action when validateResponse returns false without throwing.
      // `show: false` avoids a duplicate toast.
      yield put({
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR,
        payload: { show: false },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR,
      payload: { error },
    });
  }
}

/**
 * Orchestrates copying a single entity (action/query or JS object) into a page
 * of a different application, possibly in a different workspace.
 *
 * It reuses the existing partial export + partial import endpoints: export the
 * single entity to an in-memory ApplicationJson, wrap it as a File, and import
 * it into the chosen target. Datasource reconciliation and name-collision
 * refactoring are handled server-side by the import. The user stays in the
 * current editor — no navigation is performed.
 */
function* copyEntityToAppSaga(
  payload: CopyEntityToAppPayload,
  entityType: CopyToAppEntityType,
  exportBody: exportApplicationRequest,
  successType: string,
  errorType: string,
) {
  const currentWorkspaceId: string = yield select(getCurrentWorkspaceId);
  const isCrossWorkspace = currentWorkspaceId !== payload.targetWorkspaceId;

  try {
    const sourceApplicationId: string = yield select(getCurrentApplicationId);

    const exportResponse: ApiResponse = yield call(
      ApplicationApi.exportPartialApplication,
      sourceApplicationId,
      payload.sourcePageId,
      exportBody,
    );
    const isExportValid: boolean = yield call(validateResponse, exportResponse);

    if (!isExportValid) {
      // validateResponse already surfaced the failure (or the connection was
      // aborted); dispatch the error action so `isCopying` is reset and the
      // picker does not stay stuck in a loading state. `show: false` avoids a
      // duplicate toast.
      yield put({ type: errorType, payload: { show: false } });

      return;
    }

    const applicationFile = new File(
      [JSON.stringify(exportResponse.data)],
      COPY_FILE_NAME,
      { type: "application/json" },
    );

    const importResponse: ApiResponse = yield call(
      ApplicationApi.importPartialApplication,
      {
        applicationFile,
        workspaceId: payload.targetWorkspaceId,
        applicationId: payload.targetApplicationId,
        pageId: payload.targetPageId,
      },
    );
    const isImportValid: boolean = yield call(validateResponse, importResponse);

    if (!isImportValid) {
      // Same as the export path: reset `isCopying` via the error action instead
      // of returning silently. `show: false` avoids a duplicate toast.
      yield put({ type: errorType, payload: { show: false } });

      return;
    }

    AnalyticsUtil.logEvent("COPY_ENTITY_TO_APP", {
      entityType,
      isCrossWorkspace,
    });

    toast.show(
      createMessage(
        COPY_ENTITY_TO_APP_SUCCESS,
        payload.entityName,
        payload.targetApplicationName,
        payload.targetPageName,
      ),
      { kind: "success" },
    );

    yield put({ type: successType });

    if (payload.onSuccess) {
      payload.onSuccess();
    }
  } catch (error) {
    AnalyticsUtil.logEvent("COPY_ENTITY_TO_APP", {
      entityType,
      isCrossWorkspace,
      error: true,
    });
    yield put({
      type: errorType,
      payload: {
        show: true,
        error: { message: createMessage(COPY_ENTITY_TO_APP_ERROR) },
      },
    });
  }
}

export function* copyActionToAppSaga(
  action: ReduxAction<CopyEntityToAppPayload>,
) {
  const exportBody: exportApplicationRequest = {
    actionList: [action.payload.entityId],
    actionCollectionList: [],
    customJsLib: [],
    datasourceList: [],
    widget: "",
  };

  yield call(
    copyEntityToAppSaga,
    action.payload,
    CopyToAppEntityType.ACTION,
    exportBody,
    ReduxActionTypes.COPY_ACTION_TO_APP_SUCCESS,
    ReduxActionErrorTypes.COPY_ACTION_TO_APP_ERROR,
  );
}

export function* copyJSActionToAppSaga(
  action: ReduxAction<CopyEntityToAppPayload>,
) {
  const exportBody: exportApplicationRequest = {
    actionList: [],
    actionCollectionList: [action.payload.entityId],
    customJsLib: [],
    datasourceList: [],
    widget: "",
  };

  yield call(
    copyEntityToAppSaga,
    action.payload,
    CopyToAppEntityType.JS_OBJECT,
    exportBody,
    ReduxActionTypes.COPY_JS_ACTION_TO_APP_SUCCESS,
    ReduxActionErrorTypes.COPY_JS_ACTION_TO_APP_ERROR,
  );
}

export default function* copyToAppSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
      fetchAppsForCopyTargetSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
      fetchPagesForCopyTargetSaga,
    ),
    takeLatest(ReduxActionTypes.COPY_ACTION_TO_APP_INIT, copyActionToAppSaga),
    takeLatest(
      ReduxActionTypes.COPY_JS_ACTION_TO_APP_INIT,
      copyJSActionToAppSaga,
    ),
  ]);
}
