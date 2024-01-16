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
  PluginFormConfigsNotFoundError,
  PluginsNotFoundError,
} from "entities/Engine";
import { fetchPackageSaga } from "@appsmith/sagas/packagesSagas";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { FetchPackageResponse } from "@appsmith/api/PackageApi";

export default class PackageEditorEngine {
  *loadPackage(packageId: string) {
    const response: FetchPackageResponse = yield call(fetchPackageSaga, {
      packageId,
    });

    yield put({
      type: ReduxActionTypes.SET_CURRENT_WORKSPACE_ID,
      payload: {
        workspaceId: response.packageData.workspaceId,
        editorId: packageId,
      },
    });

    yield put({
      type: ReduxActionTypes.SET_CURRENT_PACKAGE_ID,
      payload: {
        packageId,
      },
    });
  }

  public *setupEngine() {
    yield put({ type: ReduxActionTypes.START_EVALUATION });
    CodemirrorTernService.resetServer();
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
      type: ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR_SUCCESS,
    });
  }
}
