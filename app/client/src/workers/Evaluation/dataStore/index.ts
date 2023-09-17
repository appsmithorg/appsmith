import { convertPathToString } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { get, set, unset } from "lodash";

export type TDataStore = Record<string, Record<string, unknown>>;
export default class DataStore {
  private static store: TDataStore = {};

  static setActionData(fullPath: string, value: unknown) {
    set(this.store, fullPath, value);
  }

  static getActionData(fullPath: string): unknown | undefined {
    return get(this.store, fullPath, undefined);
  }
  static getDataStore() {
    return this.store;
  }
  static deleteActionData(fullPath: string) {
    unset(this.store, fullPath);
  }
  static clear() {
    this.store = {};
  }
  static update(dataTreeDiff: Diff<DataTree, DataTree>[]) {
    const deleteDiffs = dataTreeDiff.filter((diff) => diff.kind === "D");
    deleteDiffs.forEach((diff) => {
      const deletedPath = diff.path || [];
      const deletedPathString = convertPathToString(deletedPath);
      this.deleteActionData(deletedPathString);
    });
  }
}
