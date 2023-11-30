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
  SetupModulePayload,
  UpdateModuleInputsPayload,
} from "@appsmith/actions/moduleActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  CreateModulePayload,
  FetchModuleActionsResponse,
} from "@appsmith/api/ModuleApi";
import history from "utils/history";
import {
  currentPackageEditorURL,
  moduleEditorURL,
} from "@appsmith/RouteBuilder";
import {
  PluginPackageName,
  type Action,
  type CreateActionDefaultsParams,
  type CreateApiActionDefaultsParams,
} from "entities/Action";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import {
  MODULE_TYPE,
  type Module,
  MODULE_PREFIX,
} from "@appsmith/constants/ModuleConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import { getAllModules } from "@appsmith/selectors/modulesSelector";
import { createNewModuleName } from "@appsmith/utils/Packages/moduleHelpers";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { generateDefaultInputSection } from "@appsmith/components/InputsForm/Fields/helper";

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

export function* updateModuleInputsSaga(
  action: ReduxAction<UpdateModuleInputsPayload>,
) {
  try {
    const { id, inputsForm } = action.payload;
    const module: ReturnType<typeof getModuleById> = yield select(
      getModuleById,
      id,
    );

    if (!module) {
      throw Error("Saving module inputs failed. Module not found.");
    }

    const updatedModule = {
      ...module,
      inputsForm,
    };

    const response: ApiResponse = yield call(
      ModuleApi.updateModule,
      updatedModule,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INPUTS_ERROR,
      payload: { error },
    });
  }
}

export function* fetchModuleActionsSaga(
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
    const newActionName = createNewModuleName(allModules, MODULE_PREFIX.QUERY);

    const defaultAction: Partial<Action> = datasourceId
      ? yield call(createDefaultActionPayloadWithPluginDefaults, {
          datasourceId,
          from,
          newActionName,
        } as CreateActionDefaultsParams)
      : yield call(createDefaultApiActionPayload, {
          apiType,
          from,
          newActionName,
        } as CreateApiActionDefaultsParams);

    const { name, ...restAction } = defaultAction;
    const payload: CreateModulePayload = {
      packageId,
      name,
      type: MODULE_TYPE.QUERY,
      inputsForm: [generateDefaultInputSection()],
      entity: {
        type: ENTITY_TYPE_VALUE.ACTION,
        ...restAction,
      },
    };

    const response: ApiResponse<Module> = yield call(
      ModuleApi.createModule,
      payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
        payload: response.data,
      });

      history.push(moduleEditorURL({ moduleId: response.data.id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_QUERY_MODULE_ERROR,
      payload: { error },
    });
  }
}

export function* setupModuleSaga(action: ReduxAction<SetupModulePayload>) {
  try {
    const { moduleId } = action.payload;

    yield call(fetchModuleActionsSaga, {
      payload: { moduleId: moduleId },
      type: ReduxActionTypes.FETCH_MODULE_ACTIONS_INIT,
    });

    yield put({
      type: ReduxActionTypes.SET_CURRENT_MODULE,
      payload: { id: moduleId },
    });

    // To start eval for new module
    yield put({
      type: ReduxActionTypes.FETCH_ALL_MODULE_ENTITY_COMPLETION,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_ERROR,
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
      fetchModuleActionsSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_QUERY_MODULE_INIT,
      createQueryModuleSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT,
      updateModuleInputsSaga,
    ),
    takeLatest(ReduxActionTypes.SETUP_MODULE_INIT, setupModuleSaga),
  ]);
}
