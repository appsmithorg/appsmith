import { ActionCalledInSyncFieldError } from "../errorModifier";
import { createEvaluationContext } from "../evaluate";
import { dataTreeEvaluator } from "../handlers/evalTree";

export const _internalSetTimeout = self.setTimeout;
export const _internalClearTimeout = self.clearTimeout;

export default function overrideTimeout() {
  Object.defineProperty(self, "setTimeout", {
    writable: true,
    configurable: true,
    value: function(cb: (...args: any) => any, delay: number, ...args: any) {
      if (self.ALLOW_SYNC) {
        self.IS_SYNC = false;
        throw new ActionCalledInSyncFieldError("setTimeout");
      }
      const evalContext = createEvaluationContext({
        dataTree: dataTreeEvaluator?.evalTree || {},
        resolvedFunctions: dataTreeEvaluator?.resolvedFunctions || {},
        isTriggerBased: true,
      });
      return _internalSetTimeout(
        function(...args: any) {
          self.ALLOW_SYNC = false;
          Object.assign(self, evalContext);
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
      if (self.ALLOW_SYNC) {
        self.IS_SYNC = false;
        throw new ActionCalledInSyncFieldError("clearTimeout");
      }
      return _internalClearTimeout(timerId);
    },
  });
}
