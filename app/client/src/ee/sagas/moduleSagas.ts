import { takeLatest, all, call, put, select } from "redux-saga/effects";

import ModuleApi from "@appsmith/api/ModuleApi";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import type { ApiResponse } from "api/ApiResponses";
import type {
  CreateQueryModulePayload,
  DeleteModulePayload,
  FetchModuleActionsPayload,
  SaveModuleNamePayload,
} from "@appsmith/actions/moduleActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  CreateModuleActionPayload,
  FetchModuleActionsResponse,
} from "@appsmith/api/ModuleApi";
import history from "utils/history";
import { currentPackageEditorURL } from "@appsmith/RouteBuilder";
import type { ApiAction } from "entities/Action";
import {
  PluginPackageName,
  type Action,
  type CreateActionDefaultsParams,
  type CreateApiActionDefaultsParams,
} from "entities/Action";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import {
  MODULE_ACTION_TYPE,
  MODULE_TYPE,
  type Module,
  MODULE_PREFIX,
} from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { createNewQueryModuleName } from "@appsmith/utils/Packages/moduleHelpers";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";

export function* deleteModuleSaga(action: ReduxAction<DeleteModulePayload>) {
  try {
    const response: ApiResponse = yield call(
      ModuleApi.deleteModule,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS,
        payload: action.payload,
      });

      if (!!action.payload.onSuccess) {
        action.payload.onSuccess();
      } else {
        history.push(currentPackageEditorURL());
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_QUERY_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* saveModuleNameSaga(
  action: ReduxAction<SaveModuleNamePayload>,
) {
  try {
    const { id, name } = action.payload;
    const module: ReturnType<typeof getModuleById> = yield select(
      getModuleById,
      id,
    );

    if (!module) {
      throw Error("Saving module name failed. Module not found.");
    }

    const updatedModule = {
      ...module,
      name,
    };

    const response: ApiResponse = yield call(
      ModuleApi.updateModule,
      updatedModule,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR,
      payload: { error },
    });
  }
}

export function* fetchModuleActionsSagas(
  action: ReduxAction<FetchModuleActionsPayload>,
) {
  try {
    const response: ApiResponse<FetchModuleActionsResponse> = yield call(
      ModuleApi.fetchActions,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_ACTIONS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

/**
 * Creates an action with specific datasource created by a user
 * @param action
 */
export function* createQueryModuleSaga(
  action: ReduxAction<CreateQueryModulePayload>,
) {
  try {
    const {
      apiType = PluginPackageName.REST_API,
      datasourceId,
      from,
      packageId,
    } = action.payload;
    const allModules: ModulesReducerState = yield select(getAllModules);
    const newActionName = createNewQueryModuleName(
      allModules,
      MODULE_PREFIX.QUERY,
    );

    let actionPayload: CreateModuleActionPayload;

    if (datasourceId) {
      const createQueryModulePayload: Partial<Action> = yield call(
        createDefaultActionPayloadWithPluginDefaults,
        {
          datasourceId,
          from,
          newActionName,
        } as CreateActionDefaultsParams,
      );

      const { name, ...rest } = createQueryModulePayload;

      actionPayload = {
        packageId,
        name,
        type: MODULE_TYPE.QUERY,
        entity: {
          type: MODULE_ACTION_TYPE.ACTION,
          ...rest,
        },
      };
    } else {
      const createQueryModulePayload: Partial<ApiAction> = yield call(
        createDefaultApiActionPayload,
        {
          apiType,
          from,
          newActionName,
        } as CreateApiActionDefaultsParams,
      );

      const { name, ...rest } = createQueryModulePayload;

      actionPayload = {
        packageId,
        name,
        type: MODULE_TYPE.QUERY,
        entity: {
          type: MODULE_ACTION_TYPE.ACTION,
          ...rest,
        },
      };
    }

    const response: ApiResponse<Module> = yield call(
      ModuleApi.createModule,
      actionPayload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_QUERY_MODULE_ERROR,
      payload: { error },
    });
  }
}

export default function* modulesSaga() {
  yield all([
    takeLatest(ReduxActionTypes.DELETE_QUERY_MODULE_INIT, deleteModuleSaga),
    takeLatest(ReduxActionTypes.SAVE_MODULE_NAME_INIT, saveModuleNameSaga),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_ACTIONS_INIT,
      fetchModuleActionsSagas,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
      createQueryModuleSaga,
    ),
  ]);
}
