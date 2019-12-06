import { JSExecutorGlobal, JSExecutor } from "./JSExecutionManagerSingleton";
declare let Realm: any;

export default class RealmExecutor implements JSExecutor {
  rootRealm: any;
  creaetSafeObject: any;
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
    this.creaetSafeObject = this.rootRealm.evaluate(`
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
  execute(sourceText: string, data: JSExecutorGlobal) {
    const safeData = this.creaetSafeObject(data);
    let result;
    try {
      result = this.rootRealm.evaluate(sourceText, safeData);
    } catch (e) {
      //TODO(Satbir): Return an object with an error message.
    }
    return result;
  }
}
