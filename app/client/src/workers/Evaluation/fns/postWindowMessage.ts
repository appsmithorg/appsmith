import ExecutionMetaData from "./utils/ExecutionMetaData";
import TriggerEmitter, { BatchKey } from "./utils/TriggerEmitter";

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
export type TPostWindowMessageActionType =
  TPostWindowMessageDescription["type"];

export default function postWindowMessage(...args: TPostWindowMessageArgs) {
  const metaData = ExecutionMetaData.getExecutionMetaData();

  TriggerEmitter.emit(BatchKey.process_batched_triggers, {
    trigger: postWindowMessageFnDescriptor(...args),
    ...metaData,
  });
}
