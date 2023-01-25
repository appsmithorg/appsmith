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

export function isAsyncGuard(fn: (...args: any[]) => any, fnName: string) {
  if (self["$allowAsync"]) return fn;
  self["$isAsync"] = true;
  throw new ActionCalledInSyncFieldError(fnName);
}
