import { all, select, put, take, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "constants/ReduxActionConstants";
import { getFormData } from "selectors/formSelectors";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
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
import { change, initialize } from "redux-form";
import {
  getAction,
  getPluginEditorConfigs,
  getDatasource,
} from "selectors/entitiesSelector";
import { RestAction } from "entities/Action";
import { setActionProperty } from "actions/actionActions";
import { fetchPluginForm } from "actions/pluginActions";
import { getQueryParams } from "utils/AppsmithUtils";
import { QUERY_CONSTANT } from "constants/QueryEditorConstants";

function* changeQuerySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const state = yield select();
  const editorConfigs = state.entities.plugins.editorConfigs;
  // // Typescript says Element does not have blur function but it does;
  // document.activeElement &&
  //   "blur" in document.activeElement &&
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //   // @ts-ignore
  //   document.activeElement.blur();
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

  if (!editorConfigs[action.pluginId]) {
    yield put(fetchPluginForm({ id: action.pluginId }));
  }

  yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { form, field } = actionPayload.meta;
  if (field === "dynamicBindingPathList" || field === "name") return;
  if (form !== QUERY_EDITOR_FORM_NAME) return;
  const { values } = yield select(getFormData, QUERY_EDITOR_FORM_NAME);
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: field,
      value: actionPayload.payload,
    }),
  );

  if (field === "datasource.id") {
    const editorConfigs = yield select(getPluginEditorConfigs);
    const datasource = yield select(getDatasource, actionPayload.payload);

    if (!editorConfigs[datasource.pluginId]) {
      yield put(fetchPluginForm({ id: datasource.pluginId }));
    }
  }
}

function* handleQueryCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const {
    id,
    pluginType,
    pluginId,
    actionConfiguration,
  } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };
  if (pluginType === "DB") {
    const state = yield select();
    const editorConfigs = state.entities.plugins.editorConfigs;

    if (!editorConfigs[pluginId]) {
      yield put(fetchPluginForm({ id: pluginId }));
    }

    yield put(initialize(QUERY_EDITOR_FORM_NAME, data));
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.replace(
      QUERIES_EDITOR_ID_URL(applicationId, pageId, id, {
        editName: "true",
        showTemplate: actionConfiguration.body ? "false" : "true",
      }),
    );
  }
}

function* handleNameChangeSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  yield put(change(QUERY_EDITOR_FORM_NAME, "name", action.payload.name));
}

function* handleNameChangeSuccessSaga(
  action: ReduxAction<{ actionId: string }>,
) {
  const { actionId } = action.payload;
  const actionObj = yield select(getAction, actionId);
  yield take(ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS);
  if (actionObj.pluginType === QUERY_CONSTANT) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.replace(
      QUERIES_EDITOR_ID_URL(applicationId, pageId, actionId, params),
    );
  }
}

function* handleNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(QUERY_EDITOR_FORM_NAME, "name", action.payload.oldName));
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleQueryCreatedSaga),
    takeEvery(ReduxActionTypes.QUERY_PANE_CHANGE, changeQuerySaga),
    takeEvery(ReduxActionTypes.SAVE_ACTION_NAME_INIT, handleNameChangeSaga),
    takeEvery(
      ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      handleNameChangeSuccessSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      handleNameChangeFailureSaga,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
  ]);
}
