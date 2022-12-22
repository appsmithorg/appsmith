import { createGlobalData } from "./evaluate";
import { dataTreeEvaluator } from "./handlers/evalTree";

export const _internalSetTimeout = self.setTimeout;
export const _internalClearTimeout = self.clearTimeout;

export default function overrideTimeout() {
  Object.defineProperty(self, "setTimeout", {
    writable: true,
    configurable: true,
    value: function(cb: (...args: any) => any, delay: number, ...args: any) {
      if (!self.ALLOW_ASYNC) {
        self.IS_ASYNC = true;
        throw new Error("Async function called in a sync field");
      }
      const globalData = createGlobalData({
        dataTree: dataTreeEvaluator?.evalTree || {},
        resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
        isTriggerBased: true,
      });
      return _internalSetTimeout(
        function(...args: any) {
          self.ALLOW_ASYNC = true;
          Object.assign(self, globalData);
          cb(...args);
        },
        delay,
        ...args,
      );
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
