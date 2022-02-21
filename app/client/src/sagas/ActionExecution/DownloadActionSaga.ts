import { getType, Types } from "utils/TypeHelpers";
import downloadjs from "downloadjs";
import AppsmithConsole from "utils/AppsmithConsole";
import Axios from "axios";
import {
  ActionTriggerType,
  DownloadActionDescription,
} from "entities/DataTree/actionTriggers";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { isBase64String, isUrlString } from "./downloadActionUtils";

export default async function downloadSaga(
  action: DownloadActionDescription["payload"],
) {
  const { data, name, type } = action;
  if (!name) {
    throw new ActionValidationError(
      ActionTriggerType.DOWNLOAD,
      "name",
      Types.STRING,
      getType(name),
    );
  }
  const dataType = getType(data);
  if (dataType === Types.ARRAY || dataType === Types.OBJECT) {
    const jsonString = JSON.stringify(data, null, 2);
    downloadjs(jsonString, name, type);
    AppsmithConsole.info({
      text: `download('${jsonString}', '${name}', '${type}') was triggered`,
    });
  } else if (isUrlString(data)) {
    // In the event that a url string is supplied, we need to fetch the image with the response type arraybuffer.
    // This also covers the case where the file to be downloaded is Binary.
    Axios.get(data, { responseType: "arraybuffer" }).then((res) => {
      downloadjs(res.data, name, type);
      AppsmithConsole.info({
        text: `download('${data}', '${name}', '${type}') was triggered`,
      });
    });
  } else if (isBase64String(data)) {
    Axios.get(`data:${type};base64,${data}`, {
      responseType: "arraybuffer",
    }).then((res) => {
      downloadjs(res.data, name, type);
      AppsmithConsole.info({
        text: `download('${data}', '${name}', '${type}') was triggered`,
      });
    });
  } else {
    downloadjs(data, name, type);
    AppsmithConsole.info({
      text: `download('${data}', '${name}', '${type}') was triggered`,
    });
  }
}
