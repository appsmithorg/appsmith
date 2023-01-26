import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

export function addFn(
  ctx: any,
  fnName: string,
  fn: (...args: any[]) => any,
  propertyDescriptor = {},
  fnGuards = [isAsyncGuard],
) {
  Object.defineProperty(ctx, fnName, {
    value: function(...args: any[]) {
      for (const guard of fnGuards) {
        guard(fn, fnName);
      }
      return fn(...args);
    },
    enumerable: false,
    ...propertyDescriptor,
  });
}

export function isAsyncGuard<P extends ReadonlyArray<unknown>>(
  fn: (...args: P) => unknown,
  fnName: string,
) {
  return (...args: P) => {
    if (self["$allowAsync"]) return fn(...args);
    self["$isAsync"] = true;
    throw new ActionCalledInSyncFieldError(fnName);
  };
}
