import { builderURL, moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import type { RunQueryModuleInstancePayload } from "@appsmith/actions/moduleInstanceActions";
import {
  fetchModuleInstanceEntities,
  type CreateQueryModuleInstancePayload,
  type DeleteModuleInstancePayload,
  type FetchModuleInstancesPayload,
  type SaveModuleInstanceNamePayload,
  type SetupModuleInstancePayload,
  type UpdateModuleInstanceOnPageLoadSettingsPayload,
  type UpdateModuleInstancePayload,
  type UpdateModuleInstanceSettingsPayload,
  setupModuleInstances,
} from "@appsmith/actions/moduleInstanceActions";
import ModuleInstanceApi from "@appsmith/api/ModuleInstanceApi";
import ModuleInstancesApi, {
  type CreateModuleInstanceResponse,
  type FetchModuleInstanceEntitiesResponse,
} from "@appsmith/api/ModuleInstanceApi";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { ModuleInstanceCreatorType } from "@appsmith/constants/ModuleInstanceConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getModuleInstanceById,
  getModuleInstancePublicAction,
} from "@appsmith/selectors/moduleInstanceSelectors";
import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { runActionSaga } from "sagas/ActionExecution/PluginActionSaga";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import { shouldBeDefined } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";
import {
  getCurrentLayoutId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { toast } from "design-system";
import {
  MODULE_INSTANCE_RENAME_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import * as log from "loglevel";
import { updateCanvasWithDSL } from "@appsmith/sagas/PageSagas";

export interface RefactorModuleInstanceNameProps {
  id: string;
  pageId: string;
  oldName: string;
  newName: string;
}

function* createQueryModuleInstanceSaga(
  action: ReduxAction<CreateQueryModuleInstancePayload>,
) {
  const { contextId, contextType, name, sourceModuleId } = action.payload;
  try {
    const response: ApiResponse<CreateModuleInstanceResponse> = yield call(
      ModuleInstancesApi.createModuleInstance,
      {
        sourceModuleId,
        contextId,
        contextType,
        name,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data,
      });

      const redirectURL = moduleInstanceEditorURL({
        pageId: contextId,
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
    const { contextId, contextType } = action.payload;

    const response: ApiResponse<ModuleInstance[]> = yield call(
      ModuleInstancesApi.fetchModuleInstances,
      {
        contextId,
        contextType,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS,
        payload: response.data,
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
    const { contextId, contextType } = action.payload;

    const response: ApiResponse<ModuleInstance[]> = yield call(
      ModuleInstancesApi.fetchModuleInstancesForView,
      {
        contextId,
        contextType,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_SUCCESS,
        payload: response.data,
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

    const response: ApiResponse<ModuleInstance[]> = yield call(
      ModuleInstanceApi.updateModuleInstance,
      payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
        payload: response.data,
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
    const { contextId, contextType } = action.payload;

    const response: ApiResponse<FetchModuleInstanceEntitiesResponse> =
      yield call(ModuleInstancesApi.fetchModuleInstanceEntities, {
        contextId,
        contextType,
      });
    const isValidResponse: boolean = yield validateResponse(response);
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
    const { contextId, contextType } = action.payload;

    yield call(fetchModuleInstancesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_INIT,
      payload: { contextId, contextType },
    });

    yield call(fetchModuleInstanceEntitiesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      payload: { contextId, contextType },
    });

    yield put({
      type: ReduxActionTypes.SETUP_MODULE_INSTANCE_SUCCESS,
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
    const { contextId, contextType } = action.payload;

    yield call(fetchModuleInstancesForViewSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_INIT,
      payload: { contextId, contextType },
    });

    yield call(fetchModuleInstanceEntitiesSaga, {
      type: ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_INIT,
      payload: { contextId, contextType },
    });

    yield put({
      type: ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_SUCCESS,
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
    const isValidResponse: boolean = yield validateResponse(response);
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
    const isValidResponse: boolean = yield validateResponse(response);
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

function* runQueryModuleInstanceSaga(
  reduxAction: ReduxAction<RunQueryModuleInstancePayload>,
) {
  try {
    const { id } = reduxAction.payload;
    const action: Action | undefined = yield select(
      getModuleInstancePublicAction,
      id,
    );

    if (!action) throw new Error("Public action of module instance not found");

    yield call(runActionSaga, {
      payload: {
        id: action.id,
        action,
        skipOpeningDebugger: false,
        paginationField: undefined,
      },
      type: ReduxActionTypes.RUN_ACTION_REQUEST,
    });

    yield put({
      type: ReduxActionTypes.RUN_QUERY_MODULE_INSTANCE_SUCCESS,
      payload: {
        id,
      },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.RUN_QUERY_MODULE_INSTANCE_ERROR,
      payload: { error, id: reduxAction.payload.id },
    });
  }
}

function* deleteModuleInstanceSaga(
  action: ReduxAction<DeleteModuleInstancePayload>,
) {
  try {
    const currentPageId: string = yield select(getCurrentPageId);
    const response: ApiResponse = yield call(
      ModuleInstanceApi.deleteModuleInstance,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS,
        payload: action.payload,
      });
      history.push(builderURL({ pageId: currentPageId }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR,
      payload: { error, id: action.payload.id },
    });
  }
}

export function* refactorModuleInstanceName({
  id,
  newName,
  oldName,
  pageId,
}: RefactorModuleInstanceNameProps) {
  const layoutId: string = yield select(getCurrentLayoutId);
  // call to refactor module instance
  const refactorResponse: ApiResponse =
    yield ModuleInstanceApi.refactorModuleInstance({
      layoutId,
      moduleInstanceId: id,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });

  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

  const currentPageId: string = yield select(getCurrentPageId);

  if (isRefactorSuccessful) {
    yield put({
      type: ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS,
      payload: {
        moduleInstanceId: id,
      },
    });
    if (currentPageId === pageId) {
      // @ts-expect-error: refactorResponse is of type unknown
      yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
      yield put(
        fetchModuleInstanceEntities({
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
        }),
      );
    } else {
      yield put(
        setupModuleInstances({
          contextId: pageId,
          contextType: ModuleInstanceCreatorType.PAGE,
        }),
      );
    }
  }
}

function* saveModuleInstanceNameSaga(
  action: ReduxAction<SaveModuleInstanceNamePayload>,
) {
  const moduleInstanceId = action.payload.id;
  const moduleInstance = shouldBeDefined<ModuleInstance | undefined>(
    yield select((state: AppState) =>
      getModuleInstanceById(state, moduleInstanceId),
    ),
    `Module Instance not found for moduleInstanceId - ${moduleInstanceId}`,
  );
  try {
    yield refactorModuleInstanceName({
      id: moduleInstanceId || "",
      pageId: moduleInstance?.contextId || "",
      oldName: moduleInstance?.name || "",
      newName: action.payload.name,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR,
      payload: {
        id: action.payload.id,
      },
    });
    toast.show(
      createMessage(MODULE_INSTANCE_RENAME_ERROR, action.payload.name),
      {
        kind: "error",
      },
    );
    log.error(error);
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
    takeLatest(
      ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT,
      deleteModuleInstanceSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT,
      saveModuleInstanceNameSaga,
    ),
    takeLatest(
      ReduxActionTypes.RUN_QUERY_MODULE_INSTANCE_INIT,
      runQueryModuleInstanceSaga,
    ),
  ]);
}
