import {
  JSExecutorGlobal,
  JSExecutor,
  JSExecutorResult,
} from "./JSExecutionManagerSingleton";
import JSONFn from "json-fn";
import log from "loglevel";
declare let Realm: any;

export default class RealmExecutor implements JSExecutor {
  rootRealm: any;
  createActionTriggerData: any;
  extrinsics: any[] = [];
  createSafeFunction: (unsafeFn: Function) => Function;

  libraries: Record<string, any> = {};
  constructor() {
    this.rootRealm = Realm.makeRootRealm();
    this.registerLibrary("JSONFn", JSONFn);
    this.createSafeFunction = this.rootRealm.evaluate(`
      (function createSafeFunction(unsafeFn) {
        return function safeFn(...args) {
          return unsafeFn(...args);
        }
      })
    `);
    // We add a triggers list on the global scope to
    // push to it during any script execution
    // We replace all action descriptor functions with our pusher function
    // which has reference to the triggers via binding
    this.createActionTriggerData = this.rootRealm.evaluate(
      `
      (function createActionTriggerData(data) {
        if(data.actionPaths) {
          data.triggers = [];
          const pusher = function (action, ...payload) {
            const actionPayload = action(...payload);
            this.triggers.push(actionPayload);
          }
          data.actionPaths.forEach(path => {
            const action = _.get(data, path);
            const entity = _.get(data, path.split(".")[0])
            if(action) {
               _.set(data, path, pusher.bind(data, action.bind(entity)))
            }
          })
        }
        return data
      })
    `,
    );
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
  execute(
    sourceText: string,
    data: JSExecutorGlobal,
    callbackData?: any,
  ): JSExecutorResult {
    const dataWithTriggers = this.createActionTriggerData(data);
    try {
      // We create a closed function and evaluate that
      // This is to send any triggers received during evaluations
      // triggers should already be defined in the safeData
      const scriptToEvaluate = `
        function closedFunction () {
          const result = ${sourceText};
          return { result, triggers }
        }
        closedFunction()
      `;

      const scriptWithCallback = `
         function callback (script) {
            const userFunction = script;
            const result = userFunction(CALLBACK_DATA);
            return { result, triggers };
         }
         callback(${sourceText});
      `;
      const script = callbackData ? scriptWithCallback : scriptToEvaluate;
      const data = callbackData
        ? { ...dataWithTriggers, CALLBACK_DATA: callbackData }
        : dataWithTriggers;

      const { result, triggers } = this.rootRealm.evaluate(script, data);
      return {
        result: this.convertToMainScope(result),
        triggers,
      };
    } catch (e) {
      log.debug(`Error: "${e.message}" when evaluating {{${sourceText}}}`);
      log.debug(e);
      return { result: undefined, triggers: [] };
    }
  }
}
