import { call, put } from "redux-saga/effects";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { fetchPluginFormConfigs, fetchPlugins } from "actions/pluginActions";
import {
  fetchDatasources,
  fetchMockDatasources,
} from "actions/datasourceActions";
import { failFastApiCalls } from "sagas/InitSagas";
import {
  ActionsNotFoundError,
  PluginFormConfigsNotFoundError,
  PluginsNotFoundError,
} from "entities/Engine";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { fetchWorkflowSaga } from "@appsmith/sagas/workflowsSagas";
import { fetchAllPageEntityCompletion } from "actions/pageActions";
import type { FetchWorkflowResponse } from "@appsmith/api/WorkflowApi";
import {
  fetchWorkflowActions,
  fetchWorkflowJSCollections,
} from "@appsmith/actions/workflowActions";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import history from "utils/history";

export default class WorkflowEditorEngine {
  *loadWorkflow(workflowId: string) {
    const response: FetchWorkflowResponse = yield call(fetchWorkflowSaga, {
      workflowId,
    });

    yield put({
      type: ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
      payload: {
        workspaceId: response.data.workspaceId,
        editorId: workflowId,
      },
    });

    yield put({
      type: ReduxActionTypes.SET_CURRENT_WORKFLOW_ID,
      payload: {
        workflowId,
      },
    });

    // Load the main js object id on workflow load
    try {
      const { mainJsObjectId } = response.data;
      history.replace(
        jsCollectionIdURL({ workflowId, collectionId: mainJsObjectId }),
      );
    } catch (e) {
      return;
    }
  }

  public *setupEngine() {
    yield put({ type: ReduxActionTypes.START_EVALUATION });
    CodemirrorTernService.resetServer();
  }

  *loadPageThemesAndActions(workflowId: string) {
    const initActionsCalls = [
      fetchWorkflowActions({ workflowId }, []),
      fetchWorkflowJSCollections({ workflowId }),
    ];

    const successActionEffects = [
      ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
    ];

    const failureActionEffects = [
      ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
    ];

    const allActionCalls: boolean = yield call(
      failFastApiCalls,
      initActionsCalls,
      successActionEffects,
      failureActionEffects,
    );

    if (!allActionCalls)
      throw new ActionsNotFoundError(
        `Unable to fetch actions for the workflow: ${workflowId}`,
      );

    yield put(fetchAllPageEntityCompletion([]));
  }

  *loadPluginsAndDatasources() {
    const isAirgappedInstance = isAirgapped();
    const initActions: ReduxAction<unknown>[] = [
      fetchPlugins(),
      fetchDatasources(),
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
      initActions.push(fetchMockDatasources() as ReduxAction<{ type: string }>);
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
      type: ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR_SUCCESS,
    });
  }
}
