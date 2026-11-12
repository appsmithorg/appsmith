import { renderHook } from "@testing-library/react-hooks";
import { objectKeys } from "@appsmith/utils";
import type { ThemeSetting } from "constants/AppConstants";
import { defaultThemeSetting } from "constants/AppConstants";
import { useWDSThemeProps } from "ee/hooks/useWDSThemeProps";

describe("useWDSThemeProps (CE)", () => {
  it("maps the five theme fields to WDS theme props", () => {
    const themeSetting: ThemeSetting = {
      ...defaultThemeSetting,
      accentColor: "#ff0000",
      borderRadius: "4px",
      colorMode: "DARK",
      sizing: 1.25,
      density: 0.75,
    };

    const { result } = renderHook(() => useWDSThemeProps(themeSetting));

    expect(result.current).toEqual({
      borderRadius: "4px",
      seedColor: "#ff0000",
      colorMode: "dark",
      userSizing: 1.25,
      userDensity: 0.75,
    });
  });

  it("returns exactly the five keys and ignores other theme fields", () => {
    const { result } = renderHook(() => useWDSThemeProps(defaultThemeSetting));

    expect(objectKeys(result.current ?? {}).sort()).toEqual([
      "borderRadius",
      "colorMode",
      "seedColor",
      "userDensity",
      "userSizing",
    ]);
  });

  it("leaves a prop undefined when its theme field is missing", () => {
    const partial = { colorMode: "LIGHT" } as ThemeSetting;

    const { result } = renderHook(() => useWDSThemeProps(partial));

    expect(result.current).toEqual({
      borderRadius: undefined,
      seedColor: undefined,
      colorMode: "light",
      userSizing: undefined,
      userDensity: undefined,
    });
  });

  it("updates the props when a theme field changes", () => {
    const { rerender, result } = renderHook(
      ({ setting }: { setting: ThemeSetting }) => useWDSThemeProps(setting),
      { initialProps: { setting: defaultThemeSetting } },
    );

    rerender({ setting: { ...defaultThemeSetting, colorMode: "DARK" } });

    expect(result.current?.colorMode).toBe("dark");
  });
});
