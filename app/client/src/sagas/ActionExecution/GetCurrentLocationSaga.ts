import {
  GetCurrentLocationDescription,
  WatchCurrentLocationDescription,
} from "@appsmith/entities/DataTree/actionTriggers";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  executeAppAction,
  TriggerMeta,
} from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import {
  actionChannel,
  call,
  cancel,
  fork,
  put,
  spawn,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { setUserCurrentGeoLocation } from "actions/browserRequestActions";
import { Channel, channel, Task } from "redux-saga";
import { ReduxAction } from "ce/constants/ReduxActionConstants";
import ts from "typescript";
import { EvalWorker } from "sagas/EvaluationsSaga";
import { EVAL_WORKER_ACTIONS } from "workers/Evaluation/evalWorkerActions";
const referenceMap = new Map();
const inverseRefMap = new Map();

navigator.serviceWorker &&
  navigator.serviceWorker.addEventListener("message", (event) => {
    const { data } = event;
    const port = event.ports[0];
    let result = null;
    if (data) {
      const source = referenceMap.get(data["_referenceId"]) || window;
      if (data.action === "APPLY") {
        try {
          const ctx = referenceMap.get(data["_ctxReferenceId"]) || window;
          const args = data.args.map((arg: any) => {
            if (typeof arg === "object" && arg["_referenceId"]) {
              return referenceMap.get(arg["_referenceId"]);
            }
            return arg;
          });
          result = source.apply(ctx, args);
        } catch (e) {
          result = null;
        }
      } else if (data.action === "GET") {
        result = source[data.property];
      } else if (data.action === "SET") {
        source[data.property] = data.args[0];
        result = source[data.property];
      }
      try {
        port.postMessage({ data: result });
      } catch (e) {
        const _referenceType = typeof result;
        let _referenceId = inverseRefMap.get(result);
        if (!_referenceId) {
          _referenceId = window.crypto.randomUUID();
          referenceMap.set(_referenceId, result);
          inverseRefMap.set(result, _referenceId);
        }
        port.postMessage({ data: { _referenceId, _referenceType } });
      }
    }
  });

// Making the getCurrentPosition call in a promise fashion
const getUserLocation = (options?: PositionOptions) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (location) => resolve(location),
      (error) => reject(error),
      options,
    );
  });

/**
 * We need to extract and set certain properties only because the
 * return value is a "class" with functions as well and
 * that cant be stored in the data tree
 **/
export const extractGeoLocation = (
  location: GeolocationPosition,
): GeolocationPosition => {
  const {
    coords: {
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      latitude,
      longitude,
      speed,
    },
  } = location;
  const coords: GeolocationCoordinates = {
    altitude,
    altitudeAccuracy,
    heading,
    latitude,
    longitude,
    accuracy,
    speed,
  };
  return {
    coords,
    timestamp: location.timestamp,
  };
};

/**
 * When location access is turned off in the browser, the error is a GeolocationPositionError instance
 * We can't pass this instance to the worker thread as it uses structured cloning for copying the objects
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * It doesn't support some entities like DOM Nodes, functions etc. for copying
 * And will throw an error if we try to pass it
 * GeolocationPositionError instance doesn't exist in worker thread hence not supported by structured cloning
 * https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
 * Hence we're creating a new object with same structure which can be passed to the worker thread
 */
function sanitizeGeolocationError(error: any) {
  if (error instanceof GeolocationPositionError) {
    const { code, message } = error;
    return {
      code,
      message,
    };
  }

  return error;
}

let successChannel: Channel<any> | undefined;
let errorChannel: Channel<any> | undefined;

function* successCallbackHandler() {
  if (successChannel) {
    while (true) {
      const payload: unknown = yield take(successChannel);
      // @ts-expect-error: payload is unknown
      const { callback, eventType, location, triggerMeta } = payload;
      const currentLocation = extractGeoLocation(location);
      yield put(setUserCurrentGeoLocation(currentLocation));
      if (callback) {
        yield call(executeAppAction, {
          dynamicString: callback,
          callbackData: [currentLocation],
          event: { type: eventType },
          triggerPropertyName: triggerMeta.triggerPropertyName,
          source: triggerMeta.source,
        });
      }
    }
  }
}

function* errorCallbackHandler() {
  if (errorChannel) {
    while (true) {
      const payload: unknown = yield take(errorChannel);
      // @ts-expect-error: payload is unknown
      const { callback, error, eventType, triggerMeta } = payload;
      if (callback) {
        yield call(executeAppAction, {
          dynamicString: callback,
          callbackData: [sanitizeGeolocationError(error)],
          event: { type: eventType },
          triggerPropertyName: triggerMeta.triggerPropertyName,
          source: triggerMeta.source,
        });

        logActionExecutionError(
          (error as Error).message,
          triggerMeta.source,
          triggerMeta.triggerPropertyName,
        );
      } else {
        throw new TriggerFailureError(error.message, triggerMeta);
      }
    }
  }
}

