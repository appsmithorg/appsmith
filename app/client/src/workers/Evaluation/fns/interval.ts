import { createEvaluationContext } from "../evaluate";
import { dataTreeEvaluator } from "../handlers/evalTree";
import ExecutionMetaData from "./utils/ExecutionMetaData";
import { addFn } from "./utils/fnGuard";

const _internalSetInterval = self.setInterval;
const _internalClearInterval = self.clearInterval;

const intervalIdMap = new Map<number | string, number>();

export function clearAllIntervals() {
  intervalIdMap.forEach((intervalId) => _internalClearInterval(intervalId));
  intervalIdMap.clear();
}

export function initIntervalFns(context: typeof globalThis) {
  function clearInterval(intervalId: number | string) {
    const runningIntervalId = intervalIdMap.get(intervalId);
    intervalIdMap.delete(intervalId);
    return _internalClearInterval(runningIntervalId);
  }

  function setInterval(
    callback: (...args: any[]) => void,
    delay = 100,
    ...args: any[]
  ) {
    const metaData = ExecutionMetaData.getExecutionMetaData();
    const runningIntervalId = intervalIdMap.get(args[0]);
    if (runningIntervalId) {
      _internalClearInterval(runningIntervalId);
      intervalIdMap.delete(args[0]);
    }
    const _internalIntervalId = _internalSetInterval(
      (...args: any[]) => {
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
        callback(...args);
      },
      delay,
      ...args,
    );
    const customIntervalId = args[0] || _internalIntervalId;
    intervalIdMap.set(customIntervalId, _internalIntervalId);
    return _internalIntervalId;
  }

  addFn(context, "setInterval", setInterval);
  addFn(context, "clearInterval", clearInterval);
}
