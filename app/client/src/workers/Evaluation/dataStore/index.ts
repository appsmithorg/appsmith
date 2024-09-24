import { convertPathToString } from "ee/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { get, set, unset } from "lodash";

export type TDataStore = Record<string, Record<string, unknown>>;
export default class DataStore {
  private static store: TDataStore = {};

  static setActionData(fullPath: string, value: unknown) {
    set(DataStore.store, fullPath, value);
  }

  static getActionData(fullPath: string): unknown | undefined {
    return get(DataStore.store, fullPath, undefined);
  }
  static getDataStore() {
    return DataStore.store;
  }
  static deleteActionData(fullPath: string) {
    unset(DataStore.store, fullPath);
  }
  static clear() {
    DataStore.store = {};
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
