import { AppsmithPromisePayload } from "workers/Actions";
import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";

export default function* executePromiseSaga(
  trigger: AppsmithPromisePayload,
  event: ExecuteActionPayloadEvent,
) {
  // DO something here
  console.log({ trigger });
  if (event.callback) {
    event.callback({ success: true });
  }
}
