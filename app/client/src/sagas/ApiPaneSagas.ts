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
import { API_EDITOR_FORM_NAME } from "constants/forms";
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
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import { PLUGIN_PACKAGE_DBS } from "constants/QueryEditorConstants";
import { Action, ApiAction } from "entities/Action";
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

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
  actionId: string,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
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

  const firstEmptyHeaderRowIndex: number = headers.findIndex(
    (element: { key: string; value: string }) =>
      element && element.key === "" && element.value === "",
  );

  const newHeaderIndex =
    firstEmptyHeaderRowIndex > -1 ? firstEmptyHeaderRowIndex : headers.length;

  // If there is an existing header with content type, use that or
  // create a new header
  const indexToUpdate =
    contentTypeHeaderIndex > -1 ? contentTypeHeaderIndex : newHeaderIndex;

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
  const headers = get(
    values,
    "actionConfiguration.headers",
    DEFAULT_API_ACTION_CONFIG.headers,
  );

  const queryParameters = get(
    values,
    "actionConfiguration.queryParameters",
    [],
  );
  if (!extraformData[values.id]) {
    yield put(
      change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", headers),
    );
    if (queryParameters.length === 0)
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.queryParameters",
          DEFAULT_API_ACTION_CONFIG.queryParameters,
        ),
      );
  }
}

function* changeApiSaga(actionPayload: ReduxAction<{ id: string }>) {
  // // Typescript says Element does not have blur function but it does;
  // document.activeElement &&
  //   "blur" in document.activeElement &&
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore: No types available
  //   document.activeElement.blur();
  PerformanceTracker.startTracking(PerformanceTransactionName.CHANGE_API_SAGA);
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
  PerformanceTracker.stopTracking();
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
          (header: any) =>
            header &&
            header.key &&
            header.key.toLowerCase() === CONTENT_TYPE_HEADER_KEY,
        );
      }

      if (!contentType) {
        yield put(
          change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", [
            ...actionConfigurationHeaders,
            {
              key: CONTENT_TYPE_HEADER_KEY,
              value: POST_BODY_FORMAT_OPTIONS[0].value,
            },
          ]),
        );
      }
    }
  } else if (field.includes("actionConfiguration.headers")) {
    const actionConfigurationHeaders = get(
      values,
      "actionConfiguration.headers",
    );
    const apiId = get(values, "id");
    let displayFormat;

    if (actionConfigurationHeaders) {
      const contentType = actionConfigurationHeaders.find(
        (header: any) =>
          header &&
          header.key &&
          header.key.toLowerCase() === CONTENT_TYPE_HEADER_KEY,
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

  if (pluginType === "API") {
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
  log.debug({ pageId, pluginId });
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
      text: createMessage(ERROR_ACTION_RENAME_FAIL, actionObj.name),
      variant: Variant.danger,
    });

    Sentry.captureException(
      new Error(createMessage(ERROR_ACTION_RENAME_FAIL, actionObj.name)),
      {
        extra: {
          actionId: actionId,
        },
      },
    );
    return;
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
