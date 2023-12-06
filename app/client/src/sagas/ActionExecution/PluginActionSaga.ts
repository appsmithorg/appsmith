import {
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import type { updateActionDataPayloadType } from "actions/pluginActionActions";
import {
  clearActionResponse,
  executePluginActionError,
  executePluginActionRequest,
  executePluginActionSuccess,
  runAction,
  updateAction,
  updateActionData,
} from "actions/pluginActionActions";
import { makeUpdateJSCollection } from "sagas/JSPaneSagas";

import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import type {
  ApplicationPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type {
  ActionExecutionResponse,
  ActionResponse,
  ExecuteActionRequest,
  PaginationField,
} from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import {
  getAction,
  getCurrentPageNameByActionId,
  getPlugin,
  isActionDirty,
  isActionSaving,
  getDatasource,
  getJSCollectionFromAllEntities,
} from "@appsmith/selectors/entitiesSelector";
import { getIsGitSyncModalOpen } from "selectors/gitSyncSelectors";
import {
  getAppMode,
  getCurrentApplication,
} from "@appsmith/selectors/applicationSelectors";
import {
  get,
  isArray,
  isString,
  set,
  find,
  isNil,
  flatten,
  isArrayBuffer,
  isEmpty,
  unset,
} from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import {
  extractClientDefinedErrorMetadata,
  validateResponse,
} from "sagas/ErrorSagas";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  createMessage,
  ERROR_ACTION_EXECUTE_FAIL,
  ERROR_FAIL_ON_PAGE_LOAD_ACTIONS,
  ERROR_PLUGIN_ACTION_EXECUTE,
  ACTION_EXECUTION_CANCELLED,
  ACTION_EXECUTION_FAILED,
  SWITCH_ENVIRONMENT_SUCCESS,
} from "@appsmith/constants/messages";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  EventType,
  RESP_HEADER_DATATYPE,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsSavingEntity,
  getLayoutOnLoadActions,
  getLayoutOnLoadIssues,
} from "selectors/editorSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as log from "loglevel";
import { EMPTY_RESPONSE } from "components/editorComponents/emptyResponse";
import type { AppState } from "@appsmith/reducers";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import { evalWorker, evaluateActionBindings } from "sagas/EvaluationsSaga";
import { isBlobUrl, parseBlobUrl } from "utils/AppsmithUtils";
import { getType, Types } from "utils/TypeHelpers";
import { matchPath } from "react-router";
import {
  API_EDITOR_BASE_PATH,
  API_EDITOR_ID_PATH,
  API_EDITOR_PATH_WITH_SELECTED_PAGE_ID,
  INTEGRATION_EDITOR_PATH,
  QUERIES_EDITOR_BASE_PATH,
  QUERIES_EDITOR_ID_PATH,
  CURL_IMPORT_PAGE_PATH,
  matchQueryBuilderPath,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import { APP_MODE } from "entities/App";
import { FileDataTypes } from "WidgetProvider/constants";
import { hideDebuggerErrors } from "actions/debuggerActions";
import {
  ActionValidationError,
  getErrorAsString,
  PluginActionExecutionError,
  PluginTriggerFailureError,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";
import { shouldBeDefined, trimQueryString } from "utils/helpers";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { getFormNames, getFormValues } from "redux-form";
import { CURL_IMPORT_FORM } from "@appsmith/constants/forms";
import { submitCurlImportForm } from "actions/importActions";
import type { curlImportFormValues } from "pages/Editor/APIEditor/helpers";
import { matchBasePath } from "@appsmith/pages/Editor/Explorer/helpers";
import {
  isTrueObject,
  findDatatype,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { handleExecuteJSFunctionSaga } from "sagas/JSPaneSagas";
import type { Plugin } from "api/PluginApi";
import { setDefaultActionDisplayFormat } from "./PluginActionSagaUtils";
import { checkAndLogErrorsIfCyclicDependency } from "sagas/helper";
import { toast } from "design-system";
import type { TRunDescription } from "workers/Evaluation/fns/actionFns";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import { FILE_SIZE_LIMIT_FOR_BLOBS } from "constants/WidgetConstants";
import { getCurrentActions } from "@appsmith/selectors/entitiesSelector";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import { handleStoreOperations } from "./StoreActionSaga";
import { fetchPage } from "actions/pageActions";
import type { Datasource } from "entities/Datasource";
import { softRefreshDatasourceStructure } from "actions/datasourceActions";
import { changeQuery } from "actions/queryPaneActions";
import {
  getCurrentEnvironmentDetails,
  getCurrentEnvironmentName,
} from "@appsmith/selectors/environmentSelectors";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { getIsActionCreatedInApp } from "@appsmith/utils/getIsActionCreatedInApp";
import type { OtlpSpan } from "UITelemetry/generateTraces";
import {
  endSpan,
  setAttributesToSpan,
  startRootSpan,
} from "UITelemetry/generateTraces";
import {
  getJSActionPathNameToDisplay,
  getPluginActionNameToDisplay,
} from "@appsmith/utils/actionExecutionUtils";

enum ActionResponseDataTypes {
  BINARY = "BINARY",
}

interface FilePickerInstumentationObject {
  numberOfFiles: number;
  totalSize: number;
  fileTypes: Array<string>;
  fileSizes: Array<number>;
}

export const getActionTimeout = (
  state: AppState,
  actionId: string,
): number | undefined => {
  const action = find(state.entities.actions, (a) => a.config.id === actionId);
  if (action) {
    const timeout = get(
      action,
      "config.actionConfiguration.timeoutInMillisecond",
      DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
    );
    if (timeout) {
      // Extra timeout padding to account for network calls
      return timeout + 5000;
    }
    return undefined;
  }
  return undefined;
};

const createActionExecutionResponse = (
  response: ActionExecutionResponse,
): ActionResponse => {
  const payload = response.data;
  if (payload.statusCode === "200 OK" && payload.hasOwnProperty("headers")) {
    const respHeaders = payload.headers;
    if (
      respHeaders.hasOwnProperty(RESP_HEADER_DATATYPE) &&
      respHeaders[RESP_HEADER_DATATYPE].length > 0 &&
      respHeaders[RESP_HEADER_DATATYPE][0] === ActionResponseDataTypes.BINARY &&
      getType(payload.body) === Types.STRING
    ) {
      // Decoding from base64 to handle the binary files because direct
      // conversion of binary files to string causes corruption in the final output
      // this is to only handle the download of binary files
      payload.body = atob(payload.body as string);
    }
  }
  return {
    ...payload,
    ...response.clientMeta,
  };
};
const isErrorResponse = (response: ActionExecutionResponse) => {
  return !response.data.isExecutionSuccess;
};

/**
 *
 * @param blobUrl string A blob url with type added a query param
 * @returns promise that resolves to file content
 */
function* readBlob(blobUrl: string): any {
  const [url, fileType] = parseBlobUrl(blobUrl);
  const file = yield fetch(url).then(async (r) => r.blob());

  return yield new Promise((resolve) => {
    const reader = new FileReader();
    if (fileType === FileDataTypes.Base64) {
      reader.readAsDataURL(file);
    } else if (fileType === FileDataTypes.Binary) {
      if (file.size < FILE_SIZE_LIMIT_FOR_BLOBS) {
        //check size of the file, if less than 5mb, go with binary string method
        // TODO: this method is deprecated, use readAsText instead
        reader.readAsBinaryString(file);
      } else {
        // For files greater than 5 mb, use array buffer method
        // This is to remove the bloat from the file which is added
        // when using read as binary string method
        reader.readAsArrayBuffer(file);
      }
    } else {
      reader.readAsText(file);
    }
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
}

/**
 * This function resolves :
 * - individual objects containing blob urls
 * - blob urls directly
 * - else returns the value unchanged
 * - finds datatype of evaluated value
 * - binds dataype to payload
 *
 * @param value
 */

function* resolvingBlobUrls(
  value: any,
  executeActionRequest: ExecuteActionRequest,
  index: number,
  isArray?: boolean,
  arrDatatype?: string[],
) {
  //Get datatypes of evaluated value.
  const dataType: string = findDatatype(value);
  //If array elements then dont push datatypes to payload.
  isArray
    ? arrDatatype?.push(dataType)
    : (executeActionRequest.paramProperties[`k${index}`] = {
        datatype: dataType,
      });

  if (isTrueObject(value)) {
    const blobUrlPaths: string[] = [];
    Object.keys(value).forEach((propertyName) => {
      if (isBlobUrl(value[propertyName])) {
        blobUrlPaths.push(propertyName);
      }
    });

    for (const blobUrlPath of blobUrlPaths) {
      const blobUrl = value[blobUrlPath] as string;
      const resolvedBlobValue: unknown = yield call(readBlob, blobUrl);
      set(value, blobUrlPath, resolvedBlobValue);

      // We need to store the url path map to be able to update the blob data
      // and send the info to server

      // Here we fetch the blobUrlPathMap from the action payload and update it
      const blobUrlPathMap = get(value, "blobUrlPaths", {}) as Record<
        string,
        string
      >;
      set(blobUrlPathMap, blobUrlPath, blobUrl);
      set(value, "blobUrlPaths", blobUrlPathMap);
    }
  } else if (isBlobUrl(value)) {
    // @ts-expect-error: Values can take many types
    value = yield call(readBlob, value);
  }

  return value;
}

// Function that updates the blob data in the action payload for large file
// uploads
function updateBlobDataFromUrls(
  blobUrlPaths: Record<string, string>,
  newVal: any,
  blobMap: string[],
  blobDataMap: Record<string, Blob>,
) {
  Object.entries(blobUrlPaths as Record<string, string>).forEach(
    // blobUrl: string eg: blob:1234-1234-1234?type=binary
    ([path, blobUrl]) => {
      if (isArrayBuffer(newVal[path])) {
        // remove the ?type=binary from the blob url if present
        const sanitisedBlobURL = blobUrl.split("?")[0];
        blobMap.push(sanitisedBlobURL);
        set(blobDataMap, sanitisedBlobURL, new Blob([newVal[path]]));
        set(newVal, path, sanitisedBlobURL);
      }
    },
  );
}

/**
 * Api1
 * URL: https://example.com/{{Text1.text}}
 * Body: {
 *     "name": "{{this.params.name}}",
 *     "age": {{this.params.age}},
 *     "gender": {{Dropdown1.selectedOptionValue}}
 * }
 *
 * If you call
 * Api1.run(undefined, undefined, { name: "Hetu", age: Input1.text });
 *
 * executionParams is { name: "Hetu", age: Input1.text }
 * bindings is [
 *   "Text1.text",
 *   "Dropdown1.selectedOptionValue",
 *   "this.params.name",
 *   "this.params.age",
 * ]
 *
 * Return will be [
 *   { key: "Text1.text", value: "updateUser" },
 *   { key: "Dropdown1.selectedOptionValue", value: "M" },
 *   { key: "this.params.name", value: "Hetu" },
 *   { key: "this.params.age", value: 26 },
 * ]
 * @param bindings
 * @param executionParams
 */
function* evaluateActionParams(
  bindings: string[] | undefined,
  formData: FormData,
  executeActionRequest: ExecuteActionRequest,
  filePickerInstrumentation: FilePickerInstumentationObject,
  executionParams?: Record<string, any> | string,
) {
  if (isNil(bindings) || bindings.length === 0) {
    formData.append("executeActionDTO", JSON.stringify(executeActionRequest));
    return [];
  }
  // Evaluated all bindings of the actions. Pass executionParams if any
  // @ts-expect-error: Values can take many types
  const values = yield call(evaluateActionBindings, bindings, executionParams);

  const bindingsMap: Record<string, string> = {};
  const bindingBlob = [];

  // Maintain a blob data map to resolve blob urls of large files as array buffer
  const blobDataMap: Record<string, Blob> = {};

  let recordFilePickerInstrumentation = false;

  // if json bindings have filepicker reference, we need to init the instrumentation object
  // which we will send post execution
  recordFilePickerInstrumentation = bindings.some((binding) =>
    binding.includes(".files"),
  );

  // Add keys values to formData for the multipart submission
  for (let i = 0; i < bindings.length; i++) {
    const key = bindings[i];
    let value = isArray(values) && values[i];

    let useBlobMaps = false;
    // Maintain a blob map to resolve blob urls of large files
    const blobMap: Array<string> = [];

    if (isArray(value)) {
      const tempArr = [];
      const arrDatatype: Array<string> = [];
      // array of objects containing blob urls that is loops and individual object is checked for resolution of blob urls.
      for (const val of value) {
        const newVal: Record<string, any> = yield call(
          resolvingBlobUrls,
          val,
          executeActionRequest,
          i,
          true,
          arrDatatype,
        );

        if (newVal.hasOwnProperty("blobUrlPaths")) {
          updateBlobDataFromUrls(
            newVal.blobUrlPaths,
            newVal,
            blobMap,
            blobDataMap,
          );
          useBlobMaps = true;
          unset(newVal, "blobUrlPaths");
        }

        tempArr.push(newVal);

        if (key.includes(".files") && recordFilePickerInstrumentation) {
          filePickerInstrumentation["numberOfFiles"] += 1;
          const { size, type } = newVal;
          filePickerInstrumentation["totalSize"] += size;
          filePickerInstrumentation["fileSizes"].push(size);
          filePickerInstrumentation["fileTypes"].push(type);
        }
      }
      //Adding array datatype along with the datatype of first element of the array
      executeActionRequest.paramProperties[`k${i}`] = {
        datatype: { array: [arrDatatype[0]] },
      };
      value = tempArr;
    } else {
      // @ts-expect-error: Values can take many types
      value = yield call(resolvingBlobUrls, value, executeActionRequest, i);
      if (key.includes(".files") && recordFilePickerInstrumentation) {
        filePickerInstrumentation["numberOfFiles"] += 1;
        filePickerInstrumentation["totalSize"] += value.size;
        filePickerInstrumentation["fileSizes"].push(value.size);
        filePickerInstrumentation["fileTypes"].push(value.type);
      }
    }

    if (typeof value === "object") {
      // This is used in cases of large files, we store the bloburls with the path they were set in
      // This helps in creating a unique map of blob urls to blob data when passing to the server
      if (!!value && value.hasOwnProperty("blobUrlPaths")) {
        updateBlobDataFromUrls(value.blobUrlPaths, value, blobMap, blobDataMap);
        unset(value, "blobUrlPaths");
      }

      value = JSON.stringify(value);
    }

    // If there are no blob urls in the value, we can directly add it to the formData
    // If there are blob urls, we need to add them to the blobDataMap
    if (!useBlobMaps) {
      value = new Blob([value], { type: "text/plain" });
    }
    bindingsMap[key] = `k${i}`;
    bindingBlob.push({ name: `k${i}`, value: value });

    // We need to add the blob map to the param properties
    // This will allow the server to handle the scenaio of large files upload using blob data
    const paramProperties = executeActionRequest.paramProperties[`k${i}`];
    if (!!paramProperties && typeof paramProperties === "object") {
      paramProperties["blobIdentifiers"] = blobMap;
    }
  }

  formData.append("executeActionDTO", JSON.stringify(executeActionRequest));
  formData.append("parameterMap", JSON.stringify(bindingsMap));
  bindingBlob?.forEach((item) => formData.append(item.name, item.value));

  // Append blob data map to formData if not empty
  if (!isEmpty(blobDataMap)) {
    // blobDataMap is used to resolve blob urls of large files as array buffer
    // we need to add each blob data to formData as a separate entry
    Object.entries(blobDataMap).forEach(([path, blobData]) =>
      formData.append(path, blobData),
    );
  }
}

export default function* executePluginActionTriggerSaga(
  pluginAction: TRunDescription,
  eventType: EventType,
) {
  const span = startRootSpan("executePluginActionTriggerSaga");
  const { payload: pluginPayload } = pluginAction;
  const { actionId, onError, params } = pluginPayload;
  if (getType(params) !== Types.OBJECT) {
    throw new ActionValidationError(
      "RUN_PLUGIN_ACTION",
      "params",
      Types.OBJECT,
      getType(params),
    );
  }
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  span &&
    setAttributesToSpan(span, {
      actionId: actionId,
    });
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const action = shouldBeDefined<Action>(
    yield select(getAction, actionId),
    `Action not found for id - ${actionId}`,
  );
  const datasourceId: string = (action?.datasource as any)?.id;
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const plugin: Plugin = yield select(getPlugin, action?.pluginId);
  const currentApp: ApplicationPayload = yield select(getCurrentApplication);

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  AnalyticsUtil.logEvent("EXECUTE_ACTION", {
    type: action?.pluginType,
    name: action?.name,
    pageId: action?.pageId,
    appId: currentApp.id,
    appMode: appMode,
    appName: currentApp.name,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
    isExampleApp: currentApp.appIsExample,
    pluginName: plugin?.name,
    datasourceId: datasourceId,
    isMock: !!datasource?.isMock,
    actionId: action?.id,
    inputParams: Object.keys(params).length,
  });
  const pagination =
    eventType === EventType.ON_NEXT_PAGE
      ? "NEXT"
      : eventType === EventType.ON_PREV_PAGE
      ? "PREV"
      : undefined;
  AppsmithConsole.info({
    text: "Execution started from widget request",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: action.name,
      id: actionId,
    },
    state: action.actionConfiguration,
  });
  const executePluginActionResponse: ExecutePluginActionResponse = yield call(
    executePluginActionSaga,
    action,
    pagination,
    params,
    undefined,
    span,
  );
  const { isError, payload } = executePluginActionResponse;

  if (isError) {
    AppsmithConsole.addErrors([
      {
        payload: {
          id: actionId,
          iconId: action.pluginId,
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          text: `Execution failed with status ${payload.statusCode}`,
          environmentName: currentEnvDetails.name,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: action.name,
            id: actionId,
            httpMethod: action.actionConfiguration.httpMethod,
            pluginType: action.pluginType,
          },
          state: payload.request,
          messages: [
            {
              // Need to stringify cause this gets rendered directly
              // and rendering objects can crash the app
              message: {
                name: "PluginExecutionError",
                message: !isString(payload.body)
                  ? JSON.stringify(payload.body)
                  : payload.body,
              },
              type: PLATFORM_ERROR.PLUGIN_EXECUTION,
              subType: payload.errorType,
            },
          ],
          pluginErrorDetails: payload.pluginErrorDetails,
        },
      },
    ]);
    AnalyticsUtil.logEvent("EXECUTE_ACTION_FAILURE", {
      type: action?.pluginType,
      name: action?.name,
      pageId: action?.pageId,
      appId: currentApp.id,
      appMode: appMode,
      appName: currentApp.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      isExampleApp: currentApp.appIsExample,
      pluginName: plugin?.name,
      datasourceId: datasourceId,
      isMock: !!datasource?.isMock,
      actionId: action?.id,
      ...payload.pluginErrorDetails,
      inputParams: Object.keys(params).length,
    });
    if (onError) {
      throw new PluginTriggerFailureError(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, action.name),
        [payload.body, params],
      );
    } else {
      throw new PluginTriggerFailureError(
        createMessage(ERROR_PLUGIN_ACTION_EXECUTE, action.name),
        [],
      );
    }
  } else {
    AnalyticsUtil.logEvent("EXECUTE_ACTION_SUCCESS", {
      type: action?.pluginType,
      name: action?.name,
      pageId: action?.pageId,
      appId: currentApp.id,
      appMode: appMode,
      appName: currentApp.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      isExampleApp: currentApp.appIsExample,
      pluginName: plugin?.name,
      datasourceId: datasourceId,
      isMock: !!datasource?.isMock,
      actionId: action?.id,
      inputParams: Object.keys(params).length,
    });
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: "Executed successfully from widget request",
      timeTaken: payload.duration,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: action.name,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
  }
  return [payload.body, params];
}

function* runActionShortcutSaga() {
  const pathname = window.location.pathname;
  const baseMatch = matchBasePath(pathname);
  if (!baseMatch) return;
  // get gitSyncModal status
  const isGitSyncModalOpen: boolean = yield select(getIsGitSyncModalOpen);
  // if git sync modal is open, prevent action from being executed via shortcut keys.
  if (isGitSyncModalOpen) return;

  const { path } = baseMatch;
  const match: any = matchPath(pathname, {
    path: [
      trimQueryString(`${path}${API_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${API_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${API_EDITOR_PATH_WITH_SELECTED_PAGE_ID}`),
      trimQueryString(`${path}${INTEGRATION_EDITOR_PATH}`),
      trimQueryString(`${path}${SAAS_EDITOR_API_ID_PATH}`),
      `${path}${CURL_IMPORT_PAGE_PATH}`,
    ],
    exact: true,
    strict: false,
  });

  // get the current form name
  const currentFormNames: string[] = yield select(getFormNames());

  if (!match || !match.params) return;
  const { apiId, pageId, queryId } = match.params;
  const actionId = apiId || queryId;
  if (actionId) {
    const trackerId = apiId
      ? PerformanceTransactionName.RUN_API_SHORTCUT
      : PerformanceTransactionName.RUN_QUERY_SHORTCUT;
    PerformanceTracker.startTracking(trackerId, {
      actionId,
      pageId,
    });
    AnalyticsUtil.logEvent(trackerId as EventName, {
      actionId,
    });
    yield put(runAction(actionId));
  } else if (
    !!currentFormNames &&
    currentFormNames.includes(CURL_IMPORT_FORM) &&
    !actionId
  ) {
    // if the current form names include the curl form and there are no actionIds i.e. its not an api or query
    // get the form values and call the submit curl import form function with its data
    const formValues: curlImportFormValues = yield select(
      getFormValues(CURL_IMPORT_FORM),
    );

    // if the user has not edited the curl input field, assign an empty string to it, so it doesnt throw an error.
    if (!formValues?.curl) formValues["curl"] = "";

    yield put(submitCurlImportForm(formValues));
  } else {
    return;
  }
}

interface RunActionError {
  name: string;
  message: string;
  clientDefinedError?: boolean;
}

export function* runActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField?: PaginationField;
    skipOpeningDebugger: boolean;
    action?: Action;
  }>,
) {
  const span = startRootSpan("runActionSaga");
  const actionId = reduxAction.payload.id;
  const isSaving: boolean = yield select(isActionSaving(actionId));
  const isDirty: boolean = yield select(isActionDirty(actionId));
  const isSavingEntity: boolean = yield select(getIsSavingEntity);
  if (isSaving || isDirty || isSavingEntity) {
    if (isDirty && !isSaving) {
      yield put(updateAction({ id: actionId }));
      yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
    }
  }

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  const actionObject =
    reduxAction.payload.action ||
    shouldBeDefined<Action>(
      yield select(getAction, actionId),
      `action not found for id - ${actionId}`,
    );
  const plugin: Plugin = yield select(getPlugin, actionObject?.pluginId);
  const datasource: Datasource = yield select(
    getDatasource,
    (actionObject?.datasource as any)?.id,
  );
  const pageName: string = yield select(getCurrentPageNameByActionId, actionId);

  const datasourceUrl = get(
    actionObject,
    "datasource.datasourceConfiguration.url",
  );

  AppsmithConsole.info({
    text: "Execution started from user request",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: actionObject.name,
      id: actionId,
    },
    state: {
      ...actionObject.actionConfiguration,
      ...(datasourceUrl
        ? {
            url: datasourceUrl,
          }
        : null),
    },
  });

  const { paginationField } = reduxAction.payload;
  // open response tab in debugger on exection of action.
  if (!reduxAction.payload.skipOpeningDebugger) {
    yield call(openDebugger);
  }

  let payload = EMPTY_RESPONSE;
  let isError = true;
  let error: RunActionError = {
    name: "",
    message: "",
  };
  try {
    const executePluginActionResponse: ExecutePluginActionResponse = yield call(
      executePluginActionSaga,
      actionObject,
      paginationField,
      {},
      true,
      span,
    );
    payload = executePluginActionResponse.payload;
    isError = executePluginActionResponse.isError;
  } catch (e) {
    // When running from the pane, we just want to end the saga if the user has
    // cancelled the call. No need to log any errors
    if (e instanceof UserCancelledActionExecutionError) {
      // cancel action but do not throw any error.
      yield put({
        type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
        payload: {
          error: e.name,
          id: reduxAction.payload.id,
          show: false,
        },
      });
      toast.show(createMessage(ACTION_EXECUTION_CANCELLED, actionObject.name), {
        kind: "error",
      });
      return;
    }
    log.error(e);
    error = { name: (e as Error).name, message: (e as Error).message };

    const clientDefinedErrorMetadata = extractClientDefinedErrorMetadata(e);
    if (clientDefinedErrorMetadata) {
      set(
        payload,
        "statusCode",
        `${clientDefinedErrorMetadata?.statusCode || ""}`,
      );
      set(payload, "request", {});
      set(
        payload,
        "pluginErrorDetails",
        clientDefinedErrorMetadata?.pluginErrorDetails,
      );
      set(error, "clientDefinedError", true);
    }
  }

  // Error should be readable error if present.
  // Otherwise, payload's body.
  // Default to "An unexpected error occurred" if none is available

  const readableError = payload.readableError
    ? {
        name: "PluginExecutionError",
        message: getErrorAsString(payload.readableError),
      }
    : undefined;

  const payloadBodyError = payload.body
    ? {
        name: "PluginExecutionError",
        message: getErrorAsString(payload.body),
      }
    : undefined;

  const clientDefinedError = error.clientDefinedError
    ? {
        name: "PluginExecutionError",
        message: error?.message,
        clientDefinedError: true,
      }
    : undefined;

  const defaultError = {
    name: "PluginExecutionError",
    message: "An unexpected error occurred",
  };

  if (isError) {
    error =
      readableError || payloadBodyError || clientDefinedError || defaultError;

    // In case of debugger, both the current error message
    // and the readableError needs to be present,
    // since the readableError may be malformed for certain errors.

    const appsmithConsoleErrorMessageList = [
      {
        message: error,
        type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        subType: payload.errorType,
      },
    ];

    if (error === readableError && !!payloadBodyError) {
      appsmithConsoleErrorMessageList.push({
        message: payloadBodyError,
        type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        subType: payload.errorType,
      });
    }

    AppsmithConsole.addErrors([
      {
        payload: {
          id: actionId,
          iconId: actionObject.pluginId,
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          environmentName: currentEnvDetails.name,
          text: `Execution failed${
            payload.statusCode ? ` with status ${payload.statusCode}` : ""
          }`,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: actionObject.name,
            id: actionId,
            httpMethod: actionObject.actionConfiguration.httpMethod,
            pluginType: actionObject.pluginType,
          },
          messages: appsmithConsoleErrorMessageList,
          state: payload?.request,
          pluginErrorDetails: payload?.pluginErrorDetails,
        },
      },
    ]);

    yield put({
      type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
      payload: {
        error: appsmithConsoleErrorMessageList[0].message,
        id: reduxAction.payload.id,
        show: false,
      },
    });
    let failureEventName: EventName = "RUN_API_FAILURE";
    if (actionObject.pluginType === PluginType.DB) {
      failureEventName = "RUN_QUERY_FAILURE";
    }
    if (actionObject.pluginType === PluginType.SAAS) {
      failureEventName = "RUN_SAAS_API_FAILURE";
    }
    AnalyticsUtil.logEvent(failureEventName, {
      actionId,
      actionName: actionObject.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      pageName: pageName,
      apiType: "INTERNAL",
      datasourceId: datasource?.id,
      pluginName: plugin?.name,
      isMock: !!datasource?.isMock,
      ...payload?.pluginErrorDetails,
    });
    return;
  }

  let eventName: EventName = "RUN_API";
  if (actionObject.pluginType === PluginType.DB) {
    eventName = "RUN_QUERY";
  }
  if (actionObject.pluginType === PluginType.SAAS) {
    eventName = "RUN_SAAS_API";
  }

  AnalyticsUtil.logEvent(eventName, {
    actionId,
    actionName: actionObject.name,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
    pageName: pageName,
    responseTime: payload.duration,
    apiType: "INTERNAL",
    datasourceId: datasource?.id,
    pluginName: plugin?.name,
    isMock: !!datasource?.isMock,
  });

  yield put({
    type: ReduxActionTypes.RUN_ACTION_SUCCESS,
    payload: { [actionId]: payload },
  });
  if (payload.isExecutionSuccess) {
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: "Executed successfully from user request",
      timeTaken: payload.duration,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: actionObject.name,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
  }
}

