import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import type {
  CreateQueryModuleInstancePayload,
  FetchModuleInstancesPayload,
  SetupModuleInstancePayload,
} from "@appsmith/actions/moduleInstanceActions";
import ModuleInstancesApi, {
  type CreateModuleInstanceResponse,
  type FetchModuleInstanceEntitiesResponse,
  type FetchModuleInstancesResponse,
} from "@appsmith/api/ModuleInstanceApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import { all, call, put, takeLatest } from "redux-saga/effects";
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
