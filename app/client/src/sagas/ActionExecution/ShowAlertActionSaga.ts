import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import AppsmithConsole from "utils/AppsmithConsole";
import { ShowAlertActionDescription } from "entities/DataTree/actionTriggers";

export default function* showAlertSaga(
  payload: ShowAlertActionDescription["payload"],
  event: ExecuteActionPayloadEvent,
) {
  if (typeof payload.message !== "string") {
    console.error("Toast message needs to be a string");
    if (event.callback) event.callback({ success: false });
    return;
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
    console.error(
      "Toast type needs to be a one of " + Object.values(Variant).join(", "),
    );
    if (event.callback) event.callback({ success: false });
    return;
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
  if (event.callback) event.callback({ success: true });
}
