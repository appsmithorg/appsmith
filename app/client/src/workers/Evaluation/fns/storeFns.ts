import set from "lodash/set";
import TriggerEmitter, { BatchKey } from "./utils/TriggerEmitter";
import { dataTreeEvaluator } from "../handlers/evalTree";
import unset from "lodash/unset";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  key: string,
  value: string,
  persist = true,
) {
  const evalTree = dataTreeEvaluator?.getEvalTree();
  const path = ["appsmith", "store", key];

  if (evalTree) set(evalTree, path, value);

  set(this, path, value);
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function removeValue(this: any, key: string) {
  const evalTree = dataTreeEvaluator?.getEvalTree();
  const path = ["appsmith", "store", key];

  if (evalTree) unset(evalTree, path);

  unset(this, path);
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function clearStore(this: any) {
  const evalTree = dataTreeEvaluator?.getEvalTree();

  if (evalTree) set(evalTree, ["appsmith", "store"], {});

  this.appsmith.store = {};
  TriggerEmitter.emit(BatchKey.process_store_updates, clearStoreFnDescriptor());

  return {};
}
