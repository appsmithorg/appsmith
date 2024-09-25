export const compose =
  <T>(...fns: Array<(arg: T) => T>) =>
  (x: T) =>
    fns.reduce((acc, fn) => fn(acc), x);
