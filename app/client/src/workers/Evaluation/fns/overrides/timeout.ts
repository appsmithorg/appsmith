import { createEvaluationContext } from "../../evaluate";
import { dataTreeEvaluator } from "../../handlers/evalTree";
import ExecutionMetaData from "../utils/ExecutionMetaData";

const _internalSetTimeout = self.setTimeout;
const _internalClearTimeout = self.clearTimeout;

function setTimeout(cb: (...args: any) => any, delay: number, ...args: any) {
  const metaData = ExecutionMetaData.getExecutionMetaData();
  return _internalSetTimeout(
    function (...args: any) {
      const evalContext = createEvaluationContext({
        dataTree: dataTreeEvaluator?.evalTree || {},
        resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
        isTriggerBased: true,
      });
      self["$isDataField"] = false;
      Object.assign(self, evalContext);
      ExecutionMetaData.setExecutionMetaData(
        metaData.triggerMeta,
        metaData.eventType,
      );
      typeof cb === "function" && cb(...args);
    },
    delay,
    ...args,
  );
}

function clearTimeout(timerId: number) {
  return _internalClearTimeout(timerId);
}

export { setTimeout, clearTimeout };
