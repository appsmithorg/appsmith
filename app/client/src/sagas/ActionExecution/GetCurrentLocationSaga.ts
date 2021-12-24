import {
  GetCurrentLocationDescription,
  WatchCurrentLocationDescription,
} from "entities/DataTree/actionTriggers";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { call, put, spawn, take } from "redux-saga/effects";
import {
  logActionExecutionError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { setUserCurrentGeoLocation } from "actions/browserRequestActions";
import { Channel, channel } from "redux-saga";

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
const extractGeoLocation = (
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

let successChannel: Channel<any> | undefined;
let errorChannel: Channel<any> | undefined;

function* successCallbackHandler() {
  if (successChannel) {
    while (true) {
      const payload = yield take(successChannel);
      const { callback, eventType, location, triggerMeta } = payload;
      const currentLocation = extractGeoLocation(location);
      yield put(setUserCurrentGeoLocation(currentLocation));
      if (callback) {
        yield call(executeAppAction, {
          dynamicString: callback,
          responseData: [currentLocation],
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
      const payload = yield take(errorChannel);
      const { callback, error, eventType, triggerMeta } = payload;
      if (callback) {
        yield call(executeAppAction, {
          dynamicString: callback,
          responseData: [error],
          event: { type: eventType },
          triggerPropertyName: triggerMeta.triggerPropertyName,
          source: triggerMeta.source,
        });
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
    return [currentLocation];
  } catch (e) {
    logActionExecutionError(
      e.message,
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
