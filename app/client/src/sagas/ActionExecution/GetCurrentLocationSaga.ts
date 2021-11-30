import {
  GetCurrentLocationDescription,
  WatchCurrentLocationDescription,
} from "entities/DataTree/actionTriggers";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";
import { call, put } from "redux-saga/effects";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";
import { setUserCurrentGeoLocation } from "actions/browserRequestActions";
import store from "store";

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
    throw new TriggerFailureError(e.message, triggerMeta, e);
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
    return;
  }
  watchId = navigator.geolocation.watchPosition(
    (location) => {
      const currentLocation = extractGeoLocation(location);
      store.dispatch(setUserCurrentGeoLocation(currentLocation));
    },
    (error) => {
      throw new TriggerFailureError(error.message, triggerMeta);
    },
    actionPayload.options,
  );
}

export function* stopWatchCurrentLocation(
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  if (watchId === undefined) {
    throw new TriggerFailureError("No location watch active", triggerMeta);
  }
  navigator.geolocation.clearWatch(watchId);
  watchId = undefined;
}
