import { call, put, select, take } from "redux-saga/effects";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import {
  fetchDatasources,
  fetchMockDatasources,
} from "actions/datasourceActions";
import { failFastApiCalls } from "sagas/InitSagas";
import {
  PluginFormConfigsNotFoundError,
  PluginsNotFoundError,
} from "entities/Engine";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { getWorkspaceFromId } from "ee/selectors/workspaceSelectors";
import { fetchAllWorkspaces } from "ee/actions/workspaceActions";

export default class WorkspaceDatasourceEngine {
  constructor() {
    this.setupEngine = this.setupEngine.bind(this);
    this.loadWorkspace = this.loadWorkspace.bind(this);
    this.loadPluginsAndDatasources = this.loadPluginsAndDatasources.bind(this);
    this.completeChore = this.completeChore.bind(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  *loadWorkspace(workspaceId: string): any {
    // Set the current workspace context
    yield put({
      type: ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
      payload: {
        workspaceId,
        editorId: workspaceId, // Use workspaceId as editorId for workspace context
      },
    });

    // Check if workspace exists, if not fetch it
    const workspace = yield select(getWorkspaceFromId, workspaceId);

    if (!workspace) {
      yield put(fetchAllWorkspaces({ workspaceId, fetchEntities: true }));
      // Wait for workspaces to be fetched
      yield take([
        ReduxActionTypes.FETCH_ALL_WORKSPACES_SUCCESS,
        ReduxActionErrorTypes.FETCH_WORKSPACES_ERROR,
      ]);
    }
  }

  public *setupEngine() {
    yield put({ type: ReduxActionTypes.START_EVALUATION });
    CodemirrorTernService.resetServer();
  }

  *loadPluginsAndDatasources(workspaceId: string) {
    const isAirgappedInstance = isAirgapped();
    const initActions: ReduxAction<unknown>[] = [
      fetchPlugins({ workspaceId }),
      fetchDatasources({ workspaceId }),
    ];

    const successActions = [
      ReduxActionTypes.FETCH_PLUGINS_SUCCESS,
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
    ];

    const errorActions = [
      ReduxActionErrorTypes.FETCH_PLUGINS_ERROR,
      ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
    ];

    if (!isAirgappedInstance) {
      initActions.push(fetchMockDatasources());
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
      [fetchPluginFormConfigs()],
      [ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS],
      [ReduxActionErrorTypes.FETCH_PLUGIN_FORM_CONFIGS_ERROR],
    );

    if (!pluginFormCall)
      throw new PluginFormConfigsNotFoundError(
        "Unable to fetch plugin form configs",
      );
  }

  *completeChore() {
    yield put({
      type: ReduxActionTypes.INITIALIZE_WORKSPACE_DATASOURCE_SUCCESS,
    });
  }
}
