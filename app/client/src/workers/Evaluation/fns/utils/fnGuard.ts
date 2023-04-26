import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

export function addFn(
  ctx: any,
  fnName: string,
  fn: (...args: any[]) => any,
  fnGuards = [isAsyncGuard],
) {
  Object.defineProperty(ctx, fnName, {
    value: function (...args: any[]) {
      const fnWithGaurds = getFnWithGaurds(fn, fnName, fnGuards);
      return fnWithGaurds(...args);
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
  if (self.$isDataField) {
    self["$isAsync"] = true;
    throw new ActionCalledInSyncFieldError(fnName);
  }
}

type FnGaurd = (fn: (...args: any[]) => unknown, fnName: string) => unknown;

export function getFnWithGaurds(
  fn: (...args: any[]) => unknown,
  fnName: string,
  fnGaurds: FnGaurd[],
) {
  return (...args: any[]) => {
    for (const gaurd of fnGaurds) {
      gaurd(fn, fnName);
    }
    return fn(...args);
  };
}
