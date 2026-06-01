import { resolveColorMode } from "./colorModeResolution";

describe("resolveColorMode", () => {
  const base = {
    appId: "appA",
    liveMode: null,
    allowEndUserSwitch: false,
    defaultMode: "LIGHT" as const,
    osMode: "LIGHT" as const,
  };

  it("uses the developer default when there is no live choice", () => {
    expect(resolveColorMode({ ...base, defaultMode: "LIGHT" })).toBe("LIGHT");
    expect(resolveColorMode({ ...base, defaultMode: "DARK" })).toBe("DARK");
  });

  it("follows the OS preference for AUTO", () => {
    expect(
      resolveColorMode({ ...base, defaultMode: "AUTO", osMode: "DARK" }),
    ).toBe("DARK");
    expect(
      resolveColorMode({ ...base, defaultMode: "AUTO", osMode: "LIGHT" }),
    ).toBe("LIGHT");
  });

  it("honors the live end-user choice for the current app when switching is allowed", () => {
    expect(
      resolveColorMode({
        ...base,
        allowEndUserSwitch: true,
        liveMode: { appId: "appA", mode: "DARK" },
      }),
    ).toBe("DARK");
  });

  it("ignores a live choice made in a DIFFERENT app (no cross-app leakage)", () => {
    expect(
      resolveColorMode({
        ...base,
        appId: "appB",
        defaultMode: "LIGHT",
        allowEndUserSwitch: true,
        liveMode: { appId: "appA", mode: "DARK" },
      }),
    ).toBe("LIGHT");
  });

  it("ignores the live choice when switching is not allowed", () => {
    expect(
      resolveColorMode({
        ...base,
        allowEndUserSwitch: false,
        defaultMode: "LIGHT",
        liveMode: { appId: "appA", mode: "DARK" },
      }),
    ).toBe("LIGHT");
  });
});
