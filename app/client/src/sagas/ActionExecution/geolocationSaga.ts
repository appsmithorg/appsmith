import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import { call, put, spawn, take } from "redux-saga/effects";
import { showToastOnExecutionError } from "sagas/ActionExecution/errorUtils";
import { setUserCurrentGeoLocation } from "actions/browserRequestActions";
import type { Channel } from "redux-saga";
import { channel } from "redux-saga";
import { evalWorker } from "sagas/EvaluationsSaga";
import type {
  TGetGeoLocationDescription,
  TWatchGeoLocationDescription,
} from "workers/Evaluation/fns/geolocationFns";

class GeoLocationError extends Error {
  constructor(
    message: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private responseData?: any,
  ) {
    super(message);
  }
}

let successChannel: Channel<GeolocationPosition> | null = null;
let errorChannel: Channel<GeolocationPositionError> | null = null;

// Making the getCurrentPosition call in a promise fashion
export const getUserLocation = async (options?: PositionOptions) =>
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
function sanitizeGeolocationError(error: GeolocationPositionError) {
  return {
    code: error.code,
    message: error.message,
  };
}

function* successCallbackHandler(listenerId?: string) {
  let payload: GeolocationPosition;

  if (!successChannel) return;

  while ((payload = yield take(successChannel))) {
    const currentLocation = extractGeoLocation(payload);

    yield put(setUserCurrentGeoLocation(currentLocation));

    if (listenerId)
      yield call(evalWorker.ping, { data: currentLocation }, listenerId);
  }
}

function* errorCallbackHandler(triggerMeta: TriggerMeta, listenerId?: string) {
  if (!errorChannel) return;

  let error: GeolocationPositionError;

  while ((error = yield take(errorChannel))) {
    if (listenerId)
      yield call(
        evalWorker.ping,
        { error: sanitizeGeolocationError(error) },
        listenerId,
      );

    yield call(showToastOnExecutionError, error.message);
  }
}

export function* getCurrentLocationSaga(action: TGetGeoLocationDescription) {
  const { payload: actionPayload } = action;

  try {
    const location: GeolocationPosition = yield call(
      getUserLocation,
      actionPayload.options,
    );
    const currentLocation = extractGeoLocation(location);

    yield put(setUserCurrentGeoLocation(currentLocation));

    return currentLocation;
  } catch (error) {
    yield call(showToastOnExecutionError, (error as Error).message);

    if (error instanceof GeolocationPositionError) {
      const sanitizedError = sanitizeGeolocationError(error);

      throw new GeoLocationError(sanitizedError.message, [sanitizedError]);
    }
  }
}

let watchId: number | undefined;

export function* watchCurrentLocation(
  action: TWatchGeoLocationDescription,
  _: EventType,
  triggerMeta: TriggerMeta,
) {
  const { payload: actionPayload } = action;

  if (watchId) {
    // When a watch is already active, we will not start a new watch.
    // at a given point in time, only one watch is active
    yield call(
      showToastOnExecutionError,
      "A watchLocation is already active. Clear it before before starting a new one",
    );

    return;
  }

  successChannel = channel<GeolocationPosition>();
  errorChannel = channel<GeolocationPositionError>();
  yield spawn(successCallbackHandler, actionPayload.listenerId);
  yield spawn(errorCallbackHandler, triggerMeta, actionPayload.listenerId);
  watchId = navigator.geolocation.watchPosition(
    (location) => {
      successChannel?.put(location);
    },
    (error) => {
      // When location is turned off, the watch fails but watchId is generated
      // Resetting the watchId to undefined so that a new watch can be started
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = undefined;
      }

      errorChannel?.put(error);
    },
    actionPayload.options,
  );
}

export function* stopWatchCurrentLocation() {
  if (watchId === undefined) {
    yield call(showToastOnExecutionError, "No location watch active");

    return;
  }

  navigator.geolocation.clearWatch(watchId);
  watchId = undefined;
  successChannel?.close();
  errorChannel?.close();
}
