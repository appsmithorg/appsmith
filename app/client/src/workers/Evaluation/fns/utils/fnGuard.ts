import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

export function addFn(
  ctx: typeof globalThis,
  fnName: string,
  fn: (...args: any[]) => any,
  fnGuards = [isAsyncGuard],
) {
  Object.defineProperty(ctx, fnName, {
    value: function(...args: any[]) {
      for (const guard of fnGuards) {
        guard(fn, fnName);
      }
      return fn(...args);
    },
    configurable: true,
    writable: true,
    enumerable: false,
  });
}

export function isAsyncGuard(_: (...args: any[]) => any, fnName: string) {
  if (!self.ALLOW_SYNC) return;
  self.IS_SYNC = false;
  throw new ActionCalledInSyncFieldError(fnName);
}
