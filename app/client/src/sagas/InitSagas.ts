import { get, identity, pickBy } from "lodash";
import {
  all,
  call,
  delay,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import type {
  ReduxAction,
  ReduxActionWithoutPayload,
} from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { resetApplicationWidgets, resetPageList } from "actions/pageActions";
import { resetCurrentApplication } from "ee/actions/applicationActions";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { resetRecentEntities } from "actions/globalSearchActions";

import {
  initAppViewerAction,
  initEditorAction,
  resetEditorSuccess,
} from "actions/initActions";
import {
  getCurrentPageId,
  getIsEditorInitialized,
  getIsWidgetConfigBuilt,
  selectCurrentApplicationSlug,
} from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import { setPreviewModeAction } from "actions/editorActions";
import type { AppEnginePayload } from "entities/Engine";
import { PageNotFoundError } from "entities/Engine";
import type AppEngine from "entities/Engine";
import { AppEngineApiError } from "entities/Engine";
import AppEngineFactory from "entities/Engine/factory";
import type {
  ApplicationPagePayload,
  FetchApplicationResponse,
} from "ee/api/ApplicationApi";
import { getSearchQuery, updateSlugNamesInURL } from "utils/helpers";
import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { safeCrashAppRequest } from "../actions/errorActions";
import { resetSnipingMode } from "actions/propertyPaneActions";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import {
  isEditorPath,
  isViewerPath,
  matchEditorPath,
} from "ee/pages/Editor/Explorer/helpers";
import { APP_MODE } from "../entities/App";
import { GIT_BRANCH_QUERY_KEY, matchViewerPath } from "../constants/routes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { deleteErrorLog } from "actions/debuggerActions";
import { getCurrentUser } from "actions/authActions";

import { getCurrentTenant } from "ee/actions/tenantActions";
import {
  fetchFeatureFlagsInit,
  fetchProductAlertInit,
} from "actions/userActions";
import { embedRedirectURL, validateResponse } from "./ErrorSagas";
import type { ApiResponse } from "api/ApiResponses";
import type { ProductAlert } from "reducers/uiReducers/usersReducer";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { Action, ActionViewMode } from "entities/Action";
import type { JSCollection } from "entities/JSCollection";
import type { FetchPageResponse, FetchPageResponseData } from "api/PageApi";
import type { AppTheme } from "entities/AppTheming";
import type { Datasource } from "entities/Datasource";
import type { Plugin, PluginFormPayload } from "api/PluginApi";
import { ConsolidatedPageLoadApi } from "api";
import { AXIOS_CONNECTION_ABORTED_CODE } from "ee/constants/ApiConstants";
import {
  endSpan,
  startNestedSpan,
  startRootSpan,
} from "UITelemetry/generateTraces";
import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";
import type { PACKAGE_PULL_STATUS } from "ee/constants/ModuleConstants";

export const URL_CHANGE_ACTIONS = [
  ReduxActionTypes.CURRENT_APPLICATION_NAME_UPDATE,
  ReduxActionTypes.UPDATE_PAGE_SUCCESS,
  ReduxActionTypes.UPDATE_APPLICATION_SUCCESS,
];

export interface ReduxURLChangeAction {
  type: typeof URL_CHANGE_ACTIONS;
  payload: ApplicationPagePayload | ApplicationPayload | Page;
}
export interface DeployConsolidatedApi {
  productAlert: ApiResponse<ProductAlert>;
  tenantConfig: ApiResponse;
  featureFlags: ApiResponse<FeatureFlags>;
  userProfile: ApiResponse;
  pages: FetchApplicationResponse;
  publishedActions: ApiResponse<ActionViewMode[]>;
  publishedActionCollections: ApiResponse<JSCollection[]>;
  customJSLibraries: ApiResponse;
  pageWithMigratedDsl: FetchPageResponse;
  currentTheme: ApiResponse<AppTheme[]>;
  themes: ApiResponse<AppTheme>;
}
export interface EditConsolidatedApi {
  productAlert: ApiResponse<ProductAlert>;
  tenantConfig: ApiResponse;
  featureFlags: ApiResponse<FeatureFlags>;
  userProfile: ApiResponse;
  pages: FetchApplicationResponse;
  publishedActions: ApiResponse<ActionViewMode[]>;
  publishedActionCollections: ApiResponse<JSCollection[]>;
  customJSLibraries: ApiResponse;
  pageWithMigratedDsl: FetchPageResponse;
  currentTheme: ApiResponse<AppTheme[]>;
  themes: ApiResponse<AppTheme>;
  datasources: ApiResponse<Datasource[]>;
  pagesWithMigratedDsl: ApiResponse<FetchPageResponseData[]>;
  plugins: ApiResponse<Plugin[]>;
  mockDatasources: ApiResponse;
  pluginFormConfigs: ApiResponse<PluginFormPayload>[];
  unpublishedActions: ApiResponse<Action[]>;
  unpublishedActionCollections: ApiResponse<JSCollection[]>;
  packagePullStatus: ApiResponse<PACKAGE_PULL_STATUS>;
}
export type InitConsolidatedApi = DeployConsolidatedApi | EditConsolidatedApi;
export function* failFastApiCalls(
  triggerActions: Array<ReduxAction<unknown> | ReduxActionWithoutPayload>,
  successActions: string[],
  failureActions: string[],
) {
  yield all(triggerActions.map((triggerAction) => put(triggerAction)));
  const effectRaceResult: { success: boolean; failure: boolean } = yield race({
    success: all(successActions.map((successAction) => take(successAction))),
    failure: take(failureActions),
  });

  if (effectRaceResult.failure) {
    yield put(
      safeCrashAppRequest(get(effectRaceResult, "failure.payload.error.code")),
    );

    return false;
  }

  return true;
}

export function* waitForWidgetConfigBuild() {
  const isBuilt: boolean = yield select(getIsWidgetConfigBuilt);

  if (!isBuilt) {
    yield take(ReduxActionTypes.WIDGET_INIT_SUCCESS);
  }
}

export function* reportSWStatus() {
  const mode: APP_MODE = yield select(getAppMode);
  const startTime = Date.now();

  if ("serviceWorker" in navigator) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: { success: any; failed: any } = yield race({
      success: navigator.serviceWorker.ready.then((reg) => ({
        reg,
        timeTaken: Date.now() - startTime,
      })),
      failed: delay(20000),
    });

    if (result.success) {
      AnalyticsUtil.logEvent("SW_REGISTRATION_SUCCESS", {
        message: "Service worker is active",
        mode,
        timeTaken: result.success.timeTaken,
      });
    } else {
      AnalyticsUtil.logEvent("SW_REGISTRATION_FAILED", {
        message: "Service worker is not active in 20s",
        mode,
      });
    }
  } else {
    AnalyticsUtil.logEvent("SW_REGISTRATION_FAILED", {
      message: "Service worker is not supported",
      mode,
    });
  }
}

