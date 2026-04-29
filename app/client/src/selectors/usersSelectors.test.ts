import { getShouldShowBaseUrlMissingBanner } from "./usersSelectors";

// Minimal Redux state shape; the selector only reads ui.users.currentUser.
const stateWith = (currentUser: object | null) =>
  ({ ui: { users: { currentUser } } }) as never;

describe("getShouldShowBaseUrlMissingBanner — GHSA-j9gf-vw2f-9hrw", () => {
  it("returns true for super user with admin settings visible and unhealthy config", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith({
          isSuperUser: true,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(true);
  });

  it("returns false when configuration is healthy", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith({
          isSuperUser: true,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: true,
        }),
      ),
    ).toBe(false);
  });

  it("returns false for non-super-user", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith({
          isSuperUser: false,
          adminSettingsVisible: true,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when admin settings hidden (RBAC / license guard)", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith({
          isSuperUser: true,
          adminSettingsVisible: false,
          instanceBaseUrlConfigurationHealthy: false,
        }),
      ),
    ).toBe(false);
  });

  // Rolling-deploy safety: newer client paired briefly with older server.
  // Field absent => banner must stay hidden, not flip on as a false positive.
  it("returns false when health field is missing (rolling deploy)", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith({
          isSuperUser: true,
          adminSettingsVisible: true,
        }),
      ),
    ).toBe(false);
  });

  it("returns false when currentUser is null", () => {
    expect(getShouldShowBaseUrlMissingBanner(stateWith(null))).toBe(false);
  });
});
