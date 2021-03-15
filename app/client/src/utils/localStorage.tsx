import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE,
  LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE,
  createMessage,
} from "constants/messages";

const getLocalStorage = () => {
  const storage = window.localStorage;

  const handleError = (e: Error) => {
    let message;
    if (e.name === "QuotaExceededError") {
      message = LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE;
    } else if (e.name === "NS_ERROR_FILE_NO_DEVICE_SPACE") {
      message = LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE;
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
      return storage.getItem(key);
    } catch (e) {
      handleError(e);
    }
    return null;
  };

  const setItem = (key: string, value: string) => {
    try {
      storage.setItem(key, value);
    } catch (e) {
      handleError(e);
    }
  };

  const removeItem = (key: string) => {
    try {
      storage.removeItem(key);
    } catch (e) {
      handleError(e);
    }
  };

  const isSupported = () => !!window.localStorage;

  return {
    getItem,
    setItem,
    removeItem,
    isSupported,
  };
};

const localStorage = getLocalStorage();

export default localStorage;
