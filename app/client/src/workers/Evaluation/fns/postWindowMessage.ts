import { BatchKey } from "./utils/TriggerEmitter";
import { batchedFn } from "./utils/batchedFn";

function postWindowMessageFnDescriptor(
  message: unknown,
  source: string,
  targetOrigin: string,
) {
  return {
    type: "POST_MESSAGE",
    payload: {
      message,
      source,
      targetOrigin,
    },
  };
}

const postWindowMessage = batchedFn(
  postWindowMessageFnDescriptor,
  BatchKey.process_batched_triggers,
);

export default postWindowMessage;
