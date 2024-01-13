export type OmitRename<
  TObj extends object,
  TOmitKeys extends keyof TObj,
  TSymbol extends string = "$",
> = {
  [K in keyof Omit<TObj, TOmitKeys> as `${TSymbol}${string & K}`]: TObj[K];
} & Pick<TObj, TOmitKeys>;
