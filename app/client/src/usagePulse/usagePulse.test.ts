import UsagePulse from "usagePulse";

describe("Usage pulse", () => {
  describe("isTrackableUrl", () => {
    it("should return true when called with trackable URL", () => {
      // All application URLS are trackable.

      [
        "/app/test/mypage-123123/edit",
        "/app/test/mypage-123123",
        "/app/test-123123/edit",
        "/app/test-123123",
        "/applications/123123test/pages/123123test/edit",
        "/applications/123123test/pages/123123test",
      ].forEach((url) => {
        expect(UsagePulse.isTrackableUrl(url)).toBeTruthy();
      });
    });

    it("should return false when called with untrackable URL", () => {
      [
        "/applications",
        "/login",
        "/signup",
        "/settings",
        "/generate-page",
      ].forEach(async (url) => {
        expect(await UsagePulse.isTrackableUrl(url)).toBeFalsy();
      });
    });
  });

  describe("sendPulseAndScheduleNext", () => {
    let sendPulseSpy: jest.SpyInstance;
    let scheduleNextActivityListenersSpy: jest.SpyInstance;

    beforeEach(() => {
      sendPulseSpy = jest
        .spyOn(UsagePulse, "sendPulse")
        .mockImplementation(() => {});
      scheduleNextActivityListenersSpy = jest
        .spyOn(UsagePulse, "scheduleNextActivityListeners")
        .mockImplementation(() => {});
      UsagePulse.isAirgapped = false;
    });

    it("should not send pulse or schedule next when airgapped", () => {
      UsagePulse.isAirgapped = true;
      UsagePulse.sendPulseAndScheduleNext();

      expect(sendPulseSpy).not.toHaveBeenCalled();
      expect(scheduleNextActivityListenersSpy).not.toHaveBeenCalled();
    });

    it("should send pulse and schedule next activity listeners when not airgapped", () => {
      UsagePulse.sendPulseAndScheduleNext();

      expect(sendPulseSpy).toHaveBeenCalledTimes(1);
      expect(scheduleNextActivityListenersSpy).toHaveBeenCalledTimes(1);
    });
  });
});
