/**
 * This file contains the utility function to send and receive messages from the worker.
 * TRequestMessage<TBody> is used to send a request to/from the worker.
 * TResponseMessage<TBody> is used to send a response to/from the worker.
 * TDefaultMessage<TBody> is used to send a message to/from worker. Does not expect a response.
 */

export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
  DEFAULT = "DEFAULT",
}

type TRequestMessage<TBody> = {
  body: TBody;
  messageId: string;
  messageType: MessageType.REQUEST;
};

type TResponseMessage<TBody> = {
  body: TBody;
  messageId: string;
  messageType: MessageType.RESPONSE;
};

export type TDefaultMessage<TBody> = {
  messageId?: string;
  body: TBody;
  messageType: MessageType.DEFAULT;
};

export type TMessage<TBody> =
  | TRequestMessage<TBody>
  | TResponseMessage<TBody>
  | TDefaultMessage<TBody>;

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
