import get from "lodash/get";

export default function initLocalStorage(this: any) {
  const getItem = (key: string) => {
    return get(this.appsmith.store, key);
  };
  const setItem = (key: string, value: any) => {
    this.storeValue(key, value);
  };
  const removeItem = (key: string) => {
    this.removeValue(key);
  };
  const clear = () => {
    this.clearStore();
  };
  const localStorage = {
    getItem,
    setItem,
    removeItem,
    clear,
  };
  Object.defineProperty(this, "localStorage", {
    enumerable: false,
    value: localStorage,
  });
}
