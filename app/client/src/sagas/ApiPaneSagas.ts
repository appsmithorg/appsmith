/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import get from "lodash/get";
import omit from "lodash/omit";
import cloneDeep from "lodash/cloneDeep";
import { all, select, put, takeEvery, call, take } from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { GetFormData, getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME, QUERY_EDITOR_FORM_NAME } from "constants/forms";
import {
  DEFAULT_API_ACTION_CONFIG,
  POST_BODY_FORMAT_OPTIONS_ARRAY,
  POST_BODY_FORMAT_OPTIONS,
  REST_PLUGIN_PACKAGE_NAME,
  CONTENT_TYPE_HEADER_KEY,
  EMPTY_KEY_VALUE_PAIRS,
  HTTP_METHOD,
  HTTP_METHODS_DEFAULT_FORMAT_TYPES,
} from "constants/ApiEditorConstants";
import history from "utils/history";
import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import { initialize, autofill, change } from "redux-form";
import { Property } from "api/ActionAPI";
import { createNewApiName } from "utils/AppsmithUtils";
import { getQueryParams } from "utils/URLUtils";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { getAction, getActions, getPlugin } from "selectors/entitiesSelector";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import {
  createActionRequest,
  setActionProperty,
} from "actions/pluginActionActions";
import { Datasource } from "entities/Datasource";
import { Action, ApiAction, PluginType } from "entities/Action";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { EventLocation } from "utils/AnalyticsUtil";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  ERROR_ACTION_RENAME_FAIL,
} from "@appsmith/constants/messages";
import {
  getIndextoUpdate,
  parseUrlForQueryParams,
  queryParamsRegEx,
} from "utils/ApiPaneUtils";
import { updateReplayEntity } from "actions/pageActions";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Plugin } from "api/PluginApi";
import { getDisplayFormat } from "selectors/apiPaneSelectors";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  integrationEditorURL,
} from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
  actionId: string,
) {
  const field = actionPayload.meta.field;
  //Payload here contains the path and query params of a typical url like https://{domain}/{path}?{query_params}
  const value = actionPayload.payload;
  // Regular expression to find the query params group
  PerformanceTracker.startTracking(PerformanceTransactionName.SYNC_PARAMS_SAGA);
  if (field === "actionConfiguration.path") {
    const params = parseUrlForQueryParams(value);
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

function* redirectToNewIntegrations(
  action: ReduxAction<{
    pageId: string;
    params?: Record<string, string>;
  }>,
) {
  history.push(
    integrationEditorURL({
      pageId: action.payload.pageId,
      selectedTab: INTEGRATION_TABS.ACTIVE,
      params: {
        ...action.payload.params,
        mode: INTEGRATION_EDITOR_MODES.AUTO,
      },
    }),
  );
}

function* handleUpdateBodyContentType(
  action: ReduxAction<{ title: string; apiId: string }>,
) {
  const { apiId, title } = action.payload;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);

  // this is the previous value gotten before the new content type has been set
  const previousContentType =
    values.actionConfiguration?.formData?.apiContentType;

  const displayFormatValue = POST_BODY_FORMAT_OPTIONS_ARRAY.find(
    (el) => el === title,
  );
  if (!displayFormatValue) {
    log.error("Display format not supported", title);
    return;
  }

  // this is the update for the new apicontentType
  // Quick Context: APiContentype is the field that represents the content type the user wants while in RAW mode.
  // users should be able to set the content type to whatever they want.
  let formData = { ...values.actionConfiguration.formData };
  if (formData === undefined) formData = {};
  formData["apiContentType"] =
    title === POST_BODY_FORMAT_OPTIONS.NONE ? previousContentType : title;

  yield put(
    change(API_EDITOR_FORM_NAME, "actionConfiguration.formData", formData),
  );

  // Quick Context: The extra formadata action is responsible for updating the current multi switch mode you see on api editor body tab
  // whenever a user selects a new content type through the tab e.g application/json, this action is dispatched to update that value, which is then read in the PostDataBody file
  // to show the appropriate content type section.

  yield put({
    type: ReduxActionTypes.SET_EXTRA_FORMDATA,
    payload: {
      id: apiId,
      values: {
        displayFormat: {
          label: title,
          value: title,
        },
      },
    },
  });

  const headers = cloneDeep(values.actionConfiguration.headers);

  const contentTypeHeaderIndex = headers.findIndex(
    (element: { key: string; value: string }) =>
      element &&
      element.key &&
      element.key.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );
  const indexToUpdate = getIndextoUpdate(headers, contentTypeHeaderIndex);

  // If the user has selected "None" as the body type & there was a content-type
  // header present in the API configuration, keep the previous content type header
  // this is done to ensure user input isn't cleared off if they switch to none mode.
  // however if the user types in a new value, we use the updated value (formValueChangeSaga - line 426).
  if (
    displayFormatValue === POST_BODY_FORMAT_OPTIONS.NONE &&
    indexToUpdate !== -1
  ) {
    //Checking if any type was seleccted before
    if (contentTypeHeaderIndex !== -1) {
      headers[indexToUpdate] = {
        key: previousContentType ? CONTENT_TYPE_HEADER_KEY : "",
        value: previousContentType ? previousContentType : "",
      };
    }
  } else {
    headers[indexToUpdate] = {
      key: CONTENT_TYPE_HEADER_KEY,
      value: displayFormatValue,
    };
  }

  // update the new header values.
  yield put(
    change(API_EDITOR_FORM_NAME, "actionConfiguration.headers", headers),
  );

  const bodyFormData = cloneDeep(values.actionConfiguration.bodyFormData);

  if (
    displayFormatValue === POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED ||
    displayFormatValue === POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA
  ) {
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

function* updateExtraFormDataSaga() {
  const formData: GetFormData = yield select(getFormData, API_EDITOR_FORM_NAME);
  const { values } = formData;

  // when initializing, check if theres a display format present, if not use Json display format as default.
  const extraFormData: GetFormData = yield select(getDisplayFormat, values.id);

  const headers: Array<{ key: string; value: string }> =
    get(values, "actionConfiguration.headers") || [];
  const contentTypeValue: string =
    headers.find(
      (h: { key: string; value: string }) => h.key === CONTENT_TYPE_HEADER_KEY,
    )?.value || "";

  let rawApiContentType;

  if (!extraFormData) {
    /*
     * Checking if the content-type header exists, if yes then set the body format type one of the three json, multipart or url encoded whichever matches else set raw as default
     */
    if (
      [
        POST_BODY_FORMAT_OPTIONS.JSON,
        POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
        POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
      ].includes(contentTypeValue)
    ) {
      rawApiContentType = contentTypeValue;
    } else if (
      contentTypeValue === "" ||
      contentTypeValue === POST_BODY_FORMAT_OPTIONS.NONE
    ) {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.NONE;
    } else {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.RAW;
    }
  } else {
    if (
      [
        POST_BODY_FORMAT_OPTIONS.JSON,
        POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
        POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
      ].includes(contentTypeValue)
    ) {
      rawApiContentType = contentTypeValue;
    } else if (
      contentTypeValue === "" ||
      contentTypeValue === POST_BODY_FORMAT_OPTIONS.NONE
    ) {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.NONE;
    } else {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.RAW;
    }
  }

  yield call(setHeaderFormat, values.id, rawApiContentType);
}

function* changeApiSaga(
  actionPayload: ReduxAction<{ id: string; isSaas: boolean; action?: Action }>,
) {
  PerformanceTracker.startTracking(PerformanceTransactionName.CHANGE_API_SAGA);
  const { id, isSaas } = actionPayload.payload;
  let { action } = actionPayload.payload;
  if (!action) action = yield select(getAction, id);
  if (!action) return;
  if (isSaas) {
    yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
  } else {
    yield put(initialize(API_EDITOR_FORM_NAME, action));

    yield call(updateExtraFormDataSaga);

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

  //Retrieve form data with synced query params to start tracking change history.
  const { values: actionPostProcess } = yield select(
    getFormData,
    API_EDITOR_FORM_NAME,
  );
  PerformanceTracker.stopTracking();
  yield put(updateReplayEntity(id, actionPostProcess, ENTITY_TYPE.ACTION));
}

function* setHeaderFormat(apiId: string, apiContentType?: string) {
  // use the current apiContentType to set appropriate Headers for action
  let displayFormat;

  if (apiContentType) {
    if (apiContentType === POST_BODY_FORMAT_OPTIONS.NONE) {
      displayFormat = {
        label: POST_BODY_FORMAT_OPTIONS.NONE,
        value: POST_BODY_FORMAT_OPTIONS.NONE,
      };
    } else if (
      apiContentType !== POST_BODY_FORMAT_OPTIONS.NONE &&
      Object.values(POST_BODY_FORMAT_OPTIONS).includes(apiContentType)
    ) {
      displayFormat = {
        label: apiContentType,
        value: apiContentType,
      };
    } else {
      displayFormat = {
        label: POST_BODY_FORMAT_OPTIONS.RAW,
        value: POST_BODY_FORMAT_OPTIONS.RAW,
      };
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

export function* updateFormFields(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
) {
  const field = actionPayload.meta.field;
  const value = actionPayload.payload;
  log.debug("updateFormFields: " + JSON.stringify(value));
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);

  // get current content type of the action
  let apiContentType =
    values?.actionConfiguration?.formData?.apiContentType ||
    POST_BODY_FORMAT_OPTIONS.JSON;

  let extraFormDataToBeChanged = false;

  if (field === "actionConfiguration.httpMethod") {
    const { actionConfiguration } = values;
    if (!actionConfiguration.headers) return;

    const actionConfigurationHeaders = cloneDeep(actionConfiguration.headers);
    const contentTypeHeaderIndex = actionConfigurationHeaders.findIndex(
      (header: { key: string; value: string }) =>
        header?.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
    );

    const indexToUpdate = getIndextoUpdate(
      actionConfigurationHeaders,
      contentTypeHeaderIndex,
    );

    //When user switches to GET method, content type remains same (empty or any type)
    //This condition handles other HTTP methods
    if (value !== HTTP_METHOD.GET) {
      // if user switches to other methods that is not GET and apiContentType is undefined set default apiContentType to JSON.
      if (apiContentType === POST_BODY_FORMAT_OPTIONS.NONE) {
        apiContentType =
          HTTP_METHODS_DEFAULT_FORMAT_TYPES[value as HTTP_METHOD];
        extraFormDataToBeChanged = true;
      }

      actionConfigurationHeaders[indexToUpdate] = {
        key: CONTENT_TYPE_HEADER_KEY,
        value: apiContentType,
      };
    }

    yield put(
      change(
        API_EDITOR_FORM_NAME,
        "actionConfiguration.headers",
        actionConfigurationHeaders,
      ),
    );

    if (extraFormDataToBeChanged) yield call(updateExtraFormDataSaga);
  }
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;
  if (form !== API_EDITOR_FORM_NAME) return;
  if (field === "dynamicBindingPathList" || field === "name") return;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  if (!values.id) return;
  const contentTypeHeaderIndex = values.actionConfiguration.headers.findIndex(
    (header: { key: string; value: string }) =>
      header?.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );
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
    // when user types a content type value, update actionConfiguration.formData.apiContent type as well.
    // we don't do this initally because we want to specifically catch user editing the content-type value
    if (
      field === `actionConfiguration.headers[${contentTypeHeaderIndex}].value`
    ) {
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.formData.apiContentType",
          actionPayload.payload,
        ),
      );
      const apiId = get(values, "id");
      // when the user specifically sets a new content type value, we check if the input value is a supported post body type and switch to it
      // if it does not we set the default to Raw mode.
      yield call(setHeaderFormat, apiId, actionPayload.payload);
    }
  }
  yield all([
    call(syncApiParamsSaga, actionPayload, values.id),
    call(updateFormFields, actionPayload),
  ]);

  // We need to refetch form values here since syncApuParams saga and updateFormFields directly update reform form values.
  const { values: formValuesPostProcess } = yield select(
    getFormData,
    API_EDITOR_FORM_NAME,
  );

  yield put(
    updateReplayEntity(
      formValuesPostProcess.id,
      formValuesPostProcess,
      ENTITY_TYPE.ACTION,
    ),
  );
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginType } = actionPayload.payload;
  const action: Action | undefined = yield select(getAction, id);
  const data = action ? { ...action } : {};
  const pageId: string = yield select(getCurrentPageId);

  if (pluginType === PluginType.API) {
    yield put(initialize(API_EDITOR_FORM_NAME, omit(data, "name")));
    history.push(
      apiEditorIdURL({
        pageId,
        apiId: id,
        params: {
          editName: "true",
          from: "datasources",
        },
      }),
    );
  }
}

function* handleDatasourceCreatedSaga(actionPayload: ReduxAction<Datasource>) {
  const plugin: Plugin | undefined = yield select(
    getPlugin,
    actionPayload.payload.pluginId,
  );
  const pageId: string = yield select(getCurrentPageId);
  // Only look at API plugins
  if (plugin && plugin.type !== PluginType.API) return;

  history.push(
    datasourcesEditorIdURL({
      pageId,
      datasourceId: actionPayload.payload.id,
      params: {
        from: "datasources",
        ...getQueryParams(),
      },
    }),
  );
}

function* handleCreateNewApiActionSaga(
  action: ReduxAction<{ pageId: string; from: EventLocation }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    REST_PLUGIN_PACKAGE_NAME,
  );
  const { pageId } = action.payload;
  if (pageId && pluginId) {
    const actions: ActionDataState = yield select(getActions);
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
          workspaceId,
        },
        eventData: {
          actionType: "API",
          from: action.payload.from,
        },
        pageId,
      } as ApiAction), // We don't have recursive partial in typescript for now.
    );
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
  const actionObj: Action | undefined = yield select(getAction, actionId);
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
    history.push(
      apiEditorIdURL({
        pageId: actionObj.pageId,
        apiId: actionId,
        params,
      }),
    );
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
      ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
      handleUpdateBodyContentType,
    ),
    takeEvery(
      ReduxActionTypes.REDIRECT_TO_NEW_INTEGRATIONS,
      redirectToNewIntegrations,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}
