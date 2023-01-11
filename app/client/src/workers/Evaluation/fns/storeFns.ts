import set from "lodash/set";
import { addFn } from "./utils/fnGuard";
import { TriggerEmitter } from "./utils/TriggerEmitter";

export function initStoreFns(ctx: typeof globalThis) {
  const triggerEmitter = TriggerEmitter.getInstance();
  function storeValue(key: string, value: string, persist = true) {
    const requestPayload = {
      type: "STORE_VALUE",
      payload: {
        key,
        value,
        persist,
      },
    };
    set(self, ["appsmith", "store", key], value);
    triggerEmitter.emit("process_store_updates", {
      trigger: requestPayload,
      metaData: self["$metaData"],
    });
    return Promise.resolve({});
  }

  function removeValue(key: string) {
    const requestPayload = {
      type: "REMOVE_VALUE",
      payload: {
        key,
      },
    };
    //@ts-expect-error no types for store
    delete self.appsmith.store[key];
    triggerEmitter.emit("process_store_updates", requestPayload);
    return Promise.resolve({});
  }

  function clearStore() {
    //@ts-expect-error no types for store
    self.appsmith.store = {};
    triggerEmitter.emit("process_store_updates", {
      type: "CLEAR_STORE",
      payload: null,
    });
    return Promise.resolve({});
  }

  addFn(ctx, "storeValue", storeValue);
  addFn(ctx, "removeValue", removeValue);
  addFn(ctx, "clearStore", clearStore);
}
