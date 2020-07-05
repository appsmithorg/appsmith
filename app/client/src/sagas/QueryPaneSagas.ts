import { take } from "lodash";
import { all, select, put, takeEvery, takeLatest } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME, QUERY_EDITOR_FORM_NAME } from "constants/forms";
import history from "utils/history";
import {
  QUERIES_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  APPLICATIONS_URL,
} from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { initialize } from "redux-form";
import { AppState } from "reducers";
import ActionAPI from "api/ActionAPI";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";
import { changeQuery, deleteQuerySuccess } from "actions/queryPaneActions";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { ToastType } from "react-toastify";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { GenericApiResponse } from "api/ApiResponses";
import { validateResponse } from "./ErrorSagas";
import { getAction, getQueryName } from "selectors/entitiesSelector";
import { RestAction } from "entities/Action";
import { setActionProperty } from "actions/actionActions";

const getActions = (state: AppState) =>
  state.entities.actions.map(a => a.config);

const getLastUsedAction = (state: AppState) => state.ui.queryPane.lastUsed;

const getQueryCreationStatus = (state: AppState) =>
  state.ui.queryPane.isCreating;

function* initQueryPaneSaga(
  actionPayload: ReduxAction<{
    pluginType: string;
    id?: string;
  }>,
) {
  let actions = yield select(getActions);
  while (!actions.length) {
    yield take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);
    actions = yield select(getActions);
  }
  const urlId = actionPayload.payload.id;
  const lastUsedId = yield select(getLastUsedAction);
  const isCreating = yield select(getQueryCreationStatus);

  let id = "";
  if (urlId) {
    id = urlId;
  } else if (lastUsedId) {
    id = lastUsedId;
  }

  if (isCreating) return;

  yield put(changeQuery(id, QUERY_CONSTANT));
}

function* changeQuerySaga(
  actionPayload: ReduxAction<{ id: string; pluginType: string }>,
) {
  const { id } = actionPayload.payload;
  // Typescript says Element does not have blur function but it does;
  document.activeElement &&
    "blur" in document.activeElement &&
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    document.activeElement.blur();

  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  if (!applicationId || !pageId) {
    history.push(APPLICATIONS_URL);
    return;
  }
  const action = yield select(getAction, id);
  if (!action) {
    history.push(QUERIES_EDITOR_URL(applicationId, pageId));
    return;
  }

  const URL = QUERIES_EDITOR_ID_URL(applicationId, pageId, id);
  yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
  history.push(URL);
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { form, field } = actionPayload.meta;
  if (field === "dynamicBindingPathList" || field === "name") return;
  if (form !== QUERY_EDITOR_FORM_NAME) return;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: field,
      value: actionPayload.payload,
    }),
  );
}

function* handleQueryCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const { id, pluginType } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };
  if (pluginType === "DB") {
    yield put(initialize(QUERY_EDITOR_FORM_NAME, data));
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.replace(QUERIES_EDITOR_ID_URL(applicationId, pageId, id), {
      newQuery: true,
    });
  }
}

function* handleQueryDeletedSaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(QUERIES_EDITOR_URL(applicationId, pageId));
  yield put({
    type: ReduxActionTypes.DELETE_API_DRAFT,
    payload: { id },
  });
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const pluginType = action?.pluginType ?? "";

  if (pluginType === "DB") {
    const { values }: { values: RestAction } = yield select(
      getFormData,
      QUERY_EDITOR_FORM_NAME,
    );
    if (values.id === id) {
      yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
    }
  }
}

function* deleteQuerySaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    const id = actionPayload.payload.id;
    const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const queryName = yield select(getQueryName, id);
      AnalyticsUtil.logEvent("DELETE_QUERY", {
        queryName,
      });
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        type: ToastType.SUCCESS,
      });
      yield put(deleteQuerySuccess({ id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_QUERY_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleQueryCreatedSaga),
    takeLatest(ReduxActionTypes.DELETE_QUERY_INIT, deleteQuerySaga),
    takeEvery(ReduxActionTypes.DELETE_QUERY_SUCCESS, handleQueryDeletedSaga),
    takeEvery(ReduxActionTypes.MOVE_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.COPY_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.QUERY_PANE_CHANGE, changeQuerySaga),
    takeEvery(ReduxActionTypes.INIT_QUERY_PANE, initQueryPaneSaga),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
  ]);
}
