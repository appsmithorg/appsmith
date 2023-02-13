import set from "lodash/set";
import TriggerEmitter, { BatchKey } from "./utils/TriggerEmitter";

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
export type TStoreValueActionType = TStoreValueDescription["type"];

export async function storeValue(
  this: any,
  key: string,
  value: string,
  persist = true,
) {
  set(this, ["appsmith", "store", key], value);
  TriggerEmitter.emit(
    BatchKey.process_store_updates,
    storeFnDescriptor(key, value, persist),
  );
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
export type TRemoveValueActionType = TRemoveValueDescription["type"];

export async function removeValue(this: any, key: string) {
  delete this.appsmith.store[key];
  TriggerEmitter.emit(
    BatchKey.process_store_updates,
    removeValueFnDescriptor(key),
  );
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
export type TClearStoreActionType = TClearStoreDescription["type"];

export async function clearStore(this: any) {
  this.appsmith.store = {};
  TriggerEmitter.emit(BatchKey.process_store_updates, clearStoreFnDescriptor());
  return {};
}