export function* getCurrentLocationSaga(
  actionPayload: GetCurrentLocationDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  try {
    const location: GeolocationPosition = yield call(
      getUserLocation,
      actionPayload.options,
    );

    const currentLocation = extractGeoLocation(location);

    yield put(setUserCurrentGeoLocation(currentLocation));

    if (actionPayload.onSuccess) {
      yield call(executeAppAction, {
        dynamicString: actionPayload.onSuccess,
        callbackData: [currentLocation],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    }

    return [currentLocation];
  } catch (error) {
    if (actionPayload.onError) {
      yield call(executeAppAction, {
        dynamicString: actionPayload.onError,
        callbackData: [sanitizeGeolocationError(error)],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    }

    logActionExecutionError(
      (error as Error).message,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
  }
}

let watchId: number | undefined;
export function* watchCurrentLocation(
  actionPayload: WatchCurrentLocationDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (watchId) {
    // When a watch is already active, we will not start a new watch.
    // at a given point in time, only one watch is active
    logActionExecutionError(
      "A watchLocation is already active. Clear it before before starting a new one",
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );

    return;
  }
  successChannel = channel();
  errorChannel = channel();
  yield spawn(successCallbackHandler);
  yield spawn(errorCallbackHandler);
  watchId = navigator.geolocation.watchPosition(
    (location) => {
      if (successChannel) {
        successChannel.put({
          location,
          callback: actionPayload.onSuccess,
          eventType,
          triggerMeta,
        });
      }
    },
    (error) => {
      // When location is turned off, the watch fails but watchId is generated
      // Resetting the watchId to undefined so that a new watch can be started
      if (watchId && error instanceof GeolocationPositionError) {
        navigator.geolocation.clearWatch(watchId);
        watchId = undefined;
      }

      if (errorChannel) {
        errorChannel.put({
          error,
          callback: actionPayload.onError,
          eventType,
          triggerMeta,
        });
      }
    },
    actionPayload.options,
  );
}

export function* stopWatchCurrentLocation(
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (watchId === undefined) {
    logActionExecutionError(
      "No location watch active",
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
    return;
  }
  navigator.geolocation.clearWatch(watchId);
  watchId = undefined;
  if (successChannel) {
    successChannel.close();
  }
  if (errorChannel) {
    errorChannel.close();
  }
}

function* startDebuggerSaga(action: ReduxAction<string>) {
  const code = action.payload;

  const sf = ts.createSourceFile(
    "test.js",
    code,
    ts.ScriptTarget.ES2017,
    true,
    ts.ScriptKind.JS,
  );
  const localVariables = new Set<string>();
  sf.forEachChild((n) => {
    if (ts.isVariableStatement(n)) {
      n.declarationList.declarations.forEach((decl) => {
        const name = decl.name.getText();
        localVariables.add(name);
      });
    }
  });

  const statusChannel = channel();
  const { port1, port2 } = setupSWBridge(statusChannel);

  const task1: Task = yield fork(listenForMessageFromSW, statusChannel);

  const task2: Task = yield fork(listenForMessagesFromMainThread, port1);

  //@ts-expect-error test
  const response = yield call(EvalWorker.request, EVAL_WORKER_ACTIONS.DEBUG, {
    code,
    localVariables: Array.from(localVariables),
  });

  port1.close();
  port2.close();
  yield cancel(task1);
  yield cancel(task2);
}

function* listenForMessageFromSW(channel: Channel<any>) {
  while (true) {
    const message: unknown = yield take(channel);
    debugger;
    yield put({
      type: "DEBUGGER_MESSAGE",
      payload: message,
    });
  }
}

function* listenForMessagesFromMainThread(port: MessagePort) {
  while (true) {
    yield take("NEXT_DEBUGGER_STEP");
    port.postMessage({ type: "next_debugger_step" });
  }
}

function setupSWBridge(channel: Channel<any>) {
  const messageChannel = new MessageChannel();

  navigator.serviceWorker.controller?.postMessage({ type: "start_debugger" }, [
    messageChannel.port2,
  ]);

  const messagePort = messageChannel.port1;

  messagePort.onmessage = (event) => {
    const { data } = event;
    console.log("Main thread", { data });
    channel.put(data);
  };

  return { port1: messagePort, port2: messageChannel.port2 };
}

export default function*() {
  yield takeLatest("DEBUG", startDebuggerSaga);
}
