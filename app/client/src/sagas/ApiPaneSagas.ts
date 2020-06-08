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
import {
  DEFAULT_API_ACTION,
  POST_BODY_FORMAT_OPTIONS,
  REST_PLUGIN_PACKAGE_NAME,
  POST_BODY_FORMATS,
  CONTENT_TYPE,
} from "constants/ApiEditorConstants";
import history from "utils/history";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  getProviderTemplatesURL,
} from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
  getLastSelectedPage,
} from "selectors/editorSelectors";
import { initialize, autofill, change } from "redux-form";
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
import { createNewApiName } from "utils/AppsmithUtils";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { getActions } from "selectors/entitiesSelector";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { createActionRequest } from "actions/actionActions";

const getApiDraft = (state: AppState, id: string) => {
  const drafts = state.ui.apiPane.drafts;
  if (id in drafts) return drafts[id];
  return {};
};

const getActionConfigs = (state: AppState): ActionData["config"][] =>
  state.entities.actions.map(a => a.config);

const getLastUsedAction = (state: AppState) => state.ui.apiPane.lastUsed;
const getLastUsedEditorPage = (state: AppState) =>
  state.ui.apiPane.lastUsedEditorPage;
const getLastUsedProvider = (state: AppState) =>
  state.ui.providers.lastUsedProviderId;

function* initApiPaneSaga(actionPayload: ReduxAction<{ id?: string }>) {
  const isInitialized = yield select(getIsEditorInitialized);
  while (!isInitialized) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }
  const urlId = actionPayload.payload.id;
  const lastUsedId = yield select(getLastUsedAction);
  const lastUsedProviderId = yield select(getLastUsedProvider);
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  const lastUsedEditorPage = yield select(getLastUsedEditorPage);
  let lastSelectedPage = yield select(getLastSelectedPage);
  if (lastSelectedPage === "") {
    lastSelectedPage = pageId;
  }

  let id = "";
  if (urlId) {
    id = urlId;
  } else if (lastUsedId) {
    id = lastUsedId;
  }
  if (lastUsedProviderId && lastUsedEditorPage.includes("provider")) {
    history.push(
      getProviderTemplatesURL(
        applicationId,
        pageId,
        lastUsedProviderId + `/?importTo=${lastSelectedPage}`,
      ),
    );
  } else {
    yield put(changeApi(id));
  }
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

function* initializeExtraFormDataSaga() {
  const state = yield select();
  const { extraformData } = state.ui.apiPane;
  const formData = yield select(getFormData, API_EDITOR_FORM_NAME);
  const { values } = formData;
  const headers = _.get(values, "actionConfiguration.headers");

  if (!extraformData[values.id]) {
    if (headers) {
      yield put(
        change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", headers),
      );
    }
  }
}

function* changeApiSaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  // Typescript says Element does not have blur function but it does;
  document.activeElement &&
    "blur" in document.activeElement &&
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    document.activeElement.blur();

  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  if (!id) {
    return;
  }
  const action = yield select(getAction, id);
  if (!action) return;
  const draft = yield select(getApiDraft, id);
  let data;

  if (_.isEmpty(draft)) {
    data = action;
  } else {
    data = draft;
  }

  if (data.actionConfiguration.path) {
    if (data.actionConfiguration.path.charAt(0) === "/")
      data.actionConfiguration.path = data.actionConfiguration.path.substring(
        1,
      );
  }

  if (
    data.actionConfiguration.httpMethod !== "GET" &&
    !data.providerId &&
    !Array.isArray(data.actionConfiguration.body)
  ) {
    let contentType;
    const headers = data.actionConfiguration.headers;
    if (headers) {
      contentType = headers.find(
        (header: any) => header.key.toLowerCase() === CONTENT_TYPE,
      );
    }
  }

  yield put(initialize(API_EDITOR_FORM_NAME, data));
  history.push(API_EDITOR_ID_URL(applicationId, pageId, id));

  yield call(initializeExtraFormDataSaga);

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
  const actions: RestAction[] = yield select(getActionConfigs);
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

function* updateFormFields(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
  const formData = yield select(getFormData, API_EDITOR_FORM_NAME);

  if (field === "actionConfiguration.httpMethod") {
    if (value !== "GET") {
      const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
      const { actionConfiguration } = values;
      const actionConfigurationHeaders = actionConfiguration.headers;
      let contentType;

      if (actionConfigurationHeaders) {
        contentType = actionConfigurationHeaders.find(
          (header: any) => header.key.toLowerCase() === CONTENT_TYPE,
        );
      }

      if (!contentType) {
        yield put(
          change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", [
            ...actionConfigurationHeaders,
            {
              key: CONTENT_TYPE,
              value: POST_BODY_FORMAT_OPTIONS[0].value,
            },
          ]),
        );
      }
    }
  } else if (field.includes("actionConfiguration.headers")) {
    const formValues = formData.values;
    const actionConfigurationHeaders = _.get(
      formValues,
      "actionConfiguration.headers",
    );
    const apiId = _.get(formValues, "id");
    let displayFormat;

    if (actionConfigurationHeaders) {
      const contentType = actionConfigurationHeaders.find(
        (header: any) => header.key.toLowerCase() === CONTENT_TYPE,
      );

      if (contentType && POST_BODY_FORMATS.includes(contentType.value)) {
        displayFormat = {
          label: contentType.value,
          value: contentType.value,
        };
      } else {
        displayFormat = POST_BODY_FORMAT_OPTIONS[3];
      }
    }

    yield put({
      type: ReduxActionTypes.SET_EXTRA_FORMDATA,
      payload: {
        id: apiId,
        values: {
          displayFormat,
        },
      },
    });
  }
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
    call(updateFormFields, actionPayload),
  ]);
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const { id, pluginType } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };

  if (pluginType === "API") {
    yield put(initialize(API_EDITOR_FORM_NAME, data));
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.push(API_EDITOR_ID_URL(applicationId, pageId, id));
  }
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
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(API_EDITOR_URL(applicationId, pageId));
  yield put({
    type: ReduxActionTypes.DELETE_API_DRAFT,
    payload: { id },
  });
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  const pluginType = action?.pluginType ?? "";

  if (pluginType === "API") {
    const { values }: { values: RestAction } = yield select(
      getFormData,
      API_EDITOR_FORM_NAME,
    );
    if (values.id === id) {
      yield put(initialize(API_EDITOR_FORM_NAME, action));
    } else {
      yield put(changeApi(id));
    }
  }
}

function* handleCreateNewApiActionSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const pluginId = yield select(
    getPluginIdOfPackageName,
    REST_PLUGIN_PACKAGE_NAME,
  );
  const { pageId } = action.payload;
  if (pageId && pluginId) {
    const actions = yield select(getActions);
    const pageActions = actions.filter(
      (a: ActionData) => a.config.pageId === pageId,
    );
    const newActionName = createNewApiName(pageActions, pageId);
    yield put(
      createActionRequest({
        ...DEFAULT_API_ACTION,
        name: newActionName,
        datasource: {
          name: "DEFAULT_REST_DATASOURCE",
          pluginId,
        },
        pageId,
      }),
    );
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
    takeEvery(
      ReduxActionTypes.CREATE_NEW_API_ACTION,
      handleCreateNewApiActionSaga,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}
