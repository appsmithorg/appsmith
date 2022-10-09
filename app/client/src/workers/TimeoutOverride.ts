import { createGlobalData } from "./evaluate";
import { dataTreeEvaluator } from "./evaluation.worker";

const _internalSetTimeout = self.setTimeout;
const _internalClearTimeout = self.clearTimeout;

export default function overrideTimeout() {
  Object.defineProperty(self, "setTimeout", {
    writable: true,
    configurable: true,
    value: function(cb: (...args: any) => any, delay: number, ...args: any) {
      if (self.dryRun) {
        self.dryRun = false;
        return;
      }
      if (!dataTreeEvaluator) return;
      const globalData = createGlobalData({
        dataTree: dataTreeEvaluator.evalTree,
        resolvedFunctions: dataTreeEvaluator.resolvedFunctions,
        isTriggerBased: true,
      });
      return (function(globalData) {
        return _internalSetTimeout(
          function(...args: any) {
            self.ALLOW_ASYNC = true;
            Object.assign(self, globalData);
            cb(...args);
          },
          delay,
          ...args,
        );
      })(globalData);
    },
  });

  Object.defineProperty(self, "clearTimeout", {
    writable: true,
    configurable: true,
    value: function(timerId: number) {
      return _internalClearTimeout(timerId);
    },
  });
}
