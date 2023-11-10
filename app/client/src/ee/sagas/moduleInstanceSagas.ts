import { moduleInstanceQueryEditorIdURL } from "@appsmith/RouteBuilder";
import type {
  CreateQueryModuleInstancePayload,
  FetchModuleInstancesPayload,
} from "@appsmith/actions/moduleInstanceActions";
import ModuleInstancesApi from "@appsmith/api/ModuleInstanceApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { all, call, put, takeLatest } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";

function* createQueryModuleInstanceSaga(
  action: ReduxAction<CreateQueryModuleInstancePayload>,
) {
  const { creatorId, creatorType, moduleId } = action.payload;
  try {
    const response: Awaited<
      ReturnType<typeof ModuleInstancesApi.createModuleInstance>
    >["data"] = yield call(ModuleInstancesApi.createModuleInstance, {
      moduleId,
      creatorId,
      creatorType,
    });
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) throw response.responseMeta.error;

    yield put({
      type: ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
      payload: response.data.moduleInstance,
    });

    const redirectURL = moduleInstanceQueryEditorIdURL({
      moduleId: moduleId,
      queryId: response.data.moduleInstance.id,
    });
    if (redirectURL) {
      history.push(redirectURL);
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

    const response: Awaited<
      ReturnType<typeof ModuleInstancesApi.getModuleInstances>
    >["data"] = yield call(ModuleInstancesApi.getModuleInstances, {
      creatorId,
      creatorType,
    });
    const isValidResponse = validateResponse(response);
    if (!isValidResponse) throw response.responseMeta.error;

    yield put({
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
      payload: response.data.moduleInstances,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_ERROR,
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
  ]);
}
