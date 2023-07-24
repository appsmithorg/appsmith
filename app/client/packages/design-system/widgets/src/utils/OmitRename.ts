export type OmitRename<
  TObj extends object,
  TOmitKeys extends keyof TObj,
  TSymbol extends string = "$",
> = {
  [K in keyof TObj as K extends TOmitKeys
    ? never
    : `${TSymbol}${string & K}`]: TObj[K];
} & Omit<TObj, TOmitKeys>;
