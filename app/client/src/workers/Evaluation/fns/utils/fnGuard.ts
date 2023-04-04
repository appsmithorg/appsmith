import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

export function addFn(
  ctx: any,
  fnName: string,
  fn: (...args: any[]) => any,
  fnGuards = [isAsyncGuard],
) {
  Object.defineProperty(ctx, fnName, {
    value: function (...args: any[]) {
      for (const guard of fnGuards) {
        fn = guard(fn, fnName);
      }
      return fn(...args);
    },
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

export function isAsyncGuard<P extends ReadonlyArray<unknown>>(
  fn: (...args: P) => unknown,
  fnName: string,
) {
  return (...args: P) => {
    if (!self.$isDataField) return fn(...args);
    self["$isAsync"] = true;
    throw new ActionCalledInSyncFieldError(fnName);
  };
}
