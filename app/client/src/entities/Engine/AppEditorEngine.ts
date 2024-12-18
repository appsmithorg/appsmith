import { fetchMockDatasources } from "actions/datasourceActions";
import {
  fetchGitProtectedBranchesInit,
  fetchGitStatusInit,
  remoteUrlInputValue,
  resetPullMergeStatus,
  fetchBranchesInit,
  triggerAutocommitInitAction,
  getGitMetadataInitAction,
} from "actions/gitSyncActions";
import { restoreRecentEntitiesRequest } from "actions/globalSearchActions";
import { resetEditorSuccess } from "actions/initActions";
import {
  fetchAllPageEntityCompletion,
  setupPageAction,
} from "actions/pageActions";
import {
  executePageLoadActions,
  fetchActions,
} from "actions/pluginActionActions";
import { fetchPluginFormConfigs } from "actions/pluginActions";
import type { ApplicationPayload } from "entities/Application";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { addBranchParam } from "constants/routes";
import type { APP_MODE } from "entities/App";
import { call, fork, put, select, spawn } from "redux-saga/effects";
import type { EditConsolidatedApi } from "sagas/InitSagas";
import {
  failFastApiCalls,
  reportSWStatus,
  waitForWidgetConfigBuild,
} from "sagas/InitSagas";
import {
  getCurrentGitBranch,
  isGitPersistBranchEnabledSelector,
} from "selectors/gitSyncSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import history from "utils/history";
import type { AppEnginePayload } from ".";
import AppEngine, {
  ActionsNotFoundError,
  PluginFormConfigsNotFoundError,
  PluginsNotFoundError,
} from ".";
import { fetchJSLibraries } from "actions/JSLibraryActions";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import {
  waitForSegmentInit,
  waitForFetchUserSuccess,
} from "ee/sagas/userSagas";
import { getFirstTimeUserOnboardingComplete } from "selectors/onboardingSelectors";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { getAIPromptTriggered, setLatestGitBranchInLocal } from "utils/storage";
import { trackOpenEditorTabs } from "../../utils/editor/browserTabsTracking";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { waitForFetchEnvironments } from "ee/sagas/EnvironmentSagas";
import { getPageDependencyActions } from "ee/entities/Engine/actionHelpers";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import {
  getFeatureFlagsForEngine,
  type DependentFeatureFlags,
} from "ee/selectors/engineSelectors";
import { fetchJSCollections } from "actions/jsActionActions";
import {
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
} from "actions/appThemingActions";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { Span } from "@opentelemetry/api";
import { endSpan, startNestedSpan } from "UITelemetry/generateTraces";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import log from "loglevel";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public *setupEngine(payload: AppEnginePayload, rootSpan: Span): any {
    const editorSetupSpan = startNestedSpan(
      "AppEditorEngine.setupEngine",
      rootSpan,
    );

    yield* super.setupEngine.call(this, payload, rootSpan);
    yield put(resetEditorSuccess());
    CodemirrorTernService.resetServer();

    endSpan(editorSetupSpan);
  }

  private *loadPageThemesAndActions(
    toLoadPageId: string,
    applicationId: string,
    allResponses: EditConsolidatedApi,
    rootSpan: Span,
  ) {
    const loadPageThemesAndActionsSpan = startNestedSpan(
      "AppEditorEngine.loadPageThemesAndActions",
      rootSpan,
    );

    const {
      currentTheme,
      customJSLibraries,
      packagePullStatus,
      pageWithMigratedDsl,
      themes,
      unpublishedActionCollections,
      unpublishedActions,
    } = allResponses;
    const initActionsCalls = [
      setupPageAction({
        id: toLoadPageId,
        isFirstLoad: true,
        pageWithMigratedDsl,
        packagePullStatus,
      }),
      fetchActions({ applicationId, unpublishedActions }, []),
      fetchJSCollections({ applicationId, unpublishedActionCollections }),
      fetchSelectedAppThemeAction(applicationId, currentTheme),
      fetchAppThemesAction(applicationId, themes),
    ];

    const successActionEffects = [
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      ReduxActionTypes.SETUP_PAGE_SUCCESS,
    ];

    const failureActionEffects = [
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      ReduxActionErrorTypes.SETUP_PAGE_ERROR,
    ];

    initActionsCalls.push(fetchJSLibraries(applicationId, customJSLibraries));
    successActionEffects.push(ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS);

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

    const waitForUserSpan = startNestedSpan(
      "AppEditorEngine.waitForFetchUserSuccess",
      rootSpan,
    );

    yield call(waitForFetchUserSuccess);
    endSpan(waitForUserSpan);

    const waitForSegmentInitSpan = startNestedSpan(
      "AppEditorEngine.waitForSegmentInit",
      rootSpan,
    );

    yield call(waitForSegmentInit, true);
    endSpan(waitForSegmentInitSpan);

    const waitForFetchEnvironmentsSpan = startNestedSpan(
      "AppEditorEngine.waitForFetchEnvironments",
      rootSpan,
    );

    yield call(waitForFetchEnvironments);
    endSpan(waitForFetchEnvironmentsSpan);

    yield call(
      this.loadPluginsAndDatasources,
      allResponses,
      rootSpan,
      applicationId,
    );

    yield put(fetchAllPageEntityCompletion([executePageLoadActions()]));
    endSpan(loadPageThemesAndActionsSpan);
  }

  private *loadPluginsAndDatasources(
    allResponses: EditConsolidatedApi,
    rootSpan: Span,
    applicationId: string,
  ) {
    const loadPluginsAndDatasourcesSpan = startNestedSpan(
      "AppEditorEngine.loadPluginsAndDatasources",
      rootSpan,
    );
    const { mockDatasources, pluginFormConfigs } = allResponses || {};
    const isAirgappedInstance = isAirgapped();
    const currentWorkspaceId: string = yield select(getCurrentWorkspaceId);
    const featureFlags: DependentFeatureFlags = yield select(
      getFeatureFlagsForEngine,
    );
    const { errorActions, initActions, successActions } =
      getPageDependencyActions(
        currentWorkspaceId,
        featureFlags,
        allResponses,
        applicationId,
      );

    if (!isAirgappedInstance) {
      initActions.push(fetchMockDatasources(mockDatasources));
      successActions.push(ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS);
      errorActions.push(ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR);
    }

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
      [fetchPluginFormConfigs(pluginFormConfigs)],
      [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
    );

    endSpan(loadPluginsAndDatasourcesSpan);

    if (!pluginFormCall)
      throw new PluginFormConfigsNotFoundError(
        "Unable to fetch plugin form configs",
      );
  }

  public *loadAppEntities(
    toLoadPageId: string,
    applicationId: string,
    allResponses: EditConsolidatedApi,
    rootSpan: Span,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    yield call(
      this.loadPageThemesAndActions,
      toLoadPageId,
      applicationId,
      allResponses,
      rootSpan,
    );
  }

  public *completeChore(rootSpan: Span) {
    const completeChoreSpan = startNestedSpan(
      "AppEditorEngine.completeChore",
      rootSpan,
    );

    const isFirstTimeUserOnboardingComplete: boolean = yield select(
      getFirstTimeUserOnboardingComplete,
    );
    const currentApplication: ApplicationPayload = yield select(
      getCurrentApplication,
    );

    const isGitPersistBranchEnabled: boolean = yield select(
      isGitPersistBranchEnabledSelector,
    );

    if (isGitPersistBranchEnabled) {
      const currentUser: User = yield select(getCurrentUser);
      const currentBranch: string = yield select(getCurrentGitBranch);

      if (currentUser?.email && currentApplication?.baseId && currentBranch) {
        yield setLatestGitBranchInLocal(
          currentUser.email,
          currentApplication.baseId,
          currentBranch,
        );
      } else {
        log.error(
          `There was an error setting the latest git branch in local - userEmail: ${!!currentUser?.email}, applicationId: ${currentApplication?.baseId}, branch: ${currentBranch}`,
        );
      }
    }

    const [isAnotherEditorTabOpen, currentTabs] = yield call(
      trackOpenEditorTabs,
      currentApplication.id,
    );

    if (currentApplication) {
      AnalyticsUtil.logEvent("EDITOR_OPEN", {
        appId: currentApplication.id,
        appName: currentApplication.name,
        isAnotherEditorTabOpen,
        currentTabs,
      });
    }

    if (isFirstTimeUserOnboardingComplete) {
      yield put({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
        payload: [],
      });
    }

    const noOfTimesAIPromptTriggered: number = yield getAIPromptTriggered(
      EditorModes.TEXT_WITH_BINDING,
    );

    yield put({
      type: ReduxActionTypes.UPDATE_AI_TRIGGERED,
      payload: {
        value: noOfTimesAIPromptTriggered,
        mode: EditorModes.TEXT_WITH_BINDING,
      },
    });

    const noOfTimesAIPromptTriggeredForQuery: number =
      yield getAIPromptTriggered(EditorModes.POSTGRESQL_WITH_BINDING);

    yield put({
      type: ReduxActionTypes.UPDATE_AI_TRIGGERED,
      payload: {
        value: noOfTimesAIPromptTriggeredForQuery,
        mode: EditorModes.POSTGRESQL_WITH_BINDING,
      },
    });

    yield call(waitForWidgetConfigBuild);
    yield spawn(reportSWStatus);

    yield put({
      type: ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS,
    });

    endSpan(completeChoreSpan);
  }

  public *loadGit(applicationId: string, rootSpan: Span) {
    const loadGitSpan = startNestedSpan("AppEditorEngine.loadGit", rootSpan);

    const branchInStore: string = yield select(getCurrentGitBranch);

    yield put(
      restoreRecentEntitiesRequest({
        applicationId,
        branch: branchInStore,
      }),
    );
    // init of temporary remote url from old application
    yield put(remoteUrlInputValue({ tempRemoteUrl: "" }));
    // add branch query to path and fetch status

    if (branchInStore) {
      history.replace(addBranchParam(branchInStore));
      yield fork(this.loadGitInBackground);
    }

    endSpan(loadGitSpan);
  }

  private *loadGitInBackground() {
    yield put(fetchBranchesInit());
    yield put(fetchGitProtectedBranchesInit());
    yield put(fetchGitProtectedBranchesInit());
    yield put(getGitMetadataInitAction());
    yield put(triggerAutocommitInitAction());
    yield put(fetchGitStatusInit({ compareRemote: true }));
    yield put(resetPullMergeStatus());
  }
}