function* executeOnPageLoadJSAction(pageAction: PageAction) {
  const collectionId = pageAction.collectionId;
  const pageId: string | undefined = yield select(getCurrentPageId);

  if (!collectionId) return;

  const collection: ReturnType<typeof getJSCollectionFromAllEntities> =
    yield select(getJSCollectionFromAllEntities, collectionId);

  if (!collection) {
    Sentry.captureException(
      new Error(
        "Collection present in layoutOnLoadActions but no collection exists ",
      ),
      {
        extra: {
          collectionId,
          actionId: pageAction.id,
          pageId,
        },
      },
    );
    return;
  }

  const jsAction = collection.actions.find(
    (action) => action.id === pageAction.id,
  );
  if (!!jsAction) {
    if (jsAction.confirmBeforeExecute) {
      const jsActionPathNameToDisplay = getJSActionPathNameToDisplay(
        jsAction,
        collection,
      );
      const modalPayload = {
        name: jsActionPathNameToDisplay,
        modalOpen: true,
        modalType: ModalType.RUN_ACTION,
      };

      const confirmed: boolean = yield call(
        requestModalConfirmationSaga,
        modalPayload,
      );
      if (!confirmed) {
        yield put({
          type: ReduxActionTypes.RUN_ACTION_CANCELLED,
          payload: { id: pageAction.id },
        });

        const jsActionPathNameToDisplay = getJSActionPathNameToDisplay(
          jsAction,
          collection,
        );

        toast.show(
          createMessage(ACTION_EXECUTION_CANCELLED, jsActionPathNameToDisplay),
          {
            kind: "error",
          },
        );
        // Don't proceed to executing the js function
        return;
      }
    }
    const data = {
      action: jsAction,
      collection,
      isExecuteJSFunc: true,
    };

    yield call(handleExecuteJSFunctionSaga, data);
  }
}

