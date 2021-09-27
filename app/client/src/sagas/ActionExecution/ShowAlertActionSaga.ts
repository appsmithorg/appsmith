import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import AppsmithConsole from "utils/AppsmithConsole";
import { ShowAlertActionDescription } from "entities/DataTree/actionTriggers";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";

export default function* showAlertSaga(
  payload: ShowAlertActionDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  if (typeof payload.message !== "string") {
    throw new TriggerFailureError(
      "Toast message needs to be a string",
      triggerMeta,
    );
  }
  let variant;
  switch (payload.style) {
    case "info":
      variant = Variant.info;
      break;
    case "success":
      variant = Variant.success;
      break;
    case "warning":
      variant = Variant.warning;
      break;
    case "error":
      variant = Variant.danger;
      break;
  }
  if (payload.style && !variant) {
    throw new TriggerFailureError(
      `Toast type needs to be a one of ${Object.values(Variant).join(", ")}`,
      triggerMeta,
    );
  }
  Toaster.show({
    text: payload.message,
    variant: variant,
  });
  AppsmithConsole.info({
    text: payload.style
      ? `showAlert('${payload.message}', '${payload.style}') was triggered`
      : `showAlert('${payload.message}') was triggered`,
  });
}
