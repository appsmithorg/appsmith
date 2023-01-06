import { createEvaluationContext } from "../evaluate";
import { dataTreeEvaluator } from "../handlers/evalTree";
import { addFn } from "./utils/fnGuard";

export const _internalSetTimeout = self.setTimeout;
export const _internalClearTimeout = self.clearTimeout;

export default function initTimeoutFns() {
  function setTimeout(cb: (...args: any) => any, delay: number, ...args: any) {
    const evalContext = createEvaluationContext({
      dataTree: dataTreeEvaluator?.evalTree || {},
      resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
      isTriggerBased: true,
    });
    return _internalSetTimeout(
      function(...args: any) {
        self.ALLOW_ASYNC = true;
        Object.assign(self, evalContext);
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
