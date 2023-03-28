import AppsmithConsole from "utils/AppsmithConsole";
import { ActionValidationError } from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import { toast } from "design-system";
import type { TShowAlertDescription } from "workers/Evaluation/fns/showAlert";

export default function* showAlertSaga(action: TShowAlertDescription) {
  const { payload } = action;
  if (typeof payload.message !== "string") {
    throw new ActionValidationError(
      "SHOW_ALERT",
      "message",
      Types.STRING,
      getType(payload.message),
    );
  }
  let kind: "success" | "info" | "warning" | "error" | undefined = undefined;
  switch (payload.style) {
    case "info":
      kind = "info";
      break;
    case "success":
      kind = "success";
      break;
    case "warning":
      kind = "warning";
      break;
    case "error":
      kind = "error";
      break;
  }
  toast.show(payload.message, {
    kind: kind,
  });
  AppsmithConsole.info({
    text: payload.style
      ? `showAlert('${payload.message}', '${payload.style}') was triggered`
      : `showAlert('${payload.message}') was triggered`,
  });
}