function* executePageLoadAction(pageAction: PageAction, span?: OtlpSpan) {
  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  if (pageAction.hasOwnProperty("collectionId")) {
    yield call(executeOnPageLoadJSAction, pageAction);
  } else {
    const pageId: string | undefined = yield select(getCurrentPageId);
    let currentApp: ApplicationPayload = yield select(getCurrentApplication);
    currentApp = currentApp || {};
    const appMode: APP_MODE | undefined = yield select(getAppMode);

    // action is required to fetch the pluginId and pluginType.
    const action = shouldBeDefined<Action>(
      yield select(getAction, pageAction.id),
      `action not found for id - ${pageAction.id}`,
    );

    const datasourceId: string = (action?.datasource as any)?.id;
    const datasource: Datasource = yield select(getDatasource, datasourceId);
    const plugin: Plugin = yield select(getPlugin, action?.pluginId);
    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: pageAction.pluginType,
      name: pageAction.name,
      pageId: pageId,
      appMode: appMode,
      appId: currentApp.id,
      onPageLoad: true,
      appName: currentApp.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      isExampleApp: currentApp.appIsExample,
      pluginName: plugin?.name,
      datasourceId: datasourceId,
      isMock: !!datasource?.isMock,
      actionId: pageAction?.id,
      inputParams: 0,
    });

    let payload = EMPTY_RESPONSE;
    let isError = true;
    let error = {
      name: "PluginExecutionError",
      message: createMessage(ACTION_EXECUTION_FAILED, pageAction.name),
    };

    try {
      const executePluginActionResponse: ExecutePluginActionResponse =
        yield call(
          executePluginActionSaga,
          action,
          undefined,
          undefined,
          undefined,
          span,
        );
      payload = executePluginActionResponse.payload;
      isError = executePluginActionResponse.isError;
    } catch (e) {
      log.error(e);

      if (e instanceof UserCancelledActionExecutionError) {
        error = {
          name: "PluginExecutionError",
          message: createMessage(ACTION_EXECUTION_CANCELLED, pageAction.name),
        };
      }
    }
    // open response tab in debugger on exection of action on page load.
    // Only if current page is the page on which the action is executed.
    if (window.location.pathname.includes(pageAction.id))
      yield call(openDebugger);

    if (isError) {
      AppsmithConsole.addErrors([
        {
          payload: {
            id: pageAction.id,
            iconId: action.pluginId,
            logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
            environmentName: currentEnvDetails.name,
            text: `Execution failed with status ${payload.statusCode}`,
            source: {
              type: ENTITY_TYPE.ACTION,
              name: pageAction.name,
              id: pageAction.id,
              httpMethod: action.actionConfiguration.httpMethod,
              pluginType: action.pluginType,
            },
            state: payload.request,
            messages: [
              {
                message: error,
                type: PLATFORM_ERROR.PLUGIN_EXECUTION,
                subType: payload.errorType,
              },
            ],
            pluginErrorDetails: payload.pluginErrorDetails,
          },
        },
      ]);

      yield put(
        executePluginActionError({
          actionId: pageAction.id,
          isPageLoad: true,
          error: { message: error.message },
          data: payload,
        }),
      );
      yield put(
        updateActionData([
          {
            entityName: action.name,
            dataPath: "data",
            data: payload.body,
          },
        ]),
      );
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        {
          failed: true,
        },
        pageAction.id,
      );
      AnalyticsUtil.logEvent("EXECUTE_ACTION_FAILURE", {
        type: pageAction.pluginType,
        name: pageAction.name,
        pageId: pageId,
        appMode: appMode,
        appId: currentApp.id,
        onPageLoad: true,
        appName: currentApp.name,
        environmentId: currentEnvDetails.id,
        environmentName: currentEnvDetails.name,
        isExampleApp: currentApp.appIsExample,
        pluginName: plugin?.name,
        datasourceId: datasourceId,
        isMock: !!datasource?.isMock,
        actionId: pageAction?.id,
        inputParams: 0,
        ...payload.pluginErrorDetails,
      });
    } else {
      AnalyticsUtil.logEvent("EXECUTE_ACTION_SUCCESS", {
        type: pageAction.pluginType,
        name: pageAction.name,
        pageId: pageId,
        appMode: appMode,
        appId: currentApp.id,
        onPageLoad: true,
        appName: currentApp.name,
        environmentId: currentEnvDetails.id,
        environmentName: currentEnvDetails.name,
        isExampleApp: currentApp.appIsExample,
        pluginName: plugin?.name,
        datasourceId: datasourceId,
        isMock: !!datasource?.isMock,
        actionId: pageAction?.id,
        inputParams: 0,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        undefined,
        pageAction.id,
      );
      yield put(
        updateActionData([
          {
            entityName: action.name,
            dataPath: "data",
            data: payload.body,
          },
        ]),
      );
      yield take(ReduxActionTypes.SET_EVALUATED_TREE);
    }
  }
}

