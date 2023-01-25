import { uniqueId } from "lodash";
import { TDefaultMessage } from "utils/MessageUtil";
import { batchedFn } from "./utils/batchedFn";
import { promisify } from "./utils/Promisify";
import { BatchKey } from "./utils/TriggerEmitter";

export let geoLocationListener: ((e: MessageEvent<any>) => void) | null = null;

function getGeoLocationFnDescriptor(
  successCallback?: () => unknown,
  errorCallback?: () => unknown,
  options?: {
    maximumAge?: number;
    timeout?: number;
    enableHighAccuracy?: boolean;
  },
) {
  return {
    type: "GET_CURRENT_LOCATION",
    payload: {
      options,
      onError: errorCallback ? `{{${errorCallback.toString()}}}` : undefined,
      onSuccess: successCallback
        ? `{{${successCallback.toString()}}}`
        : undefined,
    },
  };
}

export async function getGeoLocation(
  successCallback?: () => unknown,
  errorCallback?: () => unknown,
  options?: {
    maximumAge?: number;
    timeout?: number;
    enableHighAccuracy?: boolean;
  },
) {
  const executor = promisify(getGeoLocationFnDescriptor);
  let response;
  try {
    response = await executor(successCallback, errorCallback, options);
    if (typeof successCallback === "function") {
      successCallback();
      return;
    }
  } catch (e) {
    if (typeof errorCallback === "function") {
      errorCallback();
      return;
    }
    throw e;
  }
  return response;
}

function watchGeoLocationFnDescriptor(
  this: any,
  onSuccessCallback?: (...args: any) => any,
  onErrorCallback?: (...args: any) => any,
  options?: {
    maximumAge?: number;
    timeout?: number;
    enableHighAccuracy?: boolean;
  },
) {
  return {
    type: "WATCH_CURRENT_LOCATION",
    payload: {
      options,
      listenerId: this.listenerId,
    },
  };
}

export function watchGeoLocation(
  onSuccessCallback?: (...args: any) => any,
  onErrorCallback?: (...args: any) => any,
  options?: {
    maximumAge?: number;
    timeout?: number;
    enableHighAccuracy?: boolean;
  },
) {
  const listenerId = uniqueId("geoLocationListener_");
  const executor = batchedFn(
    watchGeoLocationFnDescriptor.bind({ listenerId }),
    BatchKey.process_batched_triggers,
  );
  executor(onSuccessCallback, onErrorCallback, options);
  const messageHandler = (event: MessageEvent<TDefaultMessage<any>>) => {
    const message = event.data;
    if (message.messageId !== listenerId) return;
    const { body } = message;
    // setup eval context
    if (body.success) {
      if (typeof onSuccessCallback === "function") onSuccessCallback(body.data);
    } else {
      if (typeof onErrorCallback === "function") onErrorCallback(body.data);
      self.removeEventListener("message", messageHandler);
      geoLocationListener = null;
    }
  };
  self.addEventListener("message", messageHandler);
  geoLocationListener = messageHandler;
}

function stopWatchGeoLocationFnDescriptor(this: any) {
  return {
    type: "STOP_WATCHING_CURRENT_LOCATION",
    payload: {},
  };
}

export async function stopWatchGeoLocation() {
  const executor = promisify(stopWatchGeoLocationFnDescriptor);
  let response;
  try {
    response = await executor();
    geoLocationListener = null;
  } catch (e) {
    throw e;
  }
  return response;
}
