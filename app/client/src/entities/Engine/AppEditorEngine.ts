import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";
import {
  fetchDatasources,
  fetchMockDatasources,
} from "actions/datasourceActions";
import {
  fetchGitStatusInit,
  remoteUrlInputValue,
  resetPullMergeStatus,
} from "actions/gitSyncActions";
import { restoreRecentEntitiesRequest } from "actions/globalSearchActions";
import { resetEditorSuccess } from "actions/initActions";
import { fetchJSCollections } from "actions/jsActionActions";
import {
  fetchAllPageEntityCompletion,
  fetchPage,
  fetchPageDSLs,
} from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActions,
} from "actions/pluginActionActions";
import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import {
  ApplicationPayload,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { addBranchParam } from "constants/routes";
import { APP_MODE } from "entities/App";
import { all, call, put, select } from "redux-saga/effects";
import { failFastApiCalls } from "sagas/InitSagas";
import { getCurrentApplication } from "selectors/editorSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AppEngine, {
  ActionsNotFoundError,
  AppEnginePayload,
  PluginFormConfigsNotFoundError,
  PluginsNotFoundError,
} from ".";

export default class AppEditorEngine extends AppEngine {
  constructor(mode: APP_MODE) {
    super(mode);
    this.setupEngine = this.setupEngine.bind(this);
    this.loadAppData = this.loadAppData.bind(this);
    this.loadAppURL = this.loadAppURL.bind(this);
    this.loadAppEntities = this.loadAppEntities.bind(this);
    this.loadGit = this.loadGit.bind(this);
    this.completeChore = this.completeChore.bind(this);
    this.loadPageThemesAndActions = this.loadPageThemesAndActions.bind(this);
    this.loadPluginsAndDatasources = this.loadPluginsAndDatasources.bind(this);
  }

  /**
   * this saga is called once then application is loaded.
   * It will hold the editor in uninitialized till all the apis/actions are completed
   *
   * @param AppEnginePayload
   * @returns
   */
  public *setupEngine(payload: AppEnginePayload): any {
    yield* super.setupEngine.call(this, payload);
    yield put(resetEditorSuccess());
  }

  public startPerformanceTracking() {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );
  }

  public stopPerformanceTracking() {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.INIT_EDIT_APP,
    );
  }

  private *loadPageThemesAndActions(
    toLoadPageId: string,
    applicationId: string,
  ) {
    const initActionsCalls = [
      fetchPage(toLoadPageId, true),
      fetchActions({ applicationId }, []),
      fetchJSCollections({ applicationId }),
      fetchSelectedAppThemeAction(applicationId),
      fetchAppThemesAction(applicationId),
    ];

    const successActionEffects = [
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      ReduxActionTypes.FETCH_PAGE_SUCCESS,
    ];

    const failureActionEffects = [
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      ReduxActionErrorTypes.FETCH_PAGE_ERROR,
    ];

    const allActionCalls: boolean = yield call(
      failFastApiCalls,
      initActionsCalls,
      successActionEffects,
      failureActionEffects,
    );

    if (!allActionCalls)
      throw new ActionsNotFoundError(
        `Unable to fetch actions for the application: ${applicationId}`,
      );
    yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
  }

  private *loadPluginsAndDatasources() {
    const initActions = [
      fetchPlugins(),
      fetchDatasources(),
      fetchMockDatasources(),
      fetchPageDSLs(),
    ];

    const successActions = [
      ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS,
      ReduxActionTypes.FETCH_PAGE_DSLS_SUCCESS,
    ];

    const errorActions = [
      ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR,
      ReduxActionErrorTypes.POPULATE_PAGEDSLS_ERROR,
    ];

    const initActionCalls: boolean = yield call(
      failFastApiCalls,
      initActions,
      successActions,
      errorActions,
    );

    if (!initActionCalls)
      throw new PluginsNotFoundError("Unable to fetch plugins");

    const pluginFormCall: boolean = yield call(
      failFastApiCalls,
      [fetchPluginFormConfigs()],
      [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
    );
    if (!pluginFormCall)
      throw new PluginFormConfigsNotFoundError(
        "Unable to fetch plugin form configs",
      );
  }

  public *loadAppEntities(toLoadPageId: string, applicationId: string): any {
    yield all([
      call(this.loadPageThemesAndActions, toLoadPageId, applicationId),
      call(this.loadPluginsAndDatasources),
    ]);
  }

  public *completeChore() {
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );
    AnalyticsUtil.logEvent("EDITOR_OPEN", {
      appId: currentApplication.id,
      appName: currentApplication.name,
    });
    yield put({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });
  }

  public *loadGit(applicationId: string) {
    const branchInStore: string = yield select(getCurrentGitBranch);
    yield put(
      restoreRecentEntitiesRequest({
        applicationId,
        branch: branchInStore,
      }),
    );
    // init of temporay remote url from old application
    yield put(remoteUrlInputValue({ tempRemoteUrl: "" }));
    // add branch query to path and fetch status
    if (branchInStore) {
      history.replace(addBranchParam(branchInStore));
      yield put(fetchGitStatusInit());
    }
    yield put(resetPullMergeStatus());
  }
}
