import RealmExecutor from "./RealmExecutor";
import moment from "moment-timezone";

export type JSExecutorGlobal = Record<string, object>;
export interface JSExecutor {
  execute: (src: string, data: JSExecutorGlobal) => any;
  registerLibrary: (accessor: string, lib: any) => void;
  unRegisterLibrary: (accessor: string) => void;
}

enum JSExecutorType {
  REALM,
}

export const extraLibraries = [
  {
    accessor: "_",
    lib: window._,
  },
  {
    accessor: "moment",
    lib: moment,
  },
];

class JSExecutionManager {
  currentExecutor: JSExecutor;
  executors: Record<JSExecutorType, JSExecutor>;
  registerLibrary(accessor: string, lib: any) {
    Object.keys(this.executors).forEach(type => {
      const executor = this.executors[(type as any) as JSExecutorType];
      executor.registerLibrary(accessor, lib);
    });
  }
  unRegisterLibrary(accessor: string) {
    Object.keys(this.executors).forEach(type => {
      const executor = this.executors[(type as any) as JSExecutorType];
      executor.unRegisterLibrary(accessor);
    });
  }
  switchExecutor(type: JSExecutorType) {
    const executor = this.executors[type];
    if (!executor) {
      throw new Error("Executor does not exist");
    }
    this.currentExecutor = executor;
  }
  constructor() {
    const realmExecutor = new RealmExecutor();
    this.executors = {
      [JSExecutorType.REALM]: realmExecutor,
    };
    this.currentExecutor = realmExecutor;

    extraLibraries.forEach(config => {
      this.registerLibrary(config.accessor, config.lib);
    });
  }
  evaluateSync(jsSrc: string, data: JSExecutorGlobal) {
    return this.currentExecutor.execute(jsSrc, data);
  }
}
const JSExecutionManagerSingleton = new JSExecutionManager();

export default JSExecutionManagerSingleton;