function* executePageLoadActionsSaga() {
  const span = startRootSpan("executePageLoadActionsSaga");
  try {
    const pageActions: PageAction[][] = yield select(getLayoutOnLoadActions);
    const layoutOnLoadActionErrors: LayoutOnLoadActionErrors[] = yield select(
      getLayoutOnLoadIssues,
    );
    const actionCount = flatten(pageActions).length;
    span && setAttributesToSpan(span, { numActions: actionCount });
    // when cyclical depedency issue is there,
    // none of the page load actions would be executed
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
      { numActions: actionCount },
    );
    for (const actionSet of pageActions) {
      // Load all sets in parallel
      // @ts-expect-error: no idea how to type this
      yield* yield all(
        actionSet.map((apiAction) =>
          call(executePageLoadAction, apiAction, span),
        ),
      );
    }
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
    );
    // We show errors in the debugger once onPageLoad actions
    // are executed
    yield put(hideDebuggerErrors(false));
    checkAndLogErrorsIfCyclicDependency(layoutOnLoadActionErrors);
  } catch (e) {
    log.error(e);

    toast.show(createMessage(ERROR_FAIL_ON_PAGE_LOAD_ACTIONS), {
      kind: "error",
    });
  }
  endSpan(span);
}

interface ExecutePluginActionResponse {
  payload: ActionResponse;
  isError: boolean;
}
/*
 * This saga handles the complete plugin action execution flow. It will respond with a
 * payload and isError property which indicates if the response is of an error type.
 * In case of the execution was not completed, it will throw errors of type
 * PluginActionExecutionError which needs to be handled by any saga that calls this.
 * */
