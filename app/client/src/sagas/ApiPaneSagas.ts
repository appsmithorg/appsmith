/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import { get, omit, cloneDeep } from "lodash";
import { all, select, put, takeEvery, call, take } from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "constants/ReduxActionConstants";
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME, SAAS_EDITOR_FORM } from "constants/forms";
import {
  DEFAULT_API_ACTION_CONFIG,
  POST_BODY_FORMAT_OPTIONS,
  REST_PLUGIN_PACKAGE_NAME,
  POST_BODY_FORMATS,
  CONTENT_TYPE_HEADER_KEY,
  ApiContentTypes,
  EMPTY_KEY_VALUE_PAIRS,
} from "constants/ApiEditorConstants";
import history from "utils/history";
import {
  API_EDITOR_ID_URL,
  QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  DATA_SOURCES_EDITOR_ID_URL,
} from "constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { initialize, autofill, change } from "redux-form";
import { Property } from "api/ActionAPI";
import {
  createNewApiName,
  getNextEntityName,
  getQueryParams,
} from "utils/AppsmithUtils";
import { getPluginIdOfPackageName } from "sagas/selectors";
import {
  getAction,
  getActions,
  getPlugins,
  getDatasources,
  getPlugin,
} from "selectors/entitiesSelector";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { createActionRequest, setActionProperty } from "actions/actionActions";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { Action, ApiAction, PluginType } from "entities/Action";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { EventLocation } from "utils/AnalyticsUtil";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { createMessage, ERROR_ACTION_RENAME_FAIL } from "constants/messages";
import { checkCurrentStep } from "./OnboardingSagas";
import { OnboardingStep } from "constants/OnboardingConstants";
import { getIndextoUpdate } from "utils/ApiPaneUtils";

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
  actionId: string,
) {
  const field = actionPayload.meta.field;
  //Payload here contains the path and query params of a typical url like https://{domain}/{path}?{query_params}
  let value = actionPayload.payload;
  // Regular expression to find the query params group
  const queryParamsRegEx = /(\/[\s\S]*?)(\?(?![^{]*})[\s\S]*)?$/;
  value = (value.match(queryParamsRegEx) || [])[2] || "";
  const padQueryParams = { key: "", value: "" };
  PerformanceTracker.startTracking(PerformanceTransactionName.SYNC_PARAMS_SAGA);
  if (field === "actionConfiguration.path") {
    if (value.indexOf("?") > -1) {
      const paramsString = value.substr(value.indexOf("?") + 1);
      const params = paramsString.split("&").map((p) => {
        const keyValue = p.split("=");
        return { key: keyValue[0], value: keyValue[1] || "" };
      });
      if (params.length < 2) {
        while (params.length < 2) {
          params.push(padQueryParams);
        }
      }
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
          Array(2).fill(padQueryParams),
        ),
      );
      yield put(
        setActionProperty({
          actionId: actionId,
          propertyName: "actionConfiguration.queryParameters",
          value: Array(2).fill(padQueryParams),
        }),
      );
    }
  } else if (field.includes("actionConfiguration.queryParameters")) {
    const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
    const path = values.actionConfiguration.path || "";
    const matchGroups = path.match(queryParamsRegEx) || [];
    const currentPath = matchGroups[1] || "";
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
  PerformanceTracker.stopTracking();
}

function* handleUpdateBodyContentType(
  action: ReduxAction<{ title: ApiContentTypes; apiId: string }>,
) {
  const { title, apiId } = action.payload;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  const displayFormatObject = POST_BODY_FORMAT_OPTIONS.find(
    (el) => el.label === title,
  );
  if (!displayFormatObject) {
    log.error("Display format not supported", title);
    return;
  }
  if (displayFormatObject.value === POST_BODY_FORMATS[3]) {
    // Dont update the content type header if raw has been selected
    yield put({
      type: ReduxActionTypes.SET_EXTRA_FORMDATA,
      payload: {
        id: apiId,
        values: {
          displayFormat: POST_BODY_FORMAT_OPTIONS[3],
        },
      },
    });
    return;
  }

  const headers = cloneDeep(values.actionConfiguration.headers);
  const bodyFormData = cloneDeep(values.actionConfiguration.bodyFormData);

  const contentTypeHeaderIndex = headers.findIndex(
    (element: { key: string; value: string }) =>
      element &&
      element.key &&
      element.key.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );
  const indexToUpdate = getIndextoUpdate(headers, contentTypeHeaderIndex);

  headers[indexToUpdate] = {
    key: CONTENT_TYPE_HEADER_KEY,
    value: displayFormatObject.value,
  };

  yield put(
    change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", headers),
  );

  if (displayFormatObject.value === POST_BODY_FORMATS[1]) {
    if (!bodyFormData || bodyFormData.length === 0) {
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.bodyFormData",
          EMPTY_KEY_VALUE_PAIRS.slice(),
        ),
      );
    }
  }
}

function* initializeExtraFormDataSaga() {
  const state = yield select();
  const { extraformData } = state.ui.apiPane;
  const formData = yield select(getFormData, API_EDITOR_FORM_NAME);
  const { values } = formData;
  const headers = get(values, "actionConfiguration.headers");

  if (!extraformData[values.id]) {
    yield call(setHeaderFormat, values.id, headers);
  }
}

