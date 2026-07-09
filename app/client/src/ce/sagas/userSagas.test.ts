import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { shouldTrackUser } from "ee/sagas/userSagas";

const makeUser = (overrides: Partial<User>): User =>
  ({
    isAnonymous: false,
    username: "user@example.com",
    ...overrides,
  }) as User;

describe("shouldTrackUser", () => {
  it("tracks a non-anonymous user regardless of the block flag", () => {
    const user = makeUser({ isAnonymous: false, username: "user@example.com" });

    expect(shouldTrackUser(user, false)).toBe(true);
    expect(shouldTrackUser(user, true)).toBe(true);
  });

  it("tracks an anonymous user when telemetry is on and the flag is off", () => {
    const user = makeUser({ isAnonymous: true, enableTelemetry: true });

    expect(shouldTrackUser(user, false)).toBe(true);
  });

  it("does not track an anonymous user when the block flag is on (even with telemetry on)", () => {
    // Regression guard: previously an active license bypassed the flag here.
    const user = makeUser({ isAnonymous: true, enableTelemetry: true });

    expect(shouldTrackUser(user, true)).toBe(false);
  });

  it("does not track an anonymous user when telemetry is off", () => {
    const user = makeUser({ isAnonymous: true, enableTelemetry: false });

    expect(shouldTrackUser(user, false)).toBe(false);
  });

  it("treats a user named anonymousUser as anonymous", () => {
    const user = makeUser({
      isAnonymous: false,
      username: ANONYMOUS_USERNAME,
      enableTelemetry: true,
    });

    expect(shouldTrackUser(user, true)).toBe(false);
  });
});
