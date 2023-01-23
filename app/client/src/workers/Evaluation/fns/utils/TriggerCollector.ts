import { MessageType, sendMessage } from "utils/MessageUtil";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
export class TriggerCollector {
  private triggers: unknown[] = [];
  constructor(private requestType: keyof typeof MAIN_THREAD_ACTION) {}
  collect = (trigger: unknown) => {
    if (this.triggers.length === 0) {
      queueMicrotask(() => {
        sendMessage.call(self, {
          messageType: MessageType.DEFAULT,
          body: {
            method: this.requestType,
            data: this.triggers,
          },
        });
        this.triggers = [];
      });
    }
    this.triggers.push(trigger);
  };
}
