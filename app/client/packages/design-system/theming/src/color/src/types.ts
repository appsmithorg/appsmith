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
    bgAssistive: string;
    bgNeutral: string;
    bgNeutralHover: string;
    bgNeutralActive: string;
    bgNeutralSubtleHover: string;
    bgNeutralSubtleActive: string;
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
    // fg
    fg: string;
    fgAccent: string;
    fgNeutral: string;
    fgNeutralSubtle: string;
    fgPositive: string;
    fgNegative: string;
    fgWarning: string;
    // fg on bg*
    fgOnAccent: string;
    fgOnAssistive: string;
    fgOnNeutral: string;
    fgOnPositive: string;
    fgOnNegative: string;
    fgOnWarning: string;
    // bd
    bdAccent: string;
    bdFocus: string;
    bdNeutral: string;
    bdNeutralHover: string;
    bdPositive: string;
    bdPositiveHover: string;
    bdNegative: string;
    bdNegativeHover: string;
    bdWarning: string;
    bdWarningHover: string;
    // bd on bg*
    bdOnAccent: string;
    bdOnNeutral: string;
    bdOnPositive: string;
    bdOnNegative: string;
    bdOnWarning: string;
  };
}
