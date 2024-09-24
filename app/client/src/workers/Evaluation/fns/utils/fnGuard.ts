import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FnGuard = (fn: (...args: any[]) => unknown, fnName: string) => unknown;

export function addFn(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  fnName: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => any,
  fnGuards = [isAsyncGuard],
) {
  Object.defineProperty(ctx, fnName, {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: function (...args: any[]) {
      const fnWithGuards = getFnWithGuards(fn, fnName, fnGuards);

      return fnWithGuards(...args);
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

export function getFnWithGuards(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => unknown,
  fnName: string,
  fnGuards: FnGuard[],
) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    for (const guard of fnGuards) {
      guard(fn, fnName);
    }

    return fn(...args);
  };
}
