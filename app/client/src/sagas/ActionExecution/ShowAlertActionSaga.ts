import { ToastTypeOptions, Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  ActionTriggerType,
  ShowAlertActionDescription,
} from "entities/DataTree/actionTriggers";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";

export default function* showAlertSaga(
  payload: ShowAlertActionDescription["payload"],
) {
  if (typeof payload.message !== "string") {
    throw new ActionValidationError(
      ActionTriggerType.SHOW_ALERT,
      "message",
      Types.STRING,
      getType(payload.message),
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
      `Toast type needs to be a one of ${Object.values(ToastTypeOptions).join(
        ", ",
      )}`,
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
