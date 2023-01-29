import { createEvaluationContext } from "../evaluate";
import { dataTreeEvaluator } from "../handlers/evalTree";
import ExecutionMetaData from "./utils/ExecutionMetaData";
import { addFn } from "./utils/fnGuard";

const _internalSetTimeout = self.setTimeout;
const _internalClearTimeout = self.clearTimeout;

export default function initTimeoutFns() {
  function setTimeout(cb: (...args: any) => any, delay: number, ...args: any) {
    const metaData = ExecutionMetaData.getExecutionMetaData();
    return _internalSetTimeout(
      function(...args: any) {
        const evalContext = createEvaluationContext({
          dataTree: dataTreeEvaluator?.evalTree || {},
          resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
          isTriggerBased: true,
        });
        self["$allowAsync"] = true;
        Object.assign(self, evalContext);
        ExecutionMetaData.setExecutionMetaData(
          metaData.triggerMeta,
          metaData.eventType,
        );
        cb(...args);
      },
      delay,
      ...args,
    );
  }

  function clearTimeout(timerId: number) {
    return _internalClearTimeout(timerId);
  }

  addFn(self, "setTimeout", setTimeout);
  addFn(self, "clearTimeout", clearTimeout);
}