function* changeApiSaga(
  actionPayload: ReduxAction<{ id: string; isSaas: boolean }>,
) {
  // // Typescript says Element does not have blur function but it does;
  // document.activeElement &&
  //   "blur" in document.activeElement &&
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore: No types available
  //   document.activeElement.blur();
  PerformanceTracker.startTracking(PerformanceTransactionName.CHANGE_API_SAGA);
  const { id, isSaas } = actionPayload.payload;
  const action = yield select(getAction, id);
  if (!action) return;
  if (isSaas) {
    yield put(initialize(SAAS_EDITOR_FORM, action));
  } else {
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

  PerformanceTracker.stopTracking();
}

function* setHeaderFormat(apiId: string, headers?: Property[]) {
  let displayFormat;

  if (headers) {
    const contentType = headers.find(
      (header: any) =>
        header &&
        header.key &&
        header.key.toLowerCase() === CONTENT_TYPE_HEADER_KEY,
    );

    if (
      contentType &&
      contentType.value &&
      POST_BODY_FORMATS.includes(contentType.value)
    ) {
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

function* updateFormFields(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);

  if (field === "actionConfiguration.httpMethod") {
    const { actionConfiguration } = values;
    const actionConfigurationHeaders = cloneDeep(actionConfiguration.headers);
    if (actionConfigurationHeaders) {
      const contentTypeHeaderIndex = actionConfigurationHeaders.findIndex(
        (header: { key: string; value: string }) =>
          header &&
          header.key &&
          header.key.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
      );
      if (value !== "GET") {
        const indexToUpdate = getIndextoUpdate(
          actionConfigurationHeaders,
          contentTypeHeaderIndex,
        );
        actionConfigurationHeaders[indexToUpdate] = {
          key: CONTENT_TYPE_HEADER_KEY,
          value: POST_BODY_FORMAT_OPTIONS[0].value,
        };
      } else {
        if (contentTypeHeaderIndex > -1) {
          actionConfigurationHeaders[contentTypeHeaderIndex] = {
            key: "",
            value: "",
          };
        }
      }
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.headers",
          actionConfigurationHeaders,
        ),
      );
    }
  } else if (field.includes("actionConfiguration.headers")) {
    const actionConfigurationHeaders = get(
      values,
      "actionConfiguration.headers",
    );
    const apiId = get(values, "id");
    yield call(setHeaderFormat, apiId, actionConfigurationHeaders);
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
    const value = get(values, field);
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

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginType } = actionPayload.payload;
  const action = yield select(getAction, id);
  const data = { ...action };

  if (pluginType === PluginType.API) {
    yield put(initialize(API_EDITOR_FORM_NAME, omit(data, "name")));
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.push(
      API_EDITOR_ID_URL(applicationId, pageId, id, {
        editName: "true",
      }),
    );
  }
}

function* handleDatasourceCreatedSaga(actionPayload: ReduxAction<Datasource>) {
  const plugin = yield select(getPlugin, actionPayload.payload.pluginId);
  // Only look at API plugins
  if (plugin.type !== PluginType.API) return;

  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);

  history.push(
    DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, actionPayload.payload.id),
  );
}

function* handleCreateNewApiActionSaga(
  action: ReduxAction<{ pageId: string; from: EventLocation }>,
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
    // Note: Do NOT send pluginId on top level here.
    // It breaks embedded rest datasource flow.
    yield put(
      createActionRequest({
        actionConfiguration: DEFAULT_API_ACTION_CONFIG,
        name: newActionName,
        datasource: {
          name: "DEFAULT_REST_DATASOURCE",
          pluginId,
          organizationId,
        },
        eventData: {
          actionType: "API",
          from: action.payload.from,
        },
        pageId,
      } as ApiAction), // We don't have recursive partial in typescript for now.
    );
    history.push(
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
    );
  }
}

function* handleCreateNewQueryActionSaga(
  action: ReduxAction<{ pageId: string; from: EventLocation }>,
) {
  const { pageId } = action.payload;
  const applicationId = yield select(getCurrentApplicationId);
  const actions = yield select(getActions);
  const dataSources = yield select(getDatasources);
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
    let createActionPayload = {
      name: newQueryName,
      pageId,
      datasource: {
        id: dataSourceId,
      },
      eventData: {
        actionType: "Query",
        from: action.payload.from,
        dataSource: validDataSources[0].name,
      },
      actionConfiguration: {},
    };

    //For onboarding
    const updateActionPayload = yield select(
      checkCurrentStep,
      OnboardingStep.ADD_INPUT_WIDGET,
    );
    if (updateActionPayload) {
      createActionPayload = {
        ...createActionPayload,
        name: "add_standup_updates",
        actionConfiguration: {
          body: `Insert into standup_updates("name", "notes") values ('{{appsmith.user.email}}', '{{ Standup_Input.text }}')`,
        },
      };
    }

    yield put(createActionRequest(createActionPayload));
    history.push(
      QUERY_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
    );
  } else {
    history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
  }
}

function* handleApiNameChangeSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  yield put(change(API_EDITOR_FORM_NAME, "name", action.payload.name));
}
function* handleApiNameChangeSuccessSaga(
  action: ReduxAction<{ actionId: string }>,
) {
  const { actionId } = action.payload;
  const actionObj = yield select(getAction, actionId);
  yield take(ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    Toaster.show({
      text: createMessage(ERROR_ACTION_RENAME_FAIL, ""),
      variant: Variant.danger,
    });

    Sentry.captureException(
      new Error(createMessage(ERROR_ACTION_RENAME_FAIL, "")),
      {
        extra: {
          actionId: actionId,
        },
      },
    );
    return;
  }
  if (actionObj.pluginType === PluginType.API) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.push(API_EDITOR_ID_URL(applicationId, pageId, actionId, params));
  }
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
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.SAVE_ACTION_NAME_INIT, handleApiNameChangeSaga),
    takeEvery(
      ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      handleApiNameChangeSuccessSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
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
    takeEvery(
      ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
      handleUpdateBodyContentType,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}
