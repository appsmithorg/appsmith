import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import {
  InitializeEditorPayload,
  Page,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";

import { fetchEditorConfigs } from "actions/configsActions";
import {
  fetchPage,
  fetchPageList,
  fetchPublishedPage,
  setAppMode,
  updateAppStore,
} from "actions/pageActions";
import { fetchDatasources } from "actions/datasourceActions";
import { fetchPlugins } from "actions/pluginActions";
import { fetchActions, fetchActionsForView } from "actions/actionActions";
import { fetchApplication } from "actions/applicationActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { AppState } from "reducers";
import PageApi, { FetchPageResponse } from "api/PageApi";
import { validateResponse } from "./ErrorSagas";
import { extractCurrentDSL } from "utils/WidgetPropsUtils";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import { getAppStoreName } from "constants/AppConstants";
import { getDefaultPageId } from "./selectors";

const getAppStore = (appId: string) => {
  const appStoreName = getAppStoreName(appId);
  const storeString = localStorage.getItem(appStoreName) || "{}";
  let store;
  try {
    store = JSON.parse(storeString);
  } catch (e) {
    store = {};
  }
  return store;
};

function* initializeEditorSaga(
  initializeEditorAction: ReduxAction<InitializeEditorPayload>,
) {
  const { applicationId, pageId } = initializeEditorAction.payload;
  // Step 1: Set App Mode. Start getting all the data needed
  yield put(setAppMode(APP_MODE.EDIT));
  yield put({ type: ReduxActionTypes.START_EVALUATION });
  yield all([
    put(fetchPageList(applicationId, APP_MODE.EDIT)),
    put(fetchEditorConfigs()),
    put(fetchActions(applicationId)),
    put(fetchPage(pageId)),
    put(fetchApplication(applicationId, APP_MODE.EDIT)),
  ]);
  // Step 2: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_SUCCESS),
    take(ReduxActionTypes.SWITCH_CURRENT_PAGE_ID),
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS),
  ]);

  // Step 3: Call all the APIs which needs Organization Id from PageList API response.
  yield all([put(fetchPlugins()), put(fetchDatasources())]);

  // Step 4: Wait for all data to be in the state
  yield all([
    take(ReduxActionTypes.FETCH_PLUGINS_SUCCESS),
    take(ReduxActionTypes.FETCH_DATASOURCES_SUCCESS),
  ]);

  // Step 5: Set app store
  yield put(updateAppStore(getAppStore(applicationId)));

  const currentApplication = yield select(getCurrentApplication);

  const appName = currentApplication ? currentApplication.name : "";
  const appId = currentApplication ? currentApplication.id : "";

  AnalyticsUtil.logEvent("EDITOR_OPEN", {
    appId: appId,
    appName: appName,
  });

  // Step 6: Notify UI that the editor is ready to go
  yield put({
    type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
  });
  yield call(populatePageDSLsSaga);
}

function* fetchPageDSLSaga(action: ReduxAction<{ pageId: string }>) {
  try {
    const fetchPageResponse: FetchPageResponse = yield call(PageApi.fetchPage, {
      id: action.payload.pageId,
    });
    const isValidResponse = yield validateResponse(fetchPageResponse);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PAGE_DSL_SUCCESS,
        payload: {
          pageId: action.payload.pageId,
          dsl: extractCurrentDSL(fetchPageResponse),
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionTypes.FETCH_PAGE_DSL_ERROR,
      payload: {
        pageId: action.payload.pageId,
        error,
        show: false,
      },
    });
  }
}

export function* populatePageDSLsSaga() {
  try {
    yield put({
      type: ReduxActionTypes.POPULATE_PAGEDSLS_INIT,
    });
    const pageIds: string[] = yield select((state: AppState) =>
      state.entities.pageList.pages.map((page: Page) => page.pageId),
    );
    yield all(
      pageIds.map((pageId: string) => {
        return call(fetchPageDSLSaga, {
          type: ReduxActionTypes.FETCH_PAGE_DSL_INIT,
          payload: { pageId },
        });
      }),
    );
    yield put({
      type: ReduxActionTypes.POPULATE_PAGEDSLS_SUCCESS,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.POPULATE_PAGEDSLS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* initializeAppViewerSaga(
  action: ReduxAction<{ applicationId: string; pageId: string }>,
) {
  const { applicationId, pageId } = action.payload;
  yield put(setAppMode(APP_MODE.PUBLISHED));
  yield put({ type: ReduxActionTypes.START_EVALUATION });
  yield all([
    // TODO (hetu) Remove spl view call for fetch actions
    put(fetchActionsForView(applicationId)),
    put(fetchPageList(applicationId, APP_MODE.PUBLISHED)),
    put(fetchApplication(applicationId, APP_MODE.PUBLISHED)),
  ]);

  yield all([
    take(ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS),
    take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS),
    take(ReduxActionTypes.FETCH_APPLICATION_SUCCESS),
  ]);

  yield put(updateAppStore(getAppStore(applicationId)));
  const defaultPageId = yield select(getDefaultPageId);
  const toLoadPageId = pageId || defaultPageId;

  if (toLoadPageId) {
    yield put(fetchPublishedPage(toLoadPageId, true));
    yield take(ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS);

    yield put(setAppMode(APP_MODE.PUBLISHED));
    yield put(updateAppStore(getAppStore(applicationId)));

    yield put({
      type: ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS,
    });
    if ("serviceWorker" in navigator) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_PUBLISHED_PAGES,
      });
    }
  }
}

export default function* watchInitSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initializeEditorSaga),
    takeLatest(
      ReduxActionTypes.INITIALIZE_PAGE_VIEWER,
      initializeAppViewerSaga,
    ),
  ]);
}
