import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import type {
  CreateQueryModuleInstancePayload,
  FetchModuleInstancesPayload,
  SetupModuleInstancePayload,
  UpdateModuleInstanceOnPageLoadSettingsPayload,
  UpdateModuleInstancePayload,
  UpdateModuleInstanceSettingsPayload,
} from "@appsmith/actions/moduleInstanceActions";
import ModuleInstanceApi from "@appsmith/api/ModuleInstanceApi";
import ModuleInstancesApi, {
  type CreateModuleInstanceResponse,
  type FetchModuleInstanceEntitiesResponse,
  type FetchModuleInstancesResponse,
} from "@appsmith/api/ModuleInstanceApi";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";

function* createQueryModuleInstanceSaga(
  action: ReduxAction<CreateQueryModuleInstancePayload>,
) {
  const { creatorId, creatorType, moduleId } = action.payload;
  try {
    const response: ApiResponse<CreateModuleInstanceResponse> = yield call(
      ModuleInstancesApi.createModuleInstance,
      {
        moduleId,
        creatorId,
        creatorType,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data.moduleInstance,
      });

      const redirectURL = moduleInstanceEditorURL({
        pageId: creatorId,
        moduleInstanceId: response.data.moduleInstance.id,
      });
      if (redirectURL) {
        history.push(redirectURL);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_MODULE_INSTANCE_ERROR,
      payload: error,
    });
  }
}

function* fetchModuleInstancesSaga(
  action: ReduxAction<FetchModuleInstancesPayload>,
) {
  try {
    const { creatorId, creatorType } = action.payload;

    const response: ApiResponse<FetchModuleInstancesResponse> = yield call(
      ModuleInstancesApi.fetchModuleInstances,
      {
        creatorId,
        creatorType,
      },
    );
    response.data = {
      moduleInstances: [],
      modules: [],
    };
    response.responseMeta.success = true;
    response.responseMeta.status = 200;
    const isValidResponse = validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
        payload: response.data.moduleInstances,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_ERROR,
      error,
    });
  }
}

function* fetchModuleInstancesForViewSaga(
  action: ReduxAction<FetchModuleInstancesPayload>,
) {
  try {
    const { creatorId, creatorType } = action.payload;

    const response: ApiResponse<FetchModuleInstancesResponse> = yield call(
      ModuleInstancesApi.fetchModuleInstancesForView,
      {
        creatorId,
        creatorType,
      },
    );
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_SUCCESS,
        payload: response.data.moduleInstances,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_ERROR,
      error,
    });
  }
}

function* updateModuleInstanceSaga(
  action: ReduxAction<UpdateModuleInstancePayload>,
) {
  try {
    const moduleInstance: ReturnType<typeof getModuleInstanceById> =
      yield select(getModuleInstanceById, action.payload.id);

    if (!moduleInstance) {
      throw Error(
        "Saving module instance inputs failed. Module instance not found.",
      );
    }

    const payload: ModuleInstance = {
      ...moduleInstance,
      ...action.payload.moduleInstance,
    };

    const response: ApiResponse<FetchModuleInstancesResponse> = yield call(
      ModuleInstanceApi.updateModuleInstance,
      payload,
    );

    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data.moduleInstances,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ERROR,
      payload: { error },
    });
  }
}

function* fetchModuleInstanceEntitiesSaga(
  action: ReduxAction<FetchModuleInstancesPayload>,
) {
  try {
    const { creatorId, creatorType } = action.payload;

    const response: ApiResponse<FetchModuleInstanceEntitiesResponse> =
      yield call(ModuleInstancesApi.fetchModuleInstanceEntities, {
        creatorId,
        creatorType,
      });
    response.data = {
      actions: [],
      actionCollections: [],
    };
    response.responseMeta.success = true;
    response.responseMeta.status = 200;
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_ENTITIES_ERROR,
      error,
    });
  }
}

export function* setupModuleInstanceSaga(
  action: ReduxAction<SetupModuleInstancePayload>,
) {
  try {
    const { creatorId, creatorType } = action.payload;

    yield call(fetchModuleInstancesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
      payload: { creatorId, creatorType },
    });

    yield call(fetchModuleInstanceEntitiesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      payload: { creatorId, creatorType },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_ERROR,
      payload: { error },
    });
  }
}

export function* setupModuleInstanceForViewSaga(
  action: ReduxAction<SetupModuleInstancePayload>,
) {
  try {
    const { creatorId, creatorType } = action.payload;

    yield call(fetchModuleInstancesForViewSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_INIT,
      payload: { creatorId, creatorType },
    });

    yield call(fetchModuleInstanceEntitiesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      payload: { creatorId, creatorType },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_ERROR,
      payload: { error },
    });
  }
}

function* updateModuleInstanceOnPageLoadSettingsSaga(
  action: ReduxAction<UpdateModuleInstanceOnPageLoadSettingsPayload>,
) {
  try {
    const { actionId, value } = action.payload;
    const response: ApiResponse = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      actionId,
      value || false,
    );
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_ERROR,
      payload: { error },
    });
  }
}

function* updateModuleInstanceSettingsSaga(
  action: ReduxAction<UpdateModuleInstanceSettingsPayload>,
) {
  try {
    const response: ApiResponse<Action> = yield call(
      ActionAPI.updateAction,
      action.payload,
    );
    const isValidResponse = validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_SETTINGS_ERROR,
      payload: { error, id: action.payload.id },
    });
  }
}

// Watcher Saga
export default function* moduleInstanceSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_MODULE_INSTANCE_INIT,
      createQueryModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
      fetchModuleInstancesSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT,
      updateModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_INIT,
      updateModuleInstanceSettingsSaga,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT,
      updateModuleInstanceOnPageLoadSettingsSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_INIT,
      fetchModuleInstancesForViewSaga,
    ),
    takeLatest(
      ReduxActionTypes.SETUP_MODULE_INSTANCE_INIT,
      setupModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_INIT,
      setupModuleInstanceForViewSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      fetchModuleInstanceEntitiesSaga,
    ),
  ]);
}
