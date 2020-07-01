/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import _ from "lodash";
import { all, select, put, takeEvery, take, call } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionErrorTypes,
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
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsEditorInitialized,
  getLastSelectedPage,
  getDataSources,
} from "selectors/editorSelectors";
import { initialize, autofill, change } from "redux-form";
import { AppState } from "reducers";
import { Property } from "api/ActionAPI";
import { changeApi, setDatasourceFieldText } from "actions/apiPaneActions";
import { createNewApiName, getNextEntityName } from "utils/AppsmithUtils";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { getAction, getActions, getPlugins } from "selectors/entitiesSelector";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { createActionRequest, setActionProperty } from "actions/actionActions";
import { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { RestAction } from "entities/Action";
import { getCurrentOrgId } from "selectors/organizationSelectors";

const getLastUsedAction = (state: AppState) => state.ui.apiPane.lastUsed;
const getLastUsedEditorPage = (state: AppState) =>
  state.ui.apiPane.lastUsedEditorPage;
const getLastUsedProvider = (state: AppState) =>
  state.ui.providers.lastUsedProviderId;
const getApiCreationStatus = (state: AppState) => state.ui.apiPane.isCreating;

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
  const isCreating = yield select(getApiCreationStatus);
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

  if (isCreating) return;

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

    if (
      actionPayload.type === ReduxFormActionTypes.VALUE_CHANGE ||
      actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE
    ) {
      if (values.datasource && values.datasource.id) {
        yield put(
          setDatasourceFieldText(values.id, `${currentPath}${paramsString}`),
        );
      } else if (
        values.datasource &&
        values.datasource.datasourceConfiguration
      ) {
        yield put(
          setDatasourceFieldText(
            values.id,
            values.datasource.datasourceConfiguration.url +
              `${currentPath}${paramsString}`,
          ),
        );
      }
    }
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

  yield put(initialize(API_EDITOR_FORM_NAME, action));
  history.push(API_EDITOR_ID_URL(applicationId, pageId, id));

  yield call(initializeExtraFormDataSaga);

  if (
    action.actionConfiguration &&
    action.actionConfiguration.queryParameters
  ) {
    // Sync the api params my mocking a change action
    yield call(syncApiParamsSaga, {
      type: ReduxFormActionTypes.ARRAY_REMOVE,
      payload: action.actionConfiguration.queryParameters,
      meta: {
        field: "actionConfiguration.queryParameters",
      },
    });
  }
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
  const { form, field } = actionPayload.meta;
  if (form !== API_EDITOR_FORM_NAME) return;
  if (field === "dynamicBindingPathList") return;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  if (!values.id) return;
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: field,
      value: actionPayload.payload,
    }),
  );
  yield all([
    call(syncApiParamsSaga, actionPayload),
    call(updateFormFields, actionPayload),
  ]);
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<RestAction>) {
  const { id, pluginType } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };

  if (pluginType === "API") {
    yield put(initialize(API_EDITOR_FORM_NAME, _.omit(data, "name")));
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.push(API_EDITOR_ID_URL(applicationId, pageId, id));
  }
}

function* handleActionDeletedSaga() {
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(API_EDITOR_URL(applicationId, pageId));
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
      yield put(initialize(API_EDITOR_FORM_NAME, _.omit(action, "name")));
    } else {
      yield put(changeApi(id));
    }
  }
}

function* handleCreateNewApiActionSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const organizationId = yield select(getCurrentOrgId);
  const pluginId = yield select(
    getPluginIdOfPackageName,
    REST_PLUGIN_PACKAGE_NAME,
  );
  const applicationId = yield select(getCurrentApplicationId);
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
          organizationId,
        },
        pageId,
      }),
    );
    history.push(
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
    );
  }
}

function* handleCreateNewQueryActionSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;
  const applicationId = yield select(getCurrentApplicationId);
  const actions = yield select(getActions);
  const dataSources = yield select(getDataSources);
  const plugins = yield select(getPlugins);
  const pluginIds = plugins
    .filter((plugin: Plugin) => PLUGIN_PACKAGE_DBS.includes(plugin.packageName))
    .map((plugin: Plugin) => plugin.id);
  const validDataSources: Array<Datasource> = [];
  dataSources.forEach((dataSource: Datasource) => {
    if (pluginIds?.includes(dataSource.pluginId)) {
      validDataSources.push(dataSource);
    }
  });
  if (validDataSources.length) {
    const pageApiNames = actions
      .filter((a: ActionData) => a.config.pageId === pageId)
      .map((a: ActionData) => a.config.name);
    const newQueryName = getNextEntityName("Query", pageApiNames);
    const dataSourceId = validDataSources[0].id;
    yield put(
      createActionRequest({
        name: newQueryName,
        pageId,
        datasource: {
          id: dataSourceId,
        },
        actionConfiguration: {},
      }),
    );
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
    );
  } else {
    history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
  }
}

function* handleApiNameChangeSaga(action: ReduxAction<{ name: string }>) {
  yield put(change(API_EDITOR_FORM_NAME, "name", action.payload.name));
}

function* handleApiNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(API_EDITOR_FORM_NAME, "name", action.payload.oldName));
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.INIT_API_PANE, initApiPaneSaga),
    takeEvery(ReduxActionTypes.API_PANE_CHANGE_API, changeApiSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    takeEvery(ReduxActionTypes.DELETE_ACTION_SUCCESS, handleActionDeletedSaga),
    takeEvery(ReduxActionTypes.MOVE_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.COPY_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.SAVE_API_NAME, handleApiNameChangeSaga),
    takeEvery(
      ReduxActionErrorTypes.SAVE_API_NAME_ERROR,
      handleApiNameChangeFailureSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_NEW_API_ACTION,
      handleCreateNewApiActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
      handleCreateNewQueryActionSaga,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}
