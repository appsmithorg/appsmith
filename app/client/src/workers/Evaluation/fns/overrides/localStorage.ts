import { get } from "lodash";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function initLocalStorage(this: any) {
  const getItem = (key: string) => {
    return get(this.appsmith.store, key);
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
