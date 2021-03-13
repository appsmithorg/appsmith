import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { Datasource } from "entities/Datasource";
import ActionAPI, { ActionCreateUpdateResponse } from "api/ActionAPI";
import { GenericApiResponse } from "api/ApiResponses";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
import {
  copyActionError,
  copyActionSuccess,
  createActionSuccess,
  deleteActionSuccess,
  fetchActionsForPage,
  fetchActionsForPageSuccess,
  FetchActionsPayload,
  moveActionError,
  moveActionSuccess,
  SetActionPropertyPayload,
  updateAction,
  updateActionProperty,
  updateActionSuccess,
} from "actions/actionActions";
import {
  DynamicPath,
  isChildPropertyPath,
  isDynamicValue,
  removeBindingsFromActionObject,
} from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { transformRestAction } from "transformers/RestActionTransformer";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getDataSources,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { Action, ActionViewMode } from "entities/Action";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  getAction,
  getCurrentPageNameByActionId,
  getEditorConfig,
  getPageNameByPageId,
  getSettingConfig,
} from "selectors/entitiesSelector";
import { PLUGIN_TYPE_API } from "constants/ApiEditorConstants";
import history from "utils/history";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  QUERIES_EDITOR_URL,
} from "constants/routes";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  ACTION_COPY_SUCCESS,
  ACTION_CREATED_SUCCESS,
  ACTION_DELETE_SUCCESS,
  ACTION_MOVE_SUCCESS,
  createMessage,
  ERROR_ACTION_COPY_FAIL,
  ERROR_ACTION_MOVE_FAIL,
  ERROR_ACTION_RENAME_FAIL,
} from "constants/messages";
import PluginsApi from "api/PluginApi";
import _, { merge } from "lodash";
import { getConfigInitialValues } from "components/formControls/utils";

export function* createActionSaga(
  actionPayload: ReduxAction<
    Partial<Action> & { eventData: any; pluginId: string }
  >,
) {
  try {
    let payload = actionPayload.payload;
    if (actionPayload.payload.pluginId) {
      let editorConfig;
      editorConfig = yield select(
        getEditorConfig,
        actionPayload.payload.pluginId,
      );

      if (!editorConfig) {
        const formConfigResponse: GenericApiResponse<any> = yield PluginsApi.fetchFormConfig(
          actionPayload.payload.pluginId,
        );
        yield validateResponse(formConfigResponse);
        yield put({
          type: ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
          payload: {
            id: actionPayload.payload.pluginId,
            ...formConfigResponse.data,
          },
        });

        editorConfig = yield select(
          getEditorConfig,
          actionPayload.payload.pluginId,
        );
      }
      const settingConfig = yield select(
        getSettingConfig,
        actionPayload.payload.pluginId,
      );

      let initialValues = yield call(getConfigInitialValues, editorConfig);
      if (settingConfig) {
        const settingInitialValues = yield call(
          getConfigInitialValues,
          settingConfig,
        );
        initialValues = merge(initialValues, settingInitialValues);
      }
      payload = merge(initialValues, actionPayload.payload);
    }

    const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
      payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const actionName = actionPayload.payload.name
        ? actionPayload.payload.name
        : "";
      Toaster.show({
        text: createMessage(ACTION_CREATED_SUCCESS, actionName),
        variant: Variant.success,
      });

      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_ACTION", {
        id: response.data.id,
        actionName: response.data.name,
        pageName: pageName,
        ...actionPayload.payload.eventData,
      });

      const newAction = response.data;

      yield put(createActionSuccess(newAction));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}