function* executeActionDuringUserDetailsInitialisation(
  actionType: string,
  shouldInitialiseUserDetails?: boolean,
) {
  if (!shouldInitialiseUserDetails) {
    return;
  }

  yield put({ type: actionType });
}

export function* getInitResponses({
  applicationId,
  basePageId,
  mode,
  shouldInitialiseUserDetails,
}: {
  applicationId?: string;
  basePageId?: string;
  mode?: APP_MODE;
  shouldInitialiseUserDetails?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  const params = pickBy(
    {
      applicationId,
      defaultPageId: basePageId,
    },
    identity,
  );
  let response: InitConsolidatedApi | undefined;

  try {
    yield call(
      executeActionDuringUserDetailsInitialisation,
      ReduxActionTypes.START_CONSOLIDATED_PAGE_LOAD,
      shouldInitialiseUserDetails,
    );

    const rootSpan = startRootSpan("fetch-consolidated-api");
    const initConsolidatedApiResponse: ApiResponse<InitConsolidatedApi> =
      yield mode === APP_MODE.EDIT
        ? ConsolidatedPageLoadApi.getConsolidatedPageLoadDataEdit(params)
        : ConsolidatedPageLoadApi.getConsolidatedPageLoadDataView(params);

    endSpan(rootSpan);

    const isValidResponse: boolean = yield validateResponse(
      initConsolidatedApiResponse,
    );

    response = initConsolidatedApiResponse.data;

    if (!isValidResponse) {
      // its only invalid when there is a axios related error
      throw new Error("Error occured " + AXIOS_CONNECTION_ABORTED_CODE);
    }
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    // when the user is an anonymous user we embed the url with the attempted route
    // this is taken care in ce code repo but not on ee
    if (e?.response?.status === 401) {
      embedRedirectURL();
    }

    yield call(
      executeActionDuringUserDetailsInitialisation,
      ReduxActionTypes.END_CONSOLIDATED_PAGE_LOAD,
      shouldInitialiseUserDetails,
    );
    Sentry.captureMessage(
      `consolidated api failure for ${JSON.stringify(
        params,
      )} errored message response ${e}`,
    );
    throw new PageNotFoundError(`Cannot find page with base id: ${basePageId}`);
  }

  const { featureFlags, productAlert, tenantConfig, userProfile, ...rest } =
    response || {};
  //actions originating from INITIALIZE_CURRENT_PAGE should update user details
  //other actions are not necessary

  if (!shouldInitialiseUserDetails) {
    return rest;
  }

  yield put(getCurrentUser(userProfile));

  yield put(fetchFeatureFlagsInit(featureFlags));

  yield put(getCurrentTenant(false, tenantConfig));

  yield put(fetchProductAlertInit(productAlert));
  yield call(
    executeActionDuringUserDetailsInitialisation,
    ReduxActionTypes.END_CONSOLIDATED_PAGE_LOAD,
    shouldInitialiseUserDetails,
  );

  return rest;
}

export function* startAppEngine(action: ReduxAction<AppEnginePayload>) {
  const rootSpan = startRootSpan("startAppEngine", {
    mode: action.payload.mode,
    pageId: action.payload.basePageId,
    applicationId: action.payload.applicationId,
    branch: action.payload.branch,
  });

  try {
    const engine: AppEngine = AppEngineFactory.create(
      action.payload.mode,
      action.payload.mode,
    );

    yield call(engine.setupEngine, action.payload, rootSpan);

    const getInitResponsesSpan = startNestedSpan(
      "getInitResponsesSpan",
      rootSpan,
    );

    const allResponses: InitConsolidatedApi = yield call(getInitResponses, {
      ...action.payload,
    });

    endSpan(getInitResponsesSpan);

    yield put({ type: ReduxActionTypes.LINT_SETUP });
    const { applicationId, toLoadBasePageId, toLoadPageId } = yield call(
      engine.loadAppData,
      action.payload,
      allResponses,
      rootSpan,
    );

    yield call(engine.loadAppURL, {
      basePageId: toLoadBasePageId,
      basePageIdInUrl: action.payload.basePageId,
      rootSpan,
    });

    yield call(
      engine.loadAppEntities,
      toLoadPageId,
      applicationId,
      allResponses,
      rootSpan,
    );
    yield call(engine.loadGit, applicationId, rootSpan);
    yield call(engine.completeChore, rootSpan);
    yield put(generateAutoHeightLayoutTreeAction(true, false));
  } catch (e) {
    log.error(e);

    if (e instanceof AppEngineApiError) return;

    Sentry.captureException(e);
    yield put(safeCrashAppRequest());
  } finally {
    endSpan(rootSpan);
  }
}

export function* resetDebuggerLogs() {
  // clear all existing debugger errors
  const debuggerErrors: ReturnType<typeof getDebuggerErrors> =
    yield select(getDebuggerErrors);
  const existingErrors = Object.values(debuggerErrors).filter(
    (payload) => !!payload.id,
  );
  const errorsToDelete = existingErrors.map(
    (payload) => payload.id,
  ) as string[];

  yield put(deleteErrorLog(errorsToDelete));
}

function* resetEditorSaga() {
  yield put(resetCurrentApplication());
  yield put(resetPageList());
  yield put(resetApplicationWidgets());
  yield put(resetRecentEntities());
  // Reset to edit mode once user exits editor
  // Without doing this if the user creates a new app they
  // might end up in preview mode if they were in preview mode
  // previously
  yield put(setPreviewModeAction(false));
  yield put(resetSnipingMode());
  yield put(setExplorerActiveAction(true));
  yield put(setExplorerPinnedAction(true));
  yield put(resetEditorSuccess());
  yield fork(resetDebuggerLogs);
}

export function* waitForInit() {
  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);
  const isViewerInitialized: boolean = yield select(getIsViewerInitialized);

  if (!isEditorInitialised && !isViewerInitialized) {
    yield take([
      ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    ]);
  }
}

