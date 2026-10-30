import { getResolvedThemeMode, ThemeMode } from "./themeSelectors";

describe("getResolvedThemeMode", () => {
  let originalMatchMedia: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  });

  afterEach(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
  });

  it("returns explicitly selected light and dark modes", () => {
    expect(getResolvedThemeMode(ThemeMode.LIGHT)).toBe(ThemeMode.LIGHT);
    expect(getResolvedThemeMode(ThemeMode.DARK)).toBe(ThemeMode.DARK);
  });

  it("uses the system color preference when system mode is selected", () => {
    const matchMedia = jest.fn().mockReturnValue({ matches: true });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia,
    });

    expect(getResolvedThemeMode(ThemeMode.SYSTEM)).toBe(ThemeMode.DARK);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });

  it("falls back to light mode when system preference is unavailable", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    expect(getResolvedThemeMode(ThemeMode.SYSTEM)).toBe(ThemeMode.LIGHT);
  });
});
