import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type { TCopyToClipboardDescription } from "workers/Evaluation/fns/copyToClipboard";

export default function copySaga(action: TCopyToClipboardDescription) {
  const { payload } = action;

  if (typeof payload.data !== "string") {
    throw new ActionValidationError(
      "COPY_TO_CLIPBOARD",
      "data",
      Types.STRING,
      getType(payload.data),
    );
  }

  const result = copy(payload.data, payload.options);

  if (result) {
    AppsmithConsole.info({
      text: `copyToClipboard('${payload.data}') was triggered`,
    });
  }
}