function* updateURLSaga(action: ReduxURLChangeAction) {
  yield call(waitForInit);
  const currentPageId: string = yield select(getCurrentPageId);
  const applicationSlug: string = yield select(selectCurrentApplicationSlug);
  const payload = action.payload;

  if ("applicationVersion" in payload) {
    updateSlugNamesInURL({ applicationSlug: payload.slug });

    return;
  }

  if ("pageId" in payload) {
    if (payload.pageId !== currentPageId) return;

    updateSlugNamesInURL({
      pageSlug: payload.slug,
      customSlug: payload.customSlug || "",
      applicationSlug,
    });

    return;
  }

  if (payload.id !== currentPageId) return;

  updateSlugNamesInURL({
    pageSlug: payload.slug,
    customSlug: payload.customSlug || "",
    applicationSlug,
  });
}

function* appEngineSaga(action: ReduxAction<AppEnginePayload>) {
  yield race({
    task: call(startAppEngine, action),
    cancel: take(ReduxActionTypes.RESET_EDITOR_REQUEST),
  });
}

function* eagerPageInitSaga() {
  const url = window.location.pathname;
  const search = window.location.search;

  if (isEditorPath(url)) {
    const matchedEditorParams = matchEditorPath(url);

    if (matchedEditorParams) {
      const {
        params: { baseApplicationId, basePageId },
      } = matchedEditorParams;
      const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

      if (basePageId) {
        yield put(
          initEditorAction({
            basePageId,
            baseApplicationId,
            branch,
            mode: APP_MODE.EDIT,
            shouldInitialiseUserDetails: true,
          }),
        );

        return;
      }
    }
  } else if (isViewerPath(url)) {
    const matchedViewerParams = matchViewerPath(url);

    if (matchedViewerParams) {
      const {
        params: { baseApplicationId, basePageId },
      } = matchedViewerParams;
      const branch = getSearchQuery(search, GIT_BRANCH_QUERY_KEY);

      if (baseApplicationId || basePageId) {
        yield put(
          initAppViewerAction({
            baseApplicationId,
            branch,
            basePageId,
            mode: APP_MODE.PUBLISHED,
            shouldInitialiseUserDetails: true,
          }),
        );

        return;
      }
    }
  }

  try {
    yield call(getInitResponses, {
      shouldInitialiseUserDetails: true,
      mode: APP_MODE.PUBLISHED,
    });
  } catch (e) {}
}

export default function* watchInitSagas() {
  yield all([
    takeLeading(
      [
        ReduxActionTypes.INITIALIZE_EDITOR,
        ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      ],
      appEngineSaga,
    ),
    takeLatest(ReduxActionTypes.RESET_EDITOR_REQUEST, resetEditorSaga),
    takeEvery(URL_CHANGE_ACTIONS, updateURLSaga),
    takeEvery(ReduxActionTypes.INITIALIZE_CURRENT_PAGE, eagerPageInitSaga),
  ]);
}
