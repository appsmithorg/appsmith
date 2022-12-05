import { call } from "redux-saga/effects";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { executeAppAction } from "./ActionExecutionSagas";
import {
  extractGeoLocation,
  getCurrentLocationSaga,
} from "./GetCurrentLocationSaga";

describe("getCurrentLocationSaga", () => {
  beforeAll(() => {
    class GeolocationPositionErrorClass extends Error {
      readonly code!: number;
      readonly message!: string;
      readonly PERMISSION_DENIED!: number;
      readonly POSITION_UNAVAILABLE!: number;
      readonly TIMEOUT!: number;

      constructor(msg?: string) {
        super(msg);
      }
    }

    Object.defineProperty(global, "GeolocationPositionError", {
      value: GeolocationPositionErrorClass,
    });
  });

  it("should call the onSuccess callback with the current location", () => {
    const onSuccessCallback = jest.fn();
    const onErrorCallback = jest.fn();
    const options = { enableHighAccuracy: true };
    const payload = {
      onSuccess: onSuccessCallback.toString(),
      onError: onErrorCallback.toString(),
      options,
    };

    const location = {
      coords: {
        accuracy: 0,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        latitude: 0,
        longitude: 0,
        speed: 0,
      },
      timestamp: 0,
    };

    const currentLocation = extractGeoLocation(location);

    const iter = getCurrentLocationSaga(payload, EventType.ON_CLICK, {});

    // For the call to getUserLocation
    // The first value sent to next is always lost
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next
    iter.next();

    // For setUserCurrentGeoLocation yield
    // Pass the location that should be returned in the first yield
    iter.next(location);

    // For actual executeAppAction yield
    expect(iter.next().value).toEqual(
      call(executeAppAction, {
        dynamicString: payload.onSuccess,
        event: { type: EventType.ON_CLICK },
        callbackData: [currentLocation],
        source: undefined,
        triggerPropertyName: undefined,
      }),
    );

    // for the return statement
    iter.next();

    expect(iter.next().done).toBe(true);
  });

  it("should call the onError callback when there is an error", () => {
    const onSuccessCallback = jest.fn();
    const onErrorCallback = jest.fn();
    const options = { enableHighAccuracy: true };
    const payload = {
      onSuccess: onSuccessCallback.toString(),
      onError: onErrorCallback.toString(),
      options,
    };

    const iter = getCurrentLocationSaga(payload, EventType.ON_CLICK, {});

    // First value sent to next is lost
    iter.next();

    // Let's not pass the location this time to next to create an error
    expect(iter.next().value).toEqual(
      call(executeAppAction, {
        dynamicString: payload.onError,
        event: { type: EventType.ON_CLICK },
        callbackData: [
          new TypeError(
            "Cannot read properties of undefined (reading 'coords')",
          ),
        ],
        source: undefined,
        triggerPropertyName: undefined,
      }),
    );

    expect(iter.next().done).toBe(true);
  });
});
