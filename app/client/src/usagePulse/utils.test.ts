import { getUsagePulsePayload } from "./utils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { FALLBACK_KEY } from "ee/constants/UsagePulse";
import { APP_MODE } from "entities/App";

jest.mock("store", () => ({
  __esModule: true,
  default: { getState: jest.fn(() => ({})) },
}));

jest.mock("ee/selectors/entitiesSelector", () => ({
  getAppMode: jest.fn(() => APP_MODE.EDIT),
}));

jest.mock("ee/utils/AnalyticsUtil", () => ({
  __esModule: true,
  default: { getAnonymousId: jest.fn() },
}));

const getAnonymousIdMock = AnalyticsUtil.getAnonymousId as jest.Mock;

describe("getUsagePulsePayload", () => {
  beforeEach(() => {
    localStorage.clear();
    getAnonymousIdMock.mockReset();
  });

  it("does not attach an anonymousUserId for logged-in users", () => {
    getAnonymousIdMock.mockReturnValue("segment-id");

    const payload = getUsagePulsePayload(true, false);

    expect(payload).not.toHaveProperty("anonymousUserId");
  });

  it("uses Segment's anonymous id when telemetry is enabled and it is available", () => {
    getAnonymousIdMock.mockReturnValue("segment-id");

    const payload = getUsagePulsePayload(true, true);

    expect(payload["anonymousUserId"]).toBe("segment-id");
    // Segment id should not be persisted as the local fallback.
    expect(localStorage.getItem(FALLBACK_KEY)).toBeNull();
  });

  // "Unavailable" is defined as null or undefined — the two values
  // AnalyticsUtil.getAnonymousId() returns when no Segment user exists.
  it.each([undefined, null])(
    "falls back to a locally persisted id when telemetry is enabled but Segment's id is %s",
    (segmentId) => {
      getAnonymousIdMock.mockReturnValue(segmentId);

      const payload = getUsagePulsePayload(true, true);

      const fallback = localStorage.getItem(FALLBACK_KEY);

      expect(fallback).toBeTruthy();
      expect(payload["anonymousUserId"]).toBe(fallback);
    },
  );

  it("uses the local fallback id when telemetry is disabled", () => {
    getAnonymousIdMock.mockReturnValue("segment-id");

    const payload = getUsagePulsePayload(false, true);

    const fallback = localStorage.getItem(FALLBACK_KEY);

    expect(fallback).toBeTruthy();
    expect(payload["anonymousUserId"]).toBe(fallback);
    // Segment's id must not be used on the telemetry-disabled path.
    expect(payload["anonymousUserId"]).not.toBe("segment-id");
    // getAnonymousId is Segment-coupled and should not be consulted here.
    expect(getAnonymousIdMock).not.toHaveBeenCalled();
  });

  it("still returns an id when localStorage is unavailable", () => {
    getAnonymousIdMock.mockReturnValue(undefined);

    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    try {
      const payload = getUsagePulsePayload(true, true);

      expect(payload["anonymousUserId"]).toBeTruthy();
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it("reuses the same fallback id across pulses", () => {
    getAnonymousIdMock.mockReturnValue(undefined);

    const first = getUsagePulsePayload(true, true);
    const second = getUsagePulsePayload(false, true);

    expect(first["anonymousUserId"]).toBe(second["anonymousUserId"]);
  });
});
