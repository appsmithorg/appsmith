import { put } from "redux-saga/effects";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { ActionResponse } from "api/ActionAPI";
import { Plugin } from "api/PluginApi";

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
