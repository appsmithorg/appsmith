import UsagePulse from "usagePulse";

describe("Usage pulse", () => {
  describe("isTrackableUrl", () => {
    it("should return true when called with trackable URL", () => {
      // All application URLS are trackable.

      [
        "https://dev.appsmith.com/app/test/mypage-123123/edit",
        "https://dev.appsmith.com/app/test/mypage-123123",
        "https://dev.appsmith.com/app/test-123123/edit",
        "https://dev.appsmith.com/app/test-123123",
        "https://dev.appsmith.com/applications/123123test/pages/123123test/edit",
        "https://dev.appsmith.com/applications/123123test/pages/123123test",
      ].forEach((url) => {
        expect(UsagePulse.isTrackableUrl(url)).toBeTruthy();
      });
    });

    it("should return false when called with untrackable URL", () => {
      [
        "https://dev.appsmith.com/applications",
        "https://dev.appsmith.com/login",
        "https://dev.appsmith.com/signup",
        "https://dev.appsmith.com/settings",
        "https://dev.appsmith.com/generate-page",
      ].forEach((url) => {
        expect(UsagePulse.isTrackableUrl(url)).toBeFalsy();
      });
    });
  });
});
