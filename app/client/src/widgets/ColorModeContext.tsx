import { createContext, useContext } from "react";
import type { ResolvedColorMode } from "constants/AppConstants";

/**
 * Carries the resolved color mode ("LIGHT" | "DARK") for the published app down
 * to every classic widget, so widgets can pick dark-aware defaults via
 * {@link resolveWidgetColor} without each one wiring up to Redux.
 *
 * Provided once by the AppViewer; defaults to "LIGHT" everywhere else (e.g. the
 * editor canvas), preserving existing behaviour.
 */
export const ColorModeContext = createContext<ResolvedColorMode>("LIGHT");

export const useColorMode = (): ResolvedColorMode =>
  useContext(ColorModeContext);
