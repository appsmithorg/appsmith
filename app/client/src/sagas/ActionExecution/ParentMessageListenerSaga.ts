import { ParentMessageListenerDescription } from "entities/DataTree/actionTriggers";

export function listenToParentMessages(
  actionPayload: ParentMessageListenerDescription["payload"],
) {
  const messageHandler = (ev: Event) => {
    const event = ev as MessageEvent;
    const src = event.source as Window;

    if (event.type !== "message") return;
    if (src.location.origin !== actionPayload.acceptedOrigin) return;

    actionPayload.callback();
  };

  window.addEventListener("messages", messageHandler);
  return () => window.removeEventListener("messages", messageHandler);
}