export function* fetchActionsSaga(action: ReduxAction<FetchActionsPayload>) {
  const { applicationId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "EDITOR", appId: applicationId },
  );
  try {
    const response: GenericApiResponse<Action[]> = yield ActionAPI.fetchActions(
      applicationId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export function* fetchActionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "VIEWER", appId: applicationId },
  );
  try {
    const response: GenericApiResponse<ActionViewMode[]> = yield ActionAPI.fetchActionsForViewMode(
      applicationId,
    );
    const correctFormatResponse = response.data.map((action) => {
      return {
        ...action,
        actionConfiguration: {
          timeoutInMillisecond: action.timeoutInMillisecond,
        },
      };
    });
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
        payload: correctFormatResponse,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export function* fetchActionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
    { pageId: pageId },
  );
  try {
    const response: GenericApiResponse<Action[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchActionsForPageSuccess(response.data));
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
      );
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_PAGE_ACTIONS_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* updateActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { actionid: actionPayload.payload.id },
    );
    let action = yield select(getAction, actionPayload.payload.id);
    if (!action) throw new Error("Could not find action to update");
    const isApi = action.pluginType === "API";

    if (isApi) {
      action = transformRestAction(action);
    }

    const response: GenericApiResponse<Action> = yield ActionAPI.updateAPI(
      action,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      if (action.pluginType === QUERY_CONSTANT) {
        AnalyticsUtil.logEvent("SAVE_QUERY", {
          queryName: action.name,
          pageName,
        });
      } else if (action.pluginType === PLUGIN_TYPE_API) {
        AnalyticsUtil.logEvent("SAVE_API", {
          apiId: response.data.id,
          apiName: response.data.name,
          pageName: pageName,
        });
      }

      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.UPDATE_ACTION_API,
      );

      yield put(updateActionSuccess({ data: response.data }));
    }
  } catch (error) {
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.UPDATE_ACTION_API,
      { failed: true },
    );
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

export function* deleteActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const name = actionPayload.payload.name;
    const action = yield select(getAction, id);

    const isApi = action.pluginType === PLUGIN_TYPE_API;
    const isQuery = action.pluginType === QUERY_CONSTANT;

    const response: GenericApiResponse<Action> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(ACTION_DELETE_SUCCESS, response.data.name),
        variant: Variant.success,
      });
      if (isApi) {
        const pageName = yield select(getCurrentPageNameByActionId, id);
        AnalyticsUtil.logEvent("DELETE_API", {
          apiName: name,
          pageName,
          apiID: id,
        });
      }
      if (isQuery) {
        AnalyticsUtil.logEvent("DELETE_QUERY", {
          queryName: action.name,
        });
      }

      yield put(deleteActionSuccess({ id }));
      const applicationId = yield select(getCurrentApplicationId);
      const pageId = yield select(getCurrentPageId);
      if (isApi) {
        history.push(API_EDITOR_URL(applicationId, pageId));
      }
      if (isQuery) {
        history.push(QUERIES_EDITOR_URL(applicationId, pageId));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

function* moveActionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
    originalPageId: string;
    name: string;
  }>,
) {
  const actionObject: Action = yield select(getAction, action.payload.id);
  const withoutBindings = removeBindingsFromActionObject(actionObject);
  try {
    const response = yield ActionAPI.moveAction({
      action: {
        ...withoutBindings,
        pageId: action.payload.originalPageId,
        name: action.payload.name,
      },
      destinationPageId: action.payload.destinationPageId,
    });

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(ACTION_MOVE_SUCCESS, response.data.name, pageName),
        variant: Variant.success,
      });
    }

    AnalyticsUtil.logEvent("MOVE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    Toaster.show({
      text: createMessage(ERROR_ACTION_MOVE_FAIL, actionObject.name),
      variant: Variant.danger,
    });
    yield put(
      moveActionError({
        id: action.payload.id,
        originalPageId: action.payload.originalPageId,
      }),
    );
  }
}

function* copyActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  let actionObject: Action = yield select(getAction, action.payload.id);
  try {
    if (!actionObject) throw new Error("Could not find action to copy");
    if (action.payload.destinationPageId !== actionObject.pageId) {
      actionObject = removeBindingsFromActionObject(actionObject);
    }

    const copyAction = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<Action>;
    delete copyAction.id;
    const response = yield ActionAPI.createAPI(copyAction);
    const datasources = yield select(getDataSources);

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(ACTION_COPY_SUCCESS, actionObject.name, pageName),
        variant: Variant.success,
      });
    }

    AnalyticsUtil.logEvent("DUPLICATE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });

    // checking if there is existing datasource to be added to the action payload
    const existingDatasource = datasources.find(
      (d: Datasource) => d.id === response.data.datasource.id,
    );

    let payload = response.data;

    if (existingDatasource) {
      payload = { ...payload, datasource: existingDatasource };
    }

    yield put(copyActionSuccess(payload));
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    Toaster.show({
      text: createMessage(ERROR_ACTION_COPY_FAIL, actionName),
      variant: Variant.danger,
    });
    yield put(copyActionError(action.payload));
  }
}

