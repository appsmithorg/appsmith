export type { ColorTypes } from "colorjs.io/types/src/color";

export type ColorMode = "light" | "dark";

export interface ColorModeTheme {
  getColors: () => {
    // bg
    bg: string;
    bgAccent: string;
    bgAccentHover: string;
    bgAccentActive: string;
    bgAccentSubtleHover: string;
    bgAccentSubtleActive: string;
    bgPositive: string;
    bgPositiveHover: string;
    bgPositiveActive: string;
    bgPositiveSubtleHover: string;
    bgPositiveSubtleActive: string;
    bgNegative: string;
    bgNegativeHover: string;
    bgNegativeActive: string;
    bgNegativeSubtleHover: string;
    bgNegativeSubtleActive: string;
    bgWarning: string;
    bgWarningHover: string;
    bgWarningActive: string;
    bgWarningSubtleHover: string;
    bgWarningSubtleActive: string;
    bgNeutral: string;
    bgNeutralHover: string;
    bgNeutralActive: string;
    bgNeutralSubtleHover: string;
    bgNeutralSubtleActive: string;
    // fg
    fg: string;
    fgAccent: string;
    fgNegative: string;
    fgNeutral: string;
    fgPositive: string;
    fgWarning: string;
    fgOnAccent: string;
    fgOnNeutral: string;
    fgOnPositive: string;
    fgOnWarning: string;
    fgOnNegative: string;
    fgOnAssistive: string;
    // bd
    bdAccent: string;
    bdFocus: string;
    bdNegative: string;
    bdNegativeHover: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdPositive: string;
    bdPositiveHover: string;
    bdWarning: string;
    bdWarningHover: string;
  };
}
