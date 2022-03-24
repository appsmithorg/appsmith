import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import * as log from "loglevel";
import {
  LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE,
  LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE,
  LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED,
  createMessage,
} from "@appsmith/constants/messages";

class LocalStorageNotSupportedError extends Error {
  name: string;
  constructor() {
    super();
    this.name = "LOCAL_STORAGE_NOT_SUPPORTED";
  }
}

export const getLocalStorage = () => {
  const storage = window.localStorage;

  // ref: https://github.com/Modernizr/Modernizr/blob/94592f279a410436530c7c06acc42a6e90c20150/feature-detects/storage/localstorage.js
  const isSupported = () => {
    try {
      storage.setItem("test", "testA");
      storage.removeItem("test");
      return true;
    } catch (e) {
      return false;
    }
  };

  const _isSupported = isSupported();

  const handleError = (e: Error) => {
    let message;
    if (e.name === "QuotaExceededError") {
      message = LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE;
    } else if (e.name === "NS_ERROR_FILE_NO_DEVICE_SPACE") {
      message = LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE;
    } else if (e.name === "LOCAL_STORAGE_NOT_SUPPORTED") {
      // Fail silently
      log.error(
        createMessage(
          LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED,
        ),
      );
      return;
    }

    if (message) {
      Toaster.show({
        text: createMessage(message),
        variant: Variant.danger,
      });
    } else {
      throw e;
    }
  };

  const getItem = (key: string): string | null => {
    try {
      if (!_isSupported) {
        throw new LocalStorageNotSupportedError();
      }
      return storage.getItem(key);
    } catch (e) {
      handleError(e);
    }
    return null;
  };

  const setItem = (key: string, value: string) => {
    try {
      if (!_isSupported) {
        throw new LocalStorageNotSupportedError();
      }
      storage.setItem(key, value);
    } catch (e) {
      handleError(e);
    }
  };

  const removeItem = (key: string) => {
    try {
      if (!_isSupported) {
        throw new LocalStorageNotSupportedError();
      }
      storage.removeItem(key);
    } catch (e) {
      handleError(e);
    }
  };

  const clear = () => {
    try {
      if (!_isSupported) {
        throw new LocalStorageNotSupportedError();
      }
      storage.clear();
    } catch (e) {
      handleError(e);
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
    isSupported,
    clear,
  };
};

const localStorage = getLocalStorage();

export default localStorage;
