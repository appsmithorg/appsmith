export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
}

export type TMessage<TBody> = {
  body: TBody;
  messageId: string;
  messageType: MessageType;
};

/** Avoid from using postMessage directly.
 * This function should be used to send messages to the worker and back.
 * Purpose: To have some standardization in the messages that are transferred.
 * TODO: Add support for window postMessage options
 * TODO: Add support for transferable objects.
 */
export function sendMessage(
  this: Worker | typeof globalThis,
  message: TMessage<unknown>,
) {
  this.postMessage(message);
}
