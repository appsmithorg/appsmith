import ExecutionMetaData from "workers/Evaluation/fns/utils/ExecutionMetaData";
import TriggerEmitter, {
  BatchKey,
} from "workers/Evaluation/fns/utils/TriggerEmitter";

function windowMessageListenerDescriptor(
  origin: string,
  callback: (...args: any[]) => any,
) {
  return {
    type: "WINDOW_MESSAGE_LISTENER" as const,
    payload: {
      acceptedOrigin: origin,
      callbackString: callback.toString(),
    },
  };
}

function unlistenWindowMessageDescriptor(origin: string) {
  return {
    type: "UNLISTEN_WINDOW_MESSAGE" as const,
    payload: {
      origin,
    },
  };
}

export type TWindowMessageListenerArgs = Parameters<
  typeof windowMessageListenerDescriptor
>;
export type TWindowMessageListenerDescription = ReturnType<
  typeof windowMessageListenerDescriptor
>;
export type TWindowMessageListenerType = TWindowMessageListenerDescription["type"];

export type TUnlistenWindowMessageArgs = Parameters<
  typeof unlistenWindowMessageDescriptor
>;
export type TUnlistenWindowMessageDescription = ReturnType<
  typeof unlistenWindowMessageDescriptor
>;
export type TUnlistenWindowMessageType = TUnlistenWindowMessageDescription["type"];

export function windowMessageListener(...args: TWindowMessageListenerArgs) {
  const metaData = ExecutionMetaData.getExecutionMetaData();
  TriggerEmitter.emit(BatchKey.process_batched_triggers, {
    trigger: windowMessageListenerDescriptor(...args),
    ...metaData,
  });
}

export function unlistenWindowMessage(...args: TUnlistenWindowMessageArgs) {
  const metaData = ExecutionMetaData.getExecutionMetaData();
  TriggerEmitter.emit(BatchKey.process_batched_triggers, {
    trigger: unlistenWindowMessageDescriptor(...args),
    ...metaData,
  });
}
