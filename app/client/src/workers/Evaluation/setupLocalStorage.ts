import { get, set } from "lodash";
import { EVAL_WORKER_ACTIONS } from "workers/Evaluation/evalWorkerActions";
import { DATA_TREE_FUNCTIONS } from "./Actions";

const sendMessage = (payload: unknown) => {
  self.postMessage({
    type: EVAL_WORKER_ACTIONS.PROCESS_TRIGGER,
    responseData: {
      trigger: payload,
      promisified: true,
    },
  });
};

export default function setupLocalStorage() {
  const localStorage = {
    getItem: (key: string) => {
      //@ts-expect-error ignore
      return `${get(self.appsmith.store, key)}`;
    },
    setItem: (key: string, value: string) => {
      //@ts-expect-error ignore
      `${set(self.appsmith.store, key, value)}`;
      //@ts-expect-error ignore
      const { payload, type } = DATA_TREE_FUNCTIONS.storeValue(key, value);
      sendMessage({ payload, type });
    },
    removeItem: (key: string) => {
      //@ts-expect-error ignore
      const { payload, type } = DATA_TREE_FUNCTIONS.removeValue(key);
      //@ts-expect-error ignore
      delete self.appsmith.store[key];
      sendMessage({ payload, type });
    },
    clear: () => {
      //@ts-expect-error ignore
      self.appsmith.store = {};
      //@ts-expect-error ignore
      const { payload, type } = DATA_TREE_FUNCTIONS.clearStore(key);
      sendMessage({ payload, type });
    },
  };
  //@ts-expect-error ignore
  self.localStorage = localStorage;
}