function* executePluginActionSaga(
  pluginAction: Action,
  paginationField?: PaginationField,
  params?: Record<string, unknown>,
  isUserInitiated?: boolean,
  parentSpan?: OtlpSpan,
) {
  const actionId = pluginAction.id;
  const pluginActionNameToDisplay = getPluginActionNameToDisplay(pluginAction);
  parentSpan &&
    setAttributesToSpan(parentSpan, {
      actionId,
      pluginName: pluginActionNameToDisplay,
    });
  if (pluginAction.confirmBeforeExecute) {
    const modalPayload = {
      name: pluginActionNameToDisplay,
      modalOpen: true,
      modalType: ModalType.RUN_ACTION,
    };

    const confirmed: unknown = yield call(
      requestModalConfirmationSaga,
      modalPayload,
    );

    if (!confirmed) {
      yield put({
        type: ReduxActionTypes.RUN_ACTION_CANCELLED,
        payload: { id: actionId },
      });
      throw new UserCancelledActionExecutionError();
    }
  }
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  yield put(executePluginActionRequest({ id: actionId }));

  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const timeout: number | undefined = yield select(getActionTimeout, actionId);

  const executeActionRequest: ExecuteActionRequest = {
    actionId: actionId,
    viewMode: appMode === APP_MODE.PUBLISHED,
    paramProperties: {},
    analyticsProperties: {
      isUserInitiated: !!isUserInitiated,
    },
  };

  if (paginationField) {
    executeActionRequest.paginationField = paginationField;
  }

  const formData = new FormData();

  // Initialising instrumentation object, will only be populated in case
  // files are being uplaoded
  const filePickerInstrumentation: FilePickerInstumentationObject = {
    numberOfFiles: 0,
    totalSize: 0,
    fileTypes: [],
    fileSizes: [],
  };

  yield call(
    evaluateActionParams,
    pluginAction.jsonPathKeys,
    formData,
    executeActionRequest,
    filePickerInstrumentation,
    params,
  );

  let payload = EMPTY_RESPONSE;
  let response: ActionExecutionResponse;
  try {
    response = yield ActionAPI.executeAction(formData, timeout, parentSpan);

    const isError = isErrorResponse(response);
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.EXECUTE_ACTION,
    );
    yield validateResponse(response);
    payload = createActionExecutionResponse(response);

    yield put(
      executePluginActionSuccess({
        id: actionId,
        response: payload,
        isActionCreatedInApp: getIsActionCreatedInApp(pluginAction),
      }),
    );

    yield put(
      updateActionData(
        [
          {
            entityName: pluginAction.name,
            dataPath: "data",
            data: payload.body,
          },
        ],
        parentSpan,
      ),
    );
    // TODO: Plugins are not always fetched before on page load actions are executed.
    try {
      let plugin: Plugin | undefined;
      if (!!pluginAction.pluginId) {
        plugin = shouldBeDefined<Plugin>(
          yield select(getPlugin, pluginAction.pluginId),
          `Plugin not found for id - ${pluginAction.pluginId}`,
        );
      }

      // sets the default display format for action response e.g Raw, Json or Table
      yield setDefaultActionDisplayFormat(actionId, plugin, payload);
    } catch (e) {
      log.error("plugin no found", e);
    }

    if (filePickerInstrumentation.numberOfFiles > 0) {
      triggerFileUploadInstrumentation(
        filePickerInstrumentation,
        isError ? "ERROR" : "SUCCESS",
        response.data.statusCode,
        pluginAction.name,
        pluginAction.pluginType,
        response.clientMeta.duration,
      );
    }
    return {
      payload,
      isError,
    };
  } catch (e) {
    if ("clientDefinedError" in (e as any)) {
      // Case: error from client side validation
      if (filePickerInstrumentation.numberOfFiles > 0) {
        triggerFileUploadInstrumentation(
          filePickerInstrumentation,
          "ERROR",
          "400",
          pluginAction.name,
          pluginAction.pluginType,
          "NA",
        );
      }
      throw e;
    }

    yield put(
      executePluginActionSuccess({
        id: actionId,
        response: EMPTY_RESPONSE,
        isActionCreatedInApp: getIsActionCreatedInApp(pluginAction),
      }),
    );
    yield put(
      updateActionData(
        [
          {
            entityName: pluginAction.name,
            dataPath: "data",
            data: EMPTY_RESPONSE.body,
          },
        ],
        parentSpan,
      ),
    );
    if (e instanceof UserCancelledActionExecutionError) {
      // Case: user cancelled the request of file upload
      if (filePickerInstrumentation.numberOfFiles > 0) {
        triggerFileUploadInstrumentation(
          filePickerInstrumentation,
          "CANCELLED",
          "499",
          pluginAction.name,
          pluginAction.pluginType,
          "NA",
        );
      }
      throw new UserCancelledActionExecutionError();
    }

    // In case there is no response from server and files are being uploaded
    // we report it as INVALID_RESPONSE. The server didn't send any code or the
    // request was cancelled due to timeout
    if (filePickerInstrumentation.numberOfFiles > 0) {
      triggerFileUploadInstrumentation(
        filePickerInstrumentation,
        "INVALID_RESPONSE",
        "444",
        pluginAction.name,
        pluginAction.pluginType,
        "NA",
      );
    }
    throw new PluginActionExecutionError("Response not valid", false);
  }
}

