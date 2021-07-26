import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";
import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { CopyToClipboardDescription } from "entities/DataTree/actionTriggers";

export default function copySaga(
  payload: CopyToClipboardDescription["payload"],
  event: ExecuteActionPayloadEvent,
) {
  const result = copy(payload.data, payload.options);
  if (event.callback) {
    if (result) {
      AppsmithConsole.info({
        text: `copyToClipboard('${payload.data}') was triggered`,
      });

      event.callback({ success: result });
    }
  }
}
