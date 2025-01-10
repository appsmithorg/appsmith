import * as log from "loglevel";
import {
  LOCAL_STORAGE_QUOTA_EXCEEDED_MESSAGE,
  LOCAL_STORAGE_NO_SPACE_LEFT_ON_DEVICE_MESSAGE,
  LOCAL_STORAGE_NOT_SUPPORTED_APP_MIGHT_NOT_WORK_AS_EXPECTED,
  createMessage,
} from "ee/constants/messages";
import { toast } from "@appsmith/ads";

export const LOCAL_STORAGE_KEYS = {
  CANVAS_CARDS_STATE: "CANVAS_CARDS_STATE",
  SPLITPANE_ANNOUNCEMENT: "SPLITPANE_ANNOUNCEMENT",
  NUDGE_SHOWN_SPLIT_PANE: "NUDGE_SHOWN_SPLIT_PANE",
};

class LocalStorageNotSupportedError extends Error {
  name: string;

  constructor() {
    super();
    this.name = "LOCAL_STORAGE_NOT_SUPPORTED";
  }
}

class WebStorage {
  private storage: Storage;
  private _isSupported: boolean;

  constructor(storage: Storage) {
    this.storage = storage;

    this._isSupported = this.isSupported();
  }

  // ref: https://github.com/Modernizr/Modernizr/blob/94592f279a410436530c7c06acc42a6e90c20150/feature-detects/storage/localstorage.js
  isSupported = () => {
    try {
      this.storage.setItem("test", "testA");
      this.storage.removeItem("test");

      return true;
    } catch (e) {
      return false;
    }
  };

  getItem = (key: string): string | null => {
    try {
      if (!this._isSupported) {
        throw new LocalStorageNotSupportedError();
      }

      return this.storage.getItem(key);
    } catch (error) {
      this.handleError(error as Error);
    }

    return null;
  };

  handleError = (e: Error) => {
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
      toast.show(createMessage(message), {
        kind: "error",
      });
    } else {
      throw e;
    }
  };

  setItem = (key: string, value: string) => {
    try {
      if (!this._isSupported) {
        throw new LocalStorageNotSupportedError();
      }

      this.storage.setItem(key, value);
    } catch (error) {
      this.handleError(error as Error);
    }
  };

  removeItem = (key: string) => {
    try {
      if (!this._isSupported) {
        throw new LocalStorageNotSupportedError();
      }

      this.storage.removeItem(key);
    } catch (error) {
      this.handleError(error as Error);
    }
  };

  clear = () => {
    try {
      if (!this._isSupported) {
        throw new LocalStorageNotSupportedError();
      }

      this.storage.clear();
    } catch (error) {
      this.handleError(error as Error);
    }
  };
}

export class LocalStorage extends WebStorage {
  constructor() {
    super(window.localStorage);
  }
}

class SessionStorage extends WebStorage {
  constructor() {
    super(window.sessionStorage);
  }
}

const localStorage = new LocalStorage();

export const sessionStorage = new SessionStorage();

export default localStorage;