// Function to send the file upload event to segment
function triggerFileUploadInstrumentation(
  filePickerInfo: Record<string, any>,
  status: string,
  statusCode: string,
  pluginName: string,
  pluginType: string,
  timeTaken: string,
) {
  const { fileSizes, fileTypes, numberOfFiles, totalSize } = filePickerInfo;
  AnalyticsUtil.logEvent("FILE_UPLOAD_COMPLETE", {
    totalSize,
    fileSizes,
    numberOfFiles,
    fileTypes,
    status,
    statusCode,
    pluginName,
    pluginType,
    timeTaken,
  });
}

//Open debugger with response tab selected.
function* openDebugger() {
  yield put(showDebugger(true));
  yield put(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.RESPONSE_TAB));
}

// Function to clear the action responses for the actions which are not executeOnLoad.
function* clearTriggerActionResponse() {
  const currentPageActions: ActionData[] = yield select(getCurrentActions);
  for (const action of currentPageActions) {
    // Clear the action response if the action has data and is not executeOnLoad.
    if (action.data && !action.config.executeOnLoad) {
      yield put(clearActionResponse(action.config.id));
      yield put(
        updateActionData([
          {
            entityName: action.config.name,
            dataPath: "data",
            data: undefined,
          },
        ]),
      );
    }
  }
}

