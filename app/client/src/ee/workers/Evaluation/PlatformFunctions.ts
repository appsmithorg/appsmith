export * from "ce/workers/Evaluation/PlatformFunctions";

export * from "ce/workers/Evaluation/Actions";

/* eslint-disable @typescript-eslint/ban-types */
import {
  ActionDispatcherWithExecutionType,
  PLATFORM_FUNCTIONS as CE_PLATFORM_FUNCTIONS,
} from "ce/workers/Evaluation/PlatformFunctions";
import { ExecutionType } from "./PlatformFunctions";

export const PLATFORM_FUNCTIONS: Record<
  string,
  ActionDispatcherWithExecutionType
> = {
  ...CE_PLATFORM_FUNCTIONS,
  windowMessageListener: function(origin: string, callback: Function) {
    return {
      type: "WINDOW_MESSAGE_LISTENER",
      payload: {
        acceptedOrigin: origin,
        callbackString: callback.toString(),
      },
      executionType: ExecutionType.TRIGGER,
    };
  },
  unlistenWindowMessage: function(origin: string) {
    return {
      type: "UNLISTEN_WINDOW_MESSAGE",
      payload: {
        origin,
      },
      executionType: ExecutionType.TRIGGER,
    };
  },
};
