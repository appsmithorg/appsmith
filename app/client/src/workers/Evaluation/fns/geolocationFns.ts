import { uniqueId } from "lodash";
import { TDefaultMessage } from "utils/MessageUtil";
import { batchedFn } from "./utils/batchedFn";
import { promisify } from "./utils/Promisify";
import { BatchKey } from "./utils/TriggerEmitter";

export let geoLocationListener: ((e: MessageEvent<any>) => void) | null = null;

function getGeoLocationFnDescriptor(
  successCallback?: (position: GeolocationPosition) => unknown,
  errorCallback?: (err: unknown) => unknown,
  options?: {
    maximumAge?: number;
    timeout?: number;
    enableHighAccuracy?: boolean;
  },
) {
  return {
    type: "GET_CURRENT_LOCATION" as const,
    payload: {
      options,
    },
  };
}

export type TGetGeoLocationArgs = Parameters<typeof getGeoLocationFnDescriptor>;
export type TGetGeoLocationDescription = ReturnType<
  typeof getGeoLocationFnDescriptor
>;

export async function getGeoLocation(
  ...args: Parameters<typeof getGeoLocationFnDescriptor>
) {
  const [successCallback, errorCallback, options] = args;
  const executor = promisify(getGeoLocationFnDescriptor);
  let response;
  try {
    response = await executor(successCallback, errorCallback, options);
    if (typeof successCallback === "function") {
      successCallback(response);
      return;
    }
  } catch (e) {
    if (typeof errorCallback === "function") {
      errorCallback(e);
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
    type: "WATCH_CURRENT_LOCATION" as const,
    payload: {
      options,
      listenerId: this.listenerId,
    },
  };
}

export type TWatchGeoLocationArgs = Parameters<
  typeof watchGeoLocationFnDescriptor
>;
export type TWatchGeoLocationDescription = ReturnType<
  typeof watchGeoLocationFnDescriptor
>;

export function watchGeoLocation(...args: TWatchGeoLocationArgs) {
  const [onSuccessCallback, onErrorCallback, options] = args;
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
    if (body.data) {
      if (typeof onSuccessCallback === "function") onSuccessCallback(body.data);
    } else if (body.error) {
      if (typeof onErrorCallback === "function") onErrorCallback(body.error);
      self.removeEventListener("message", messageHandler);
      geoLocationListener = null;
    }
  };
  self.addEventListener("message", messageHandler);
  geoLocationListener = messageHandler;
}

function stopWatchGeoLocationFnDescriptor(this: any) {
  return {
    type: "STOP_WATCHING_CURRENT_LOCATION" as const,
    payload: {},
  };
}

export type TStopWatchGeoLocationArgs = Parameters<
  typeof stopWatchGeoLocationFnDescriptor
>;
export type TStopWatchGeoLocationDescription = ReturnType<
  typeof stopWatchGeoLocationFnDescriptor
>;

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
