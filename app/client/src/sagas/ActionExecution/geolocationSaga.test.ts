import { call, put } from "redux-saga/effects";
import {
  extractGeoLocation,
  getCurrentLocationSaga,
  getUserLocation,
} from "./geolocationSaga";
import { setUserCurrentGeoLocation } from "actions/browserRequestActions";
import { showToastOnExecutionError } from "./errorUtils";

const mockFn = jest.fn();

jest.mock("./errorUtils.ts", () => ({
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showToastOnExecutionError: (payload: any) => mockFn(payload),
}));

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
    const options = { enableHighAccuracy: true };
    const payload = {
      options,
    };
    const trigger = {
      type: "GET_CURRENT_LOCATION" as const,
      payload,
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

    const iter = getCurrentLocationSaga(trigger);

    expect(iter.next().value).toEqual(call(getUserLocation, payload.options));

    // For setUserCurrentGeoLocation yield
    // Pass the location that should be returned in the first yield
    expect(iter.next(location).value).toEqual(
      put(setUserCurrentGeoLocation(currentLocation)),
    );

    expect(iter.next().done).toBe(true);
  });

  it("should call the onError callback when there is an error", () => {
    const options = { enableHighAccuracy: true };
    const payload = {
      options,
    };
    const trigger = {
      type: "GET_CURRENT_LOCATION" as const,
      payload,
    };
    const iter = getCurrentLocationSaga(trigger);

    expect(iter.next().value).toEqual(call(getUserLocation, payload.options));

    expect(iter.next().value).toHaveProperty(
      "payload.fn",
      showToastOnExecutionError,
    );
    expect(iter.next().done).toBe(true);
  });
});
