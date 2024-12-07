import copy from "copy-to-clipboard";
import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type { TCopyToClipboardDescription } from "workers/Evaluation/fns/copyToClipboard";
import type { SourceEntity } from "../../entities/AppsmithConsole";

export default function copySaga(
  action: TCopyToClipboardDescription,
  source?: SourceEntity,
) {
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
      source,
      text: `copyToClipboard triggered`,
      state: {
        data: payload.data,
        options: payload.options,
      },
    });
  }
}
