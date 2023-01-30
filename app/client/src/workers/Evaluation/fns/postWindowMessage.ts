import { BatchKey } from "./utils/TriggerEmitter";
import { batchedFn } from "./utils/batchedFn";

function postWindowMessageFnDescriptor(
  message: unknown,
  source: string,
  targetOrigin: string,
) {
  return {
    type: "POST_MESSAGE" as const,
    payload: {
      message,
      source,
      targetOrigin,
    },
  };
}
export type TPostWindowMessageArgs = Parameters<
  typeof postWindowMessageFnDescriptor
>;
export type TPostWindowMessageDescription = ReturnType<
  typeof postWindowMessageFnDescriptor
>;

export default function postWindowMessage(...args: TPostWindowMessageArgs) {
  return batchedFn(
    postWindowMessageFnDescriptor,
    BatchKey.process_batched_triggers,
  )(...args);
}
