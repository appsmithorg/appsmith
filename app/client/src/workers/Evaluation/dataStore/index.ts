import { get, set, unset } from "lodash";

export type TDataStore = Record<string, Record<string, unknown>>;
export default class DataStore {
  private static store: TDataStore = {};

  static setActionData(entityName: string, dataPath: string, value: unknown) {
    set(this.store, `${entityName}.["${dataPath}"]`, value);
  }

  static getActionData(
    entityName: string,
    dataPath: string,
  ): unknown | undefined {
    return get(this.store, `${entityName}.[${dataPath}]`, undefined);
  }
  static getDataStore() {
    return this.store;
  }
  static deleteActionData(entityName: string, dataPath?: string) {
    unset(this.store, dataPath ? `${entityName}.["${dataPath}"]` : entityName);
  }
  static clear() {
    this.store = {};
  }
}
