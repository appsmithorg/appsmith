import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { CopyToClipboardDescription } from "entities/DataTree/actionTriggers";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";

export default function copySaga(
  payload: CopyToClipboardDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  if (typeof payload.data !== "string") {
    throw new TriggerFailureError("Value to copy is not a string", triggerMeta);
  }
  const result = copy(payload.data, payload.options);
  if (result) {
    AppsmithConsole.info({
      text: `copyToClipboard('${payload.data}') was triggered`,
    });
  }
}
