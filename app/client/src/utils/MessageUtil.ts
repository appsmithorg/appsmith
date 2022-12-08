export enum MessageType {
  REQUEST = "REQUEST",
  RESPONSE = "RESPONSE",
}

export type Message<T> = {
  body: T;
  messageId: string;
  messageType: MessageType;
};

export function sendMessage(ctx: Worker | typeof globalThis) {
  return function(message: Message<any>) {
    ctx.postMessage(message);
  };
}
