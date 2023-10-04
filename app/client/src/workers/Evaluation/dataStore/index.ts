import { convertPathToString } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import type { DataTree } from "@appsmith/entities/DataTree/types";
import { get, set, unset } from "lodash";

export type TDataStore = Record<string, Record<string, unknown>>;
export default class DataStore {
  private static store: TDataStore = {};
  static dataPaths: Array<string> = [];

  static setActionData(fullPath: string, value: unknown) {
    set(DataStore.store, fullPath, value);
    DataStore.dataPaths.push(fullPath);
  }

  static getActionData(fullPath: string): unknown | undefined {
    return get(DataStore.store, fullPath, undefined);
  }
  static getDataStore() {
    return DataStore.store;
  }
  static deleteActionData(fullPath: string) {
    unset(DataStore.store, fullPath);
    DataStore.dataPaths = DataStore.dataPaths.filter((p) => p !== fullPath);
  }
  static clear() {
    DataStore.store = {};
    DataStore.dataPaths = [];
  }

  static replaceDataStore(store: TDataStore) {
    DataStore.store = store;
  }

  static update(dataTreeDiff: Diff<DataTree, DataTree>[]) {
    const deleteDiffs = dataTreeDiff.filter((diff) => diff.kind === "D");
    deleteDiffs.forEach((diff) => {
      const deletedPath = diff.path || [];
      const deletedPathString = convertPathToString(deletedPath);
      DataStore.deleteActionData(deletedPathString);
    });
  }
}
