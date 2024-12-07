import { getType, Types } from "utils/TypeHelpers";
import downloadjs from "downloadjs";
import AppsmithConsole from "utils/AppsmithConsole";
import Axios from "axios";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";
import { isBase64String, isUrlString } from "./downloadActionUtils";
import { isBlobUrl } from "utils/AppsmithUtils";
import type { TDownloadDescription } from "workers/Evaluation/fns/download";
import type { SourceEntity } from "../../entities/AppsmithConsole";

function downloadBlobURL(url: string, name: string) {
  const ele = document.createElement("a");

  ele.href = url;
  ele.download = name;
  ele.style.display = "none";
  document.body.appendChild(ele);
  ele.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(ele);
  });
}

export default async function downloadSaga(
  action: TDownloadDescription,
  source?: SourceEntity,
) {
  const { payload } = action;
  const { data, name, type } = payload;

  if (!name) {
    throw new TriggerFailureError("Please enter a file name");
  }

  if (isBlobUrl(data)) {
    downloadBlobURL(data, name);
    AppsmithConsole.info({
      source,
      text: `download triggered`,
      state: {
        data: "blob",
        name,
        type,
      },
    });

    return;
  }

  const dataType = getType(data);

  if (dataType === Types.ARRAY || dataType === Types.OBJECT) {
    const jsonString = JSON.stringify(data, null, 2);

    downloadjs(jsonString, name, type);
    AppsmithConsole.info({
      source,
      text: `download triggered`,
      state: {
        data: jsonString,
        name,
        type,
      },
    });
  } else if (isUrlString(data)) {
    // In the event that a url string is supplied, we need to fetch the image with the response type arraybuffer.
    // This also covers the case where the file to be downloaded is Binary.
    Axios.get(data, { responseType: "arraybuffer" }).then((res) => {
      downloadjs(res.data, name, type);
      AppsmithConsole.info({
        source,
        text: `download triggered`,
        state: {
          data: "file",
          name,
          type,
        },
      });
    });
  } else if (isBase64String(data)) {
    Axios.get(`data:${type};base64,${data}`, {
      responseType: "arraybuffer",
    }).then((res) => {
      downloadjs(res.data, name, type);
      AppsmithConsole.info({
        source,
        text: `download triggered`,
        state: {
          data: "file",
          name,
          type,
        },
      });
    });
  } else {
    downloadjs(data, name, type);
    AppsmithConsole.info({
      source,
      text: `download triggered`,
      state: {
        data,
        name,
        type,
      },
    });
  }
}
