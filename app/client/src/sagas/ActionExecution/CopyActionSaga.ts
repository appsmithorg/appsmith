import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { CopyToClipboardDescription } from "entities/DataTree/actionTriggers";
import { TriggerFailureError } from "sagas/ActionExecution/PromiseActionSaga";

export default function copySaga(
  payload: CopyToClipboardDescription["payload"],
) {
  if (typeof payload.data !== "string") {
    throw new TriggerFailureError("Value to copy is not a string");
  }
  const result = copy(payload.data, payload.options);
  if (result) {
    AppsmithConsole.info({
      text: `copyToClipboard('${payload.data}') was triggered`,
    });
  }
}
