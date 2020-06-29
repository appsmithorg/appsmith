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
import ActionAPI, { ActionCreateUpdateResponse } from "api/ActionAPI";
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
  updateActionSuccess,
} from "actions/actionActions";
import { removeBindingsFromObject } from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { transformRestAction } from "transformers/RestActionTransformer";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ToastType } from "react-toastify";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { RestAction } from "entities/Action";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  getAction,
  getCurrentPageNameByActionId,
  getPageNameByPageId,
} from "selectors/entitiesSelector";

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

export function* updateActionSaga(
  actionPayload: ReduxAction<{ data: RestAction }>,
) {
  try {
    const isApi = actionPayload.payload.data.pluginType === "API";
    const isDB = actionPayload.payload.data.pluginType === "DB";

    const { data } = actionPayload.payload;
    let action = data;

    if (isApi) {
      action = transformRestAction(data);
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
      }

      AnalyticsUtil.logEvent("SAVE_API", {
        apiId: response.data.id,
        apiName: response.data.name,
        pageName: pageName,
      });
      yield put(updateActionSuccess({ data: response.data }));
      // if (actionPayload.payload.data.pluginType !== "DB") {
      //   yield put(runApiAction(data.id));
      // }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.data.id },
    });
  }
}

export function* deleteActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const name = actionPayload.payload.name;
    const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        type: ToastType.SUCCESS,
      });
      const pageName = yield select(getCurrentPageNameByActionId, id);
      AnalyticsUtil.logEvent("DELETE_API", {
        apiName: name,
        pageName: pageName,
        apiID: id,
      });
      yield put(deleteActionSuccess({ id }));
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
  const drafts = yield select(state => state.ui.apiPane.drafts);
  const dirty = action.payload.id in drafts;
  const actionObject: RestAction = dirty
    ? drafts[action.payload.id]
    : yield select(getAction, action.payload.id);
  const withoutBindings = removeBindingsFromObject(actionObject);
  try {
    const response = yield ActionAPI.moveAction({
      action: {
        ...withoutBindings,
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
  const drafts = yield select(state => state.ui.apiPane.drafts);
  const dirty = action.payload.id in drafts;
  let actionObject = dirty
    ? drafts[action.payload.id]
    : yield select(getAction, action.payload.id);
  if (action.payload.destinationPageId !== actionObject.pageId) {
    actionObject = removeBindingsFromObject(actionObject);
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
        type: ReduxActionTypes.SAVE_API_NAME_SUCCESS,
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

function* saveApiNameSaga(action: ReduxAction<{ id: string; name: string }>) {
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
      type: ReduxActionErrorTypes.SAVE_API_NAME_ERROR,
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

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(ReduxActionTypes.SAVE_API_NAME, saveApiNameSaga),
    takeLatest(ReduxActionTypes.MOVE_ACTION_INIT, moveActionSaga),
    takeLatest(ReduxActionTypes.COPY_ACTION_INIT, copyActionSaga),
    takeLatest(
      ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
      fetchActionsForPageSaga,
    ),
  ]);
}
