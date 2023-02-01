export * from "ce/workers/Evaluation/JSObject/postJSFunctionExecution";

import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { MessageType, sendMessage } from "utils/MessageUtil";

export function postJSFunctionExecutionLog(fullName: string) {
  sendMessage.call(self, {
    messageType: MessageType.DEFAULT,
    body: {
      data: {
        fullPath: fullName,
      },
      method: MAIN_THREAD_ACTION.LOG_JS_FUNCTION_EXECUTION,
    },
  });
}
