import set from "lodash/set";
import { batchedFn } from "./utils/batchedFn";
import { BatchKey } from "./utils/TriggerEmitter";

function storeFnDescriptor(key: string, value: string, persist = true) {
  return {
    type: "STORE_VALUE" as const,
    payload: {
      key,
      value,
      persist,
    },
  };
}

export type TStoreValueArgs = Parameters<typeof storeFnDescriptor>;
export type TStoreValueDescription = ReturnType<typeof storeFnDescriptor>;

export async function storeValue(
  this: any,
  key: string,
  value: string,
  persist = true,
) {
  set(this, ["appsmith", "store", key], value);
  const executor = batchedFn(storeFnDescriptor, BatchKey.process_store_updates);
  executor(key, value, persist);
  return {};
}

function removeValueFnDescriptor(key: string) {
  return {
    type: "REMOVE_VALUE" as const,
    payload: {
      key,
    },
  };
}

export type TRemoveValueArgs = Parameters<typeof removeValueFnDescriptor>;
export type TRemoveValueDescription = ReturnType<
  typeof removeValueFnDescriptor
>;

export async function removeValue(this: any, key: string) {
  delete this.appsmith.store[key];
  const executor = batchedFn(
    removeValueFnDescriptor,
    BatchKey.process_store_updates,
  );
  executor(key);
  return {};
}

function clearStoreFnDescriptor() {
  return {
    type: "CLEAR_STORE" as const,
    payload: null,
  };
}

export type TClearStoreArgs = Parameters<typeof clearStoreFnDescriptor>;
export type TClearStoreDescription = ReturnType<typeof clearStoreFnDescriptor>;

export async function clearStore(this: any) {
  this.appsmith.store = {};
  const executor = batchedFn(
    clearStoreFnDescriptor,
    BatchKey.process_store_updates,
  );
  executor();
  return {};
}
