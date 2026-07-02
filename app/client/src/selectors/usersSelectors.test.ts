import { getShouldShowBaseUrlMissingBanner } from "./usersSelectors";

// Minimal Redux state shape; the selector reads ui.users.currentUser AND
// organization.organizationConfiguration.
const stateWith = (
  currentUser: object | null,
  orgConfig: object | undefined = undefined,
) =>
  ({
    ui: { users: { currentUser } },
    organization: orgConfig
      ? { organizationConfiguration: orgConfig }
      : undefined,
  }) as never;

const SUPER_ADMIN = {
  isSuperUser: true,
  adminSettingsVisible: true,
};

describe("getShouldShowBaseUrlMissingBanner — GHSA-j9gf-vw2f-9hrw", () => {
  it("returns true for super user with admin settings visible and unhealthy org config", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith(SUPER_ADMIN, { instanceBaseUrlConfigurationHealthy: false }),
      ),
    ).toBe(true);
  });

  it("returns false when org config is healthy", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith(SUPER_ADMIN, { instanceBaseUrlConfigurationHealthy: true }),
      ),
    ).toBe(false);
  });

  it("returns false for non-super-user", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith(
          { isSuperUser: false, adminSettingsVisible: true },
          { instanceBaseUrlConfigurationHealthy: false },
        ),
      ),
    ).toBe(false);
  });

  it("returns false when admin settings hidden (RBAC / license guard)", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith(
          { isSuperUser: true, adminSettingsVisible: false },
          { instanceBaseUrlConfigurationHealthy: false },
        ),
      ),
    ).toBe(false);
  });

  // Rolling-deploy safety: newer client briefly paired with older server has the
  // health field absent on org config. Banner must stay hidden, not flip on as a
  // false positive.
  it("returns false when health field is missing from org config (rolling deploy)", () => {
    expect(getShouldShowBaseUrlMissingBanner(stateWith(SUPER_ADMIN, {}))).toBe(
      false,
    );
  });

  it("returns false when org config is missing entirely", () => {
    expect(getShouldShowBaseUrlMissingBanner(stateWith(SUPER_ADMIN))).toBe(
      false,
    );
  });

  it("returns false when currentUser is null", () => {
    expect(
      getShouldShowBaseUrlMissingBanner(
        stateWith(null, { instanceBaseUrlConfigurationHealthy: false }),
      ),
    ).toBe(false);
  });
});
