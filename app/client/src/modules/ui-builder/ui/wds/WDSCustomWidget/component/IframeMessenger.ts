import type { IframeMessage } from "../types";
import { EVENTS } from "./customWidgetscript";

export class IframeMessenger {
  private iframe: HTMLIFrameElement;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  handleMessage = (
    event: MessageEvent,
    handlers: Record<string, (data: Record<string, unknown>) => void>,
  ) => {
    const iframeWindow =
      this.iframe.contentWindow || this.iframe.contentDocument?.defaultView;

    // Without this check, malicious scripts from other windows could inject
    // unauthorized messages into our application, potentially leading to data
    // breaches or unauthorized state modifications
    if (event.source !== iframeWindow) return;

    // We send an acknowledgement message for every event to ensure reliable communication
    // between the parent window and iframe. This helps in maintaining message ordering
    // and preventing race conditions.
    this.acknowledgeMessage(event.data);

    const handler = handlers[event.data.type];

    if (handler) {
      handler(event.data.data);
    }
  };

  private acknowledgeMessage(message: IframeMessage) {
    this.postMessage({
      type: EVENTS.CUSTOM_WIDGET_MESSAGE_RECEIVED_ACK,
      key: message.key,
      success: true,
    });
  }

  postMessage(message: IframeMessage) {
    this.iframe.contentWindow?.postMessage(message, "*");
  }
}
