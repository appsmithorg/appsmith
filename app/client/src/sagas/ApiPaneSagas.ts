/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import _ from "lodash";
import { all, select, put, takeEvery, take, call } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "constants/ReduxActionConstants";
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import history from "utils/history";
import { API_EDITOR_ID_URL, API_EDITOR_URL } from "constants/routes";
import { destroy, initialize } from "redux-form";
import { getAction } from "./ActionSagas";
import { AppState } from "reducers";
import { RestAction } from "api/ActionAPI";
import { FORM_INITIAL_VALUES } from "constants/ApiEditorConstants";
import { changeApi } from "actions/apiPaneActions";
import {
  API_PATH_START_WITH_SLASH_ERROR,
  FIELD_REQUIRED_ERROR,
  UNIQUE_NAME_ERROR,
  VALID_FUNCTION_NAME_ERROR,
} from "constants/messages";

const getApiDraft = (state: AppState, id: string) => {
  const drafts = state.ui.apiPane.drafts;
  if (id in drafts) return drafts[id];
  return {};
};

const getActions = (state: AppState) => state.entities.actions.data;

const getLastUsedAction = (state: AppState) => state.ui.apiPane.lastUsed;

const getRouterParams = (state: AppState) => state.ui.routesParams;

function* initApiPaneSaga(actionPayload: ReduxAction<{ id?: string }>) {
  let actions = yield select(getActions);
  while (!actions.length) {
    yield take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);
    actions = yield select(getActions);
  }
  const urlId = actionPayload.payload.id;
  const lastUsedId = yield select(getLastUsedAction);
  let id = "";
  if (urlId) {
    id = urlId;
  } else if (lastUsedId) {
    id = lastUsedId;
  }
  yield put(changeApi(id));
}

function* changeApiSaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const { applicationId, pageId } = yield select(getRouterParams);
  const action = yield select(getAction, id);
  if (!action) {
    history.push(API_EDITOR_URL(applicationId, pageId));
    return;
  }
  const draft = yield select(getApiDraft, id);
  yield put(destroy(API_EDITOR_FORM_NAME));
  const data = _.isEmpty(draft) ? action : draft;
  yield put(initialize(API_EDITOR_FORM_NAME, data));
  history.push(API_EDITOR_ID_URL(applicationId, pageId, id));
}

function* updateDraftsSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  if (!values.id) return;
  const action = yield select(getAction, values.id);
  if (_.isEqual(values, action)) {
    yield put({
      type: ReduxActionTypes.DELETE_API_DRAFT,
      payload: { id: values.id },
    });
  } else {
    yield put({
      type: ReduxActionTypes.UPDATE_API_DRAFT,
      payload: { id: values.id, draft: values },
    });
  }
}

function* validateInputSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const errors = {};
  const {
    payload,
    meta: { field },
  } = actionPayload;
  const actions: RestAction[] = yield select(getActions);
  const sameNames = actions.filter(
    (action: RestAction) => action.name === payload && action.id,
  );
  if (field === "name") {
    if (!_.trim(payload)) {
      _.set(errors, field, FIELD_REQUIRED_ERROR);
    } else if (payload.indexOf(" ") !== -1) {
      _.set(errors, field, VALID_FUNCTION_NAME_ERROR);
    } else if (sameNames.length > 0) {
      // TODO Check this
      _.set(errors, field, UNIQUE_NAME_ERROR);
    } else {
      _.unset(errors, field);
    }
  }
  if (field === "actionConfiguration.path") {
    if (payload && payload.startsWith("/")) {
      _.set(errors, field, API_PATH_START_WITH_SLASH_ERROR);
    } else {
      _.unset(errors, field);
    }
  }
  yield put({
    type: ReduxFormActionTypes.UPDATE_FIELD_ERROR,
    meta: {
      form: API_EDITOR_FORM_NAME,
    },
    payload: {
      syncErrors: errors,
    },
  });
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { form } = actionPayload.meta;
  if (form !== API_EDITOR_FORM_NAME) return;
  yield all([call(validateInputSaga, actionPayload), call(updateDraftsSaga)]);
}
function* handleActionCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = {
    ...action,
    ...FORM_INITIAL_VALUES,
  };
  yield put(initialize(API_EDITOR_FORM_NAME, data));
  const { applicationId, pageId } = yield select(getRouterParams);
  history.push(API_EDITOR_ID_URL(applicationId, pageId, id));
}

function* handleActionUpdatedSaga(
  actionPayload: ReduxAction<{ data: RestAction }>,
) {
  const { id } = actionPayload.payload.data;
  yield put({
    type: ReduxActionTypes.DELETE_API_DRAFT,
    payload: { id },
  });
}

function* handleActionDeletedSaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const { applicationId, pageId } = yield select(getRouterParams);
  history.push(API_EDITOR_URL(applicationId, pageId));
  yield put({
    type: ReduxActionTypes.DELETE_API_DRAFT,
    payload: { id },
  });
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.INIT_API_PANE, initApiPaneSaga),
    takeEvery(ReduxActionTypes.API_PANE_CHANGE_API, changeApiSaga),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    takeEvery(ReduxActionTypes.UPDATE_ACTION_SUCCESS, handleActionUpdatedSaga),
    takeEvery(ReduxActionTypes.DELETE_ACTION_SUCCESS, handleActionDeletedSaga),
  ]);
}
