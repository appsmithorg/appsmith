import get from "lodash/get";

export default function initLocalStorage(ctx: typeof globalThis) {
  function getItem(key: string) {
    //@ts-expect-error no types
    return get(ctx.appsmith.store, key);
  }
  function setItem(key: string, value: any) {
    //@ts-expect-error no types
    ctx.storeValue(key, value);
  }
  function removeItem(key: string) {
    //@ts-expect-error no types
    ctx.removeValue(key);
  }
  function clear() {
    //@ts-expect-error no types
    ctx.clearStore();
  }
  const localStorage = {
    getItem,
    setItem,
    removeItem,
    clear,
  };
  Object.defineProperty(ctx, "localStorage", {
    enumerable: false,
    value: localStorage,
  });
}
