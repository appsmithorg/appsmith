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
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  APPLICATIONS_URL,
} from "constants/routes";
import { destroy, initialize, autofill } from "redux-form";
import { getAction } from "./ActionSagas";
import { AppState } from "reducers";
import { Property, RestAction } from "api/ActionAPI";
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

const getActions = (state: AppState) =>
  state.entities.actions.map(a => a.config);

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

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
  if (field === "actionConfiguration.path") {
    if (value.indexOf("?") > -1) {
      const paramsString = value.substr(value.indexOf("?") + 1);
      const params = paramsString.split("&").map(p => {
        const keyValue = p.split("=");
        return { key: keyValue[0], value: keyValue[1] || "" };
      });
      yield put(
        autofill(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.queryParameters",
          params,
        ),
      );
    } else {
      yield put(
        autofill(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.queryParameters",
          [],
        ),
      );
    }
  } else if (field.includes("actionConfiguration.queryParameters")) {
    const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
    const path = values.actionConfiguration.path || "";
    const pathHasParams = path.indexOf("?") > -1;
    const currentPath = path.substring(
      0,
      pathHasParams ? path.indexOf("?") : undefined,
    );
    const paramsString = values.actionConfiguration.queryParameters
      .filter((p: Property) => p.key)
      .map(
        (p: Property, i: number) => `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
      )
      .join("");
    yield put(
      autofill(
        API_EDITOR_FORM_NAME,
        "actionConfiguration.path",
        `${currentPath}${paramsString}`,
      ),
    );
  }
}

function* changeApiSaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const { applicationId, pageId } = yield select(getRouterParams);
  if (!applicationId || !pageId) {
    history.push(APPLICATIONS_URL);
    return;
  }
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
  if (data.actionConfiguration && data.actionConfiguration.queryParameters) {
    // Sync the api params my mocking a change action
    yield call(syncApiParamsSaga, {
      type: ReduxFormActionTypes.ARRAY_REMOVE,
      payload: data.actionConfiguration.queryParameters,
      meta: {
        field: "actionConfiguration.queryParameters",
      },
    });
  }
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
  yield all([
    call(validateInputSaga, actionPayload),
    call(updateDraftsSaga),
    call(syncApiParamsSaga, actionPayload),
  ]);
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };
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

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const { values }: { values: RestAction } = yield select(
    getFormData,
    API_EDITOR_FORM_NAME,
  );
  if (values.id === id) {
    yield put(initialize(API_EDITOR_FORM_NAME, action));
  }
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.INIT_API_PANE, initApiPaneSaga),
    takeEvery(ReduxActionTypes.API_PANE_CHANGE_API, changeApiSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    takeEvery(ReduxActionTypes.UPDATE_ACTION_SUCCESS, handleActionUpdatedSaga),
    takeEvery(ReduxActionTypes.DELETE_ACTION_SUCCESS, handleActionDeletedSaga),
    takeEvery(ReduxActionTypes.MOVE_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.COPY_ACTION_SUCCESS, handleMoveOrCopySaga),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
  ]);
}
