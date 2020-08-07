/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import _ from "lodash";
import { all, select, put, takeEvery, call } from "redux-saga/effects";
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
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
} from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getDataSources,
} from "selectors/editorSelectors";
import { initialize, autofill, change } from "redux-form";
import { Property } from "api/ActionAPI";
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

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
  actionId: string,
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
      yield put(
        setActionProperty({
          actionId: actionId,
          propertyName: "actionConfiguration.queryParameters",
          value: params,
        }),
      );
    } else {
      yield put(
        autofill(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.queryParameters",
          [],
        ),
      );
      yield put(
        setActionProperty({
          actionId: actionId,
          propertyName: "actionConfiguration.queryParameters",
          value: [],
        }),
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
  // // Typescript says Element does not have blur function but it does;
  // document.activeElement &&
  //   "blur" in document.activeElement &&
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //   // @ts-ignore
  //   document.activeElement.blur();
  const { id } = actionPayload.payload;
  const action = yield select(getAction, id);
  if (!action) return;

  yield put(initialize(API_EDITOR_FORM_NAME, action));

  yield call(initializeExtraFormDataSaga);

  if (
    action.actionConfiguration &&
    action.actionConfiguration.queryParameters?.length
  ) {
    // Sync the api params my mocking a change action
    yield call(
      syncApiParamsSaga,
      {
        type: ReduxFormActionTypes.ARRAY_REMOVE,
        payload: action.actionConfiguration.queryParameters,
        meta: {
          field: "actionConfiguration.queryParameters",
        },
      },
      id,
    );
  }
}

function* updateFormFields(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);

  if (field === "actionConfiguration.httpMethod") {
    if (value !== "GET") {
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
    const actionConfigurationHeaders = _.get(
      values,
      "actionConfiguration.headers",
    );
    const apiId = _.get(values, "id");
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
  if (field === "dynamicBindingPathList" || field === "name") return;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  if (!values.id) return;
  if (
    actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE ||
    actionPayload.type === ReduxFormActionTypes.ARRAY_PUSH
  ) {
    const value = _.get(values, field);
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value,
      }),
    );
  } else {
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value: actionPayload.payload,
      }),
    );
  }

  yield all([
    call(syncApiParamsSaga, actionPayload, values.id),
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
    history.push(
      API_EDITOR_ID_URL(applicationId, pageId, id, {
        new: "true",
      }),
    );
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
    takeEvery(ReduxActionTypes.API_PANE_CHANGE_API, changeApiSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    takeEvery(ReduxActionTypes.SAVE_ACTION_NAME_INIT, handleApiNameChangeSaga),
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
