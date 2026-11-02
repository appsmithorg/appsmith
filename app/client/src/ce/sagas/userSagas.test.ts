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
  it("tracks a signed-in user", () => {
    const user = makeUser({ isAnonymous: false, username: "user@example.com" });

    expect(shouldTrackUser(user)).toBe(true);
  });

  it("does not track an anonymous user, even with telemetry on", () => {
    const user = makeUser({ isAnonymous: true, enableTelemetry: true });

    expect(shouldTrackUser(user)).toBe(false);
  });

  it("does not track an anonymous user with telemetry off", () => {
    const user = makeUser({ isAnonymous: true, enableTelemetry: false });

    expect(shouldTrackUser(user)).toBe(false);
  });

  it("treats a user named anonymousUser as anonymous", () => {
    const user = makeUser({
      isAnonymous: false,
      username: ANONYMOUS_USERNAME,
      enableTelemetry: true,
    });

    expect(shouldTrackUser(user)).toBe(false);
  });
});
