export type { ColorTypes } from "colorjs.io/types/src/color";

export type ColorMode = "light" | "dark";

export interface ColorModeTheme {
  getColors: () => {
    bg: string;
    bgAccent: string;
    bgAccentHover: string;
    bgAccentActive: string;
    bgAccentSubtleHover: string;
    bgAccentSubtleActive: string;
    bgAssistive: string;
    bgNegative: string;
    bgPositive: string;
    fg: string;
    fgAccent: string;
    fgNegative: string;
    fgNeutral: string;
    fgOnAccent: string;
    fgOnAssistive: string;
    fgPositive: string;
    fgWarn: string;
    bdAccent: string;
    bdFocus: string;
    bdNegative: string;
    bdNegativeHover: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdPositive: string;
    bdPositiveHover: string;
  };
}
