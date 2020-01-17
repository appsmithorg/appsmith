import { JSExecutorGlobal, JSExecutor } from "./JSExecutionManagerSingleton";
declare let Realm: any;

export default class RealmExecutor implements JSExecutor {
  rootRealm: any;
  createSafeObject: any;
  extrinsics: any[] = [];
  createSafeFunction: (unsafeFn: Function) => Function;

  libraries: Record<string, any> = {};
  constructor() {
    this.rootRealm = Realm.makeRootRealm();
    this.createSafeFunction = this.rootRealm.evaluate(`
      (function createSafeFunction(unsafeFn) {
        return function safeFn(...args) {
          unsafeFn(...args);
        }
      })
    `);
    this.createSafeObject = this.rootRealm.evaluate(`
      (function creaetSafeObject(unsafeObject) {
        return JSON.parse(JSON.stringify(unsafeObject));
      })
    `);
  }
  registerLibrary(accessor: string, lib: any) {
    this.rootRealm.global[accessor] = lib;
  }
  unRegisterLibrary(accessor: string) {
    this.rootRealm.global[accessor] = null;
  }
  private convertToMainScope(result: any) {
    if (typeof result === "object") {
      if (Array.isArray(result)) {
        return Object.assign([], result);
      }
      return Object.assign({}, result);
    }
    return result;
  }
  execute(sourceText: string, data: JSExecutorGlobal) {
    const safeData = this.createSafeObject(data);
    let result;
    try {
      result = this.rootRealm.evaluate(sourceText, safeData);
    } catch (e) {
      console.error(`Error: "${e.message}" when evaluating {{${sourceText}}}`);
    }
    return this.convertToMainScope(result);
  }
}
