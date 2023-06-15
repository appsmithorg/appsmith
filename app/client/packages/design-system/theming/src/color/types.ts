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
    fg: string;
    fgNeutral: string;
    fgPositive: string;
    fgWarn: string;
    fgAccent: string;
    fgOnAccent: string;
    bdAccent: string;
    bdFocus: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdNegative: string;
    bdNegativeHover: string;
    fgOnAssistive: string;
    bgAssistive: string;
  };
}
