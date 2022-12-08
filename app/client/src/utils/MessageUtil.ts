export enum TMessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
}

export type TMessage<TBody> = {
  body: TBody;
  messageId: string;
  messageType: TMessageType;
};

/** Avoid from using postMessage directly.
 * This function should be used to send messages to the worker and back.
 * Purpose: To have some standardization in the messages that are transferred.
 */
export function sendMessage(
  this: Worker | typeof globalThis,
  message: TMessage<unknown>,
  options?: WindowPostMessageOptions,
) {
  this.postMessage(message, options);
}
