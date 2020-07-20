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
  debounce,
} from "redux-saga/effects";
import ActionAPI, { ActionCreateUpdateResponse, Property } from "api/ActionAPI";
import _ from "lodash";
import { AppToaster } from "components/editorComponents/ToastComponent";
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
  isDynamicValue,
  removeBindingsFromActionObject,
} from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { transformRestAction } from "transformers/RestActionTransformer";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { ToastType } from "react-toastify";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { Action, RestAction } from "entities/Action";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  getAction,
  getCurrentPageNameByActionId,
  getPageNameByPageId,
} from "selectors/entitiesSelector";
import { PLUGIN_TYPE_API } from "constants/ApiEditorConstants";
import history from "utils/history";
import { API_EDITOR_URL, QUERIES_EDITOR_URL } from "constants/routes";
import { changeApi } from "actions/apiPaneActions";
import { changeQuery } from "actions/queryPaneActions";

export function* createActionSaga(actionPayload: ReduxAction<RestAction>) {
  try {
    const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
      actionPayload.payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionPayload.payload.name} Action created`,
        type: ToastType.SUCCESS,
      });

      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_API", {
        apiId: response.data.id,
        apiName: response.data.name,
        pageName: pageName,
      });
      yield put(createActionSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}

export function* fetchActionsSaga(action: ReduxAction<FetchActionsPayload>) {
  try {
    const { applicationId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield ActionAPI.fetchActions(
      applicationId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  try {
    const { applicationId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield ActionAPI.fetchActionsForViewMode(
      applicationId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  try {
    const { pageId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchActionsForPageSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* updateActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    let action: Action = yield select(getAction, actionPayload.payload.id);
    const isApi = action.pluginType === "API";
    const isDB = action.pluginType === "DB";

    if (isApi) {
      action = transformRestAction(action);
    }
    if (isApi || isDB) {
      action = _.omit(action, "name") as RestAction;
    }

    const response: GenericApiResponse<RestAction> = yield ActionAPI.updateAPI(
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

      yield put(updateActionSuccess({ data: response.data }));
    }
  } catch (error) {
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

    const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        type: ToastType.SUCCESS,
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
  const actionObject: RestAction = yield select(getAction, action.payload.id);
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
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action moved`,
        type: ToastType.SUCCESS,
      });
    }
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    AnalyticsUtil.logEvent("MOVE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while moving action ${actionObject.name}`,
      type: ToastType.ERROR,
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
  let actionObject: RestAction = yield select(getAction, action.payload.id);
  if (action.payload.destinationPageId !== actionObject.pageId) {
    actionObject = removeBindingsFromActionObject(actionObject);
  }
  try {
    const copyAction = {
      ...(_.omit(actionObject, "id") as RestAction),
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    };
    const response = yield ActionAPI.createAPI(copyAction);

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionObject.name} Action copied`,
        type: ToastType.SUCCESS,
      });
    }

    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    AnalyticsUtil.logEvent("DUPLICATE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
    yield put(copyActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while copying action ${actionObject.name}`,
      type: ToastType.ERROR,
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
  const pageResponse = yield call(PageApi.fetchPage, {
    pageId: pageId,
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
  // Takes from drafts, checks if the name isValid, saves
  const apiId = action.payload.id;
  const api = yield select(state =>
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
    AppToaster.show({
      message: `Unable to update API name`,
      type: ToastType.ERROR,
    });
    console.error(e);
  }
}

function getDynamicBindingsChangesSaga(
  action: Action,
  value: string,
  field: string,
) {
  const bindingField = field.replace("actionConfiguration.", "");
  const isDynamic = isDynamicValue(value);
  let dynamicBindings: Property[] = action.dynamicBindingPathList || [];
  const fieldExists = _.some(dynamicBindings, { key: bindingField });

  if (!isDynamic && fieldExists) {
    dynamicBindings = dynamicBindings.filter(d => d.key !== bindingField);
  }
  if (isDynamic && !fieldExists) {
    dynamicBindings.push({ key: bindingField });
  }
  if (dynamicBindings !== action.dynamicBindingPathList) {
    return dynamicBindings;
  }
  return action.dynamicBindingPathList;
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
    Object.keys(effects).map(field =>
      put(updateActionProperty({ id: actionId, field, value: effects[field] })),
    ),
  );
  yield put(updateAction({ id: actionId }));
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const isApi = action.pluginType === PLUGIN_TYPE_API;
  const isQuery = action.pluginType === QUERY_CONSTANT;

  if (isApi) {
    yield put(changeApi(id));
  }
  if (isQuery) {
    yield put(changeQuery(id));
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
    debounce(500, ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
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
  ]);
}
