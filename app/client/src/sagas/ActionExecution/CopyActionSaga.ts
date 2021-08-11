import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { CopyToClipboardDescription } from "entities/DataTree/actionTriggers";

export default function copySaga(
  payload: CopyToClipboardDescription["payload"],
) {
  const result = copy(payload.data, payload.options);
  if (result) {
    AppsmithConsole.info({
      text: `copyToClipboard('${payload.data}') was triggered`,
    });
  }
}