export function* refactorActionName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  // fetch page of the action
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { actionId: id },
  );
  const pageResponse = yield call(PageApi.fetchPage, {
    id: pageId,
  });
  // check if page request is successful
  const isPageRequestSuccessful = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    const refactorResponse = yield ActionAPI.updateActionName({
      layoutId,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });

    const isRefactorSuccessful = yield validateResponse(refactorResponse);

    const currentPageId = yield select(getCurrentPageId);

    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.REFACTOR_ACTION_NAME,
      { isSuccess: isRefactorSuccessful },
    );
    if (isRefactorSuccessful) {
      yield put({
        type: ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
        payload: {
          actionId: id,
        },
      });
      if (currentPageId === pageId) {
        yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
      } else {
        yield put(fetchActionsForPage(pageId));
      }
    }
  }
}

function* saveActionName(action: ReduxAction<{ id: string; name: string }>) {
  // Takes from state, checks if the name isValid, saves
  const apiId = action.payload.id;
  const api = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === apiId,
    ),
  );
  try {
    yield refactorActionName(
      api.config.id,
      api.config.pageId,
      api.config.name,
      action.payload.name,
    );
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: api.config.name,
      },
    });
    Toaster.show({
      text: createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name),
      variant: Variant.danger,
    });
    console.error(e);
  }
}

function getDynamicBindingsChangesSaga(
  action: Action,
  value: unknown,
  field: string,
) {
  const bindingField = field.replace("actionConfiguration.", "");
  let dynamicBindings: DynamicPath[] = action.dynamicBindingPathList || [];

  if (typeof value === "object") {
    dynamicBindings = dynamicBindings.filter((dynamicPath) => {
      if (isChildPropertyPath(bindingField, dynamicPath.key)) {
        const childPropertyValue = _.get(value, dynamicPath.key);
        return isDynamicValue(childPropertyValue);
      }
    });
  } else if (typeof value === "string") {
    const fieldExists = _.some(dynamicBindings, { key: bindingField });

    const isDynamic = isDynamicValue(value);

    if (!isDynamic && fieldExists) {
      dynamicBindings = dynamicBindings.filter((d) => d.key !== bindingField);
    }
    if (isDynamic && !fieldExists) {
      dynamicBindings.push({ key: bindingField });
    }
  }

  return dynamicBindings;
}

function* setActionPropertySaga(action: ReduxAction<SetActionPropertyPayload>) {
  const { actionId, value, propertyName } = action.payload;
  if (!actionId) return;
  if (propertyName === "name") return;

  const actionObj = yield select(getAction, actionId);
  const effects: Record<string, any> = {};
  // Value change effect
  effects[propertyName] = value;
  // Bindings change effect
  effects.dynamicBindingPathList = getDynamicBindingsChangesSaga(
    actionObj,
    value,
    propertyName,
  );
  yield all(
    Object.keys(effects).map((field) =>
      put(updateActionProperty({ id: actionId, field, value: effects[field] })),
    ),
  );
  if (propertyName === "executeOnLoad") {
    yield put({
      type: ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_INIT,
      payload: {
        actionId,
        shouldExecute: value,
      },
    });
    return;
  }
  yield put(updateAction({ id: actionId }));
}

function* toggleActionExecuteOnLoadSaga(
  action: ReduxAction<{ actionId: string; shouldExecute: boolean }>,
) {
  try {
    const response = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      action.payload.actionId,
      action.payload.shouldExecute,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_SUCCESS,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_ERROR,
      payload: error,
    });
  }
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action: Action = yield select(getAction, id);
  const isApi = action.pluginType === PLUGIN_TYPE_API;
  const isQuery = action.pluginType === QUERY_CONSTANT;
  const applicationId = yield select(getCurrentApplicationId);

  if (isApi) {
    history.push(API_EDITOR_ID_URL(applicationId, action.pageId, action.id));
  }
  if (isQuery) {
    history.push(
      QUERIES_EDITOR_ID_URL(applicationId, action.pageId, action.id),
    );
  }
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.SET_ACTION_PROPERTY, setActionPropertySaga),
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeEvery(
      ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_INIT,
      fetchActionsForViewModeSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(ReduxActionTypes.SAVE_ACTION_NAME_INIT, saveActionName),
    takeLatest(ReduxActionTypes.MOVE_ACTION_INIT, moveActionSaga),
    takeLatest(ReduxActionTypes.COPY_ACTION_INIT, copyActionSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
      fetchActionsForPageSaga,
    ),
    takeEvery(ReduxActionTypes.MOVE_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.COPY_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.MOVE_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(
      ReduxActionTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_INIT,
      toggleActionExecuteOnLoadSaga,
    ),
  ]);
}
