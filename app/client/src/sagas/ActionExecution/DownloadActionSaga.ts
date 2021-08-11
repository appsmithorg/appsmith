import { Toaster } from "components/ads/Toast";
import { createMessage, ERROR_WIDGET_DOWNLOAD } from "constants/messages";
import { Variant } from "components/ads/common";
import { getType, isURL, Types } from "utils/TypeHelpers";
import downloadjs from "downloadjs";
import AppsmithConsole from "utils/AppsmithConsole";
import Axios from "axios";
import { DownloadActionDescription } from "entities/DataTree/actionTriggers";
import { TriggerFailureError } from "sagas/ActionExecution/PromiseActionSaga";

const displayWidgetDownloadError = (message: string) => {
  return Toaster.show({
    text: createMessage(ERROR_WIDGET_DOWNLOAD, message),
    variant: Variant.danger,
  });
};

export default async function downloadSaga(
  action: DownloadActionDescription["payload"],
) {
  const { data, name, type } = action;
  if (!name) {
    displayWidgetDownloadError("File name was not provided");
    throw new TriggerFailureError("File name was not provided");
  }
  const dataType = getType(data);
  if (dataType === Types.ARRAY || dataType === Types.OBJECT) {
    const jsonString = JSON.stringify(data, null, 2);
    downloadjs(jsonString, name, type);
    AppsmithConsole.info({
      text: `download('${jsonString}', '${name}', '${type}') was triggered`,
    });
  } else if (dataType === Types.STRING && isURL(data)) {
    // In the event that a url string is supplied, we need to fetch the image with the response type arraybuffer.
    // This also covers the case where the file to be downloaded is Binary.
    Axios.get(data, { responseType: "arraybuffer" }).then((res) => {
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