// Function to soft refresh the all the actions on the page.
function* softRefreshActionsSaga() {
  //get current pageId
  const pageId: string = yield select(getCurrentPageId);
  const applicationId: string = yield select(getCurrentApplicationId);
  // Fetch the page data before refreshing the actions.
  yield put(fetchPage(pageId));
  //wait for the page to be fetched.
  yield take([
    ReduxActionErrorTypes.FETCH_PAGE_ERROR,
    ReduxActionTypes.FETCH_PAGE_SUCCESS,
  ]);
  // Clear appsmith store
  yield call(handleStoreOperations, [
    {
      payload: null,
      type: "CLEAR_STORE",
    },
  ]);
  // Clear all the action responses on the page
  yield call(clearTriggerActionResponse);
  //Rerun all the page load actions on the page
  yield call(executePageLoadActionsSaga);
  try {
    // we fork to prevent the call from blocking
    yield put(softRefreshDatasourceStructure());
  } catch (error) {}
  //This will refresh the query editor with the latest datasource structure.
  // TODO: fix typing of matchQueryBuilderPath, it always returns "any" which can lead to bugs
  const isQueryPane = matchQueryBuilderPath(window.location.pathname);
  //This is reuired only when the query editor is open.
  if (isQueryPane) {
    yield put(
      changeQuery({
        id: isQueryPane.params.queryId,
        pageId,
        applicationId,
      }),
    );
  }
  const currentEnvName: string = yield select(getCurrentEnvironmentName);
  toast.show(createMessage(SWITCH_ENVIRONMENT_SUCCESS, currentEnvName), {
    kind: "success",
  });
}

function* handleUpdateActionData(
  action: ReduxAction<updateActionDataPayloadType>,
) {
  const { actionDataPayload, parentSpan } = action.payload;
  yield call(
    evalWorker.request,
    EVAL_WORKER_ACTIONS.UPDATE_ACTION_DATA,
    actionDataPayload,
  );
  endSpan(parentSpan);
}

export function* watchPluginActionExecutionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.RUN_ACTION_REQUEST, runActionSaga),
    takeLatest(
      ReduxActionTypes.RUN_ACTION_SHORTCUT_REQUEST,
      runActionShortcutSaga,
    ),
    takeLatest(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
      executePageLoadActionsSaga,
    ),
    takeLatest(ReduxActionTypes.PLUGIN_SOFT_REFRESH, softRefreshActionsSaga),
    takeEvery(ReduxActionTypes.EXECUTE_JS_UPDATES, makeUpdateJSCollection),
    takeEvery(ReduxActionTypes.UPDATE_ACTION_DATA, handleUpdateActionData),
  ]);
}
