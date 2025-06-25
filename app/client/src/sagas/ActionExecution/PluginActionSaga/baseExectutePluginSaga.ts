import {
  executePluginActionRequest,
  executePluginActionSuccess,
  updateActionData,
} from "actions/pluginActionActions";
import { call, delay, put, select } from "redux-saga/effects";

import { objectKeys } from "@appsmith/utils";
import type {
  ActionExecutionResponse,
  ActionResponse,
  ExecuteActionRequest,
  PaginationField,
} from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import { EMPTY_RESPONSE } from "components/editorComponents/emptyResponse";
import { FILE_SIZE_LIMIT_FOR_BLOBS } from "constants/WidgetConstants";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "ee/constants/ApiConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { getPlugin } from "ee/selectors/entitiesSelector";
import { getPluginActionNameToDisplay } from "ee/utils/actionExecutionUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getIsActionCreatedInApp } from "ee/utils/getIsActionCreatedInApp";
import {
  findDatatype,
  isTrueObject,
} from "ee/workers/Evaluation/evaluationUtils";
import type { Action } from "entities/Action";
import { APP_MODE } from "entities/App";
import { type Plugin } from "entities/Plugin";
import { setAttributesToSpan } from "instrumentation/generateTraces";
import type { Span } from "instrumentation/types";
import {
  find,
  get,
  isArray,
  isArrayBuffer,
  isEmpty,
  isNil,
  set,
  unset,
  zipObject,
} from "lodash";
import log from "loglevel";
import type { DefaultRootState } from "react-redux";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import {
  PluginActionExecutionError,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";
import { validateResponse } from "sagas/ErrorSagas";
import { evaluateActionBindings } from "sagas/EvaluationsSaga";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { isBlobUrl, parseBlobUrl } from "utils/AppsmithUtils";
import { shouldBeDefined } from "utils/helpers";
import { FileDataTypes } from "WidgetProvider/types";
import {
  createActionExecutionResponse,
  setDefaultActionDisplayFormat,
} from "../PluginActionSagaUtils";

export interface ExecutePluginActionResponse {
  payload: ActionResponse;
  isError: boolean;
}

interface FilePickerInstumentationObject {
  numberOfFiles: number;
  totalSize: number;
  fileTypes: Array<string>;
  fileSizes: Array<number>;
}

const isErrorResponse = (response: ActionExecutionResponse) => {
  return !response.data.isExecutionSuccess;
};

/**
 *
 * @param blobUrl string A blob url with type added a query param
 * @returns promise that resolves to file content
 */
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Function to send the file upload event to segment
function triggerFileUploadInstrumentation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * This function resolves :
 * - individual objects containing blob urls
 * - blob urls directly
 * - else returns the value unchanged
 * - finds datatype of evaluated value
 * - binds dataype to payload
 *
 * @param value
 * @param executeActionRequest
 * @param index
 * @param isArray
 * @param arrDatatype
 */

function* resolvingBlobUrls(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    objectKeys(value).forEach((propertyName) => {
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/*
 * This saga handles the complete plugin action execution flow. It will respond with a
 * payload and isError property which indicates if the response is of an error type.
 * In case of the execution was not completed, it will throw errors of type
 * PluginActionExecutionError which needs to be handled by any saga that calls this.
 * */
export function* executePluginActionSaga(
  pluginAction: Action,
  paginationField?: PaginationField,
  params?: Record<string, unknown>,
  isUserInitiated?: boolean,
  parentSpan?: Span,
) {
  const actionId = pluginAction.id;
  const baseActionId = pluginAction.baseId;
  const pluginActionNameToDisplay = getPluginActionNameToDisplay(pluginAction);

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

  const evaluatedBindings: Record<string, unknown> = yield call(
    evaluateActionParams,
    pluginAction.jsonPathKeys,
    formData,
    executeActionRequest,
    filePickerInstrumentation,
    params,
  );

  AppsmithConsole.info({
    text: "Began execution",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: pluginAction.name,
      id: actionId,
    },
    state: { requestParams: { ...params, ...evaluatedBindings } },
  });

  let payload = EMPTY_RESPONSE;
  let response: ActionExecutionResponse;

  try {
    response = yield ActionAPI.executeAction(formData, timeout);

    const isError = isErrorResponse(response);

    yield validateResponse(response);
    payload = createActionExecutionResponse(response);

    yield put(
      executePluginActionSuccess({
        id: actionId,
        baseId: baseActionId,
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        baseId: baseActionId,
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

export const getActionTimeout = (
  state: DefaultRootState,
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
 * @param formData
 * @param executeActionRequest
 * @param filePickerInstrumentation
 * @param executionParams
 */
function* evaluateActionParams(
  bindings: string[] | undefined,
  formData: FormData,
  executeActionRequest: ExecuteActionRequest,
  filePickerInstrumentation: FilePickerInstumentationObject,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const evaluatedParams = zipObject(bindings, values);

  // Maintain a blob data map to resolve blob urls of large files as array buffer
  const blobDataMap: Record<string, Blob> = {};

  // if json bindings have filepicker reference, we need to init the instrumentation object
  // which we will send post execution
  const recordFilePickerInstrumentation = bindings.some((binding) =>
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

      const BATCH_CHUNK_SIZE = 100;

      for (let j = 0; j < value.length; j++) {
        const val = value[j];
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          evaluatedParams[key] = "blob";
        }

        tempArr.push(newVal);

        if (key.includes(".files") && recordFilePickerInstrumentation) {
          filePickerInstrumentation["numberOfFiles"] += 1;
          const { size, type } = newVal;

          filePickerInstrumentation["totalSize"] += size;
          filePickerInstrumentation["fileSizes"].push(size);
          filePickerInstrumentation["fileTypes"].push(type);
          evaluatedParams[key] = "file";
        }

        if ((j + 1) % BATCH_CHUNK_SIZE === 0) {
          // Yield control back to the event loop and empty the stack trace
          yield delay(0);
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
        evaluatedParams[key] = "file";
      }
    }

    if (typeof value === "object") {
      // This is used in cases of large files, we store the bloburls with the path they were set in
      // This helps in creating a unique map of blob urls to blob data when passing to the server
      if (!!value && value.hasOwnProperty("blobUrlPaths")) {
        updateBlobDataFromUrls(value.blobUrlPaths, value, blobMap, blobDataMap);
        unset(value, "blobUrlPaths");
        evaluatedParams[key] = "blob";
      }

      // Handle null values separately to avoid stringifying them
      if (value === null) {
        value = null;
        evaluatedParams[key] = null;
      } else {
        value = JSON.stringify(value);
        evaluatedParams[key] = value;
      }
    }

    // If there are no blob urls in the value, we can directly add it to the formData
    // If there are blob urls, we need to add them to the blobDataMap
    if (!useBlobMaps) {
      // Handle null values separately to avoid creating a Blob with "null" string
      if (value === null) {
        value = null;
      } else {
        value = new Blob([value], { type: "text/plain" });
      }
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

  return evaluatedParams;
}
