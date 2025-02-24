import { put } from "redux-saga/effects";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import type { ActionExecutionResponse, ActionResponse } from "api/ActionAPI";
import type { Plugin } from "entities/Plugin";
import { RESP_HEADER_DATATYPE } from "constants/AppsmithActionConstants/ActionConstants";
import { getType, Types } from "utils/TypeHelpers";

enum ActionResponseDataTypes {
  BINARY = "BINARY",
}

export function* setDefaultActionDisplayFormat(
  actionId: string,
  plugin: Plugin | undefined,
  payload: ActionResponse,
) {
  if (!!plugin && payload?.dataTypes?.length > 0) {
    const responseType = payload?.dataTypes.find(
      (type) => plugin?.responseType && type.dataType === plugin?.responseType,
    );

    yield put(
      setActionResponseDisplayFormat({
        id: actionId,
        field: "responseDisplayFormat",
        value: responseType
          ? responseType?.dataType
          : payload?.dataTypes[0]?.dataType,
      }),
    );
  }
}

export const createActionExecutionResponse = (
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
