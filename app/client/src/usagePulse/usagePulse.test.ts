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
      ].forEach((url) => {
        expect(UsagePulse.isTrackableUrl(url)).toBeFalsy();
      });
    });
  });
});
