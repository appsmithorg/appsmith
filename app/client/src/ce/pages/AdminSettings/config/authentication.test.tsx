import { FormAuth } from "./authentication";

describe("FormAuth form signup toggle", () => {
  it("has a label that does not change with the toggle state", () => {
    const signupSetting = FormAuth.settings?.find(
      (setting) => setting.id === "isSignupDisabled",
    );

    expect(signupSetting).toBeDefined();
    // The toggle text must describe what the setting does, not the current
    // state — a state-dependent label reads as the option itself changing.
    expect(signupSetting?.toggleText?.(true)).toEqual(
      signupSetting?.toggleText?.(false),
    );
    // Pin the wording: the label must describe the ON state (open signup).
    // A static "invited only" label would invert the meaning of the switch.
    expect(signupSetting?.toggleText?.(false)).toEqual(
      "Allow all users to signup",
    );
  });
});
