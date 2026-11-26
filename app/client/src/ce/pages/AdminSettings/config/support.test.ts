import type { User } from "constants/userConstants";
import { shouldRegisterSupport } from "./support";

jest.mock("ce/pages/AdminSettings/SupportDiagnostics", () => ({
  SupportDiagnosticsPage: () => null,
}));

const makeUser = (overrides: Partial<User>): User =>
  ({ isSuperUser: false, ...overrides }) as User;

describe("shouldRegisterSupport", () => {
  it("should_registerSupport_onlyForSuperUserWithoutMultiOrg", () => {
    expect(shouldRegisterSupport(makeUser({ isSuperUser: true }), false)).toBe(
      true,
    );
    expect(shouldRegisterSupport(makeUser({ isSuperUser: true }), true)).toBe(
      false,
    );
    expect(
      shouldRegisterSupport(
        makeUser({ isSuperUser: false, adminSettingsVisible: true }),
        false,
      ),
    ).toBe(false);
    expect(shouldRegisterSupport(undefined, false)).toBe(false);
  });
});
