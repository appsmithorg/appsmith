import {
  RemoveValueActionDescription,
  StoreValueActionDescription,
} from "ce/entities/DataTree/actionTriggers";
import set from "lodash/set";
import { MAIN_THREAD_ACTION } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { addFn } from "./utils/fnGuard";
import { TriggerCollector } from "./utils/TriggerCollector";

export function initStoreFns(ctx: typeof globalThis) {
  const triggerCollector = new TriggerCollector(
    MAIN_THREAD_ACTION.PROCESS_STORE_UPDATES,
  );
  function storeValue(key: string, value: string, persist = true) {
    const requestPayload: StoreValueActionDescription = {
      type: "STORE_VALUE",
      payload: {
        key,
        value,
        persist,
      },
    };
    set(self, ["appsmith", "store", key], value);
    triggerCollector.collect(requestPayload);
    return Promise.resolve({});
  }

  function removeValue(key: string) {
    const requestPayload: RemoveValueActionDescription = {
      type: "REMOVE_VALUE",
      payload: {
        key,
      },
    };
    //@ts-expect-error no types for store
    delete self.appsmith.store[key];
    triggerCollector.collect(requestPayload);
    return Promise.resolve({});
  }

  function clearStore() {
    //@ts-expect-error no types for store
    self.appsmith.store = {};
    triggerCollector.collect({
      type: "CLEAR_STORE",
      payload: null,
    });
    return Promise.resolve({});
  }

  addFn(ctx, "storeValue", storeValue);
  addFn(ctx, "removeValue", removeValue);
  addFn(ctx, "clearStore", clearStore);
}
