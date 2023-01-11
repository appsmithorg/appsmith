import { klona } from "klona/lite";
import { createEvaluationContext, setupMetadata } from "../evaluate";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { addFn } from "./utils/fnGuard";

export const _internalSetTimeout = self.setTimeout;
export const _internalClearTimeout = self.clearTimeout;

export default function initTimeoutFns() {
  function setTimeout(cb: (...args: any) => any, delay: number, ...args: any) {
    const metaData = klona(self["$metaData"]);
    return _internalSetTimeout(
      function(...args: any) {
        const evalContext = createEvaluationContext({
          dataTree: dataTreeEvaluator?.evalTree || {},
          resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
          isTriggerBased: true,
        });
        self.ALLOW_ASYNC = true;
        Object.assign(self, evalContext);
        setupMetadata(metaData);
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
