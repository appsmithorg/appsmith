export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
}

export type Message<T> = {
  body: T;
  messageId: string;
  messageType: MessageType;
};

/** Avoid from using postMessage directly.
 * This function should be used to send messages to the worker and back.
 * Purpose: To have some standardization in the messages that are transferred.
 */
export function sendMessage(
  this: Worker | typeof globalThis,
  message: Message<unknown>,
  options?: WindowPostMessageOptions,
) {
  this.postMessage(message, options);
}
