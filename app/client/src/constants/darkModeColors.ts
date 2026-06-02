/**
 * Shared dark-mode constants for classic (non-Anvil) published apps.
 *
 * This is a dependency-free leaf module: the color-mode types live here (rather
 * than in the heavy `constants/AppConstants`) so widget/util modules can import
 * them without creating an import cycle back through AppConstants.
 */

// The effective color mode actually applied at render time.
export type ResolvedColorMode = "LIGHT" | "DARK";

// The developer-selected default; AUTO follows the end user's OS preference.
export type DarkModeDefault = "LIGHT" | "DARK" | "AUTO";

/**
 * Shared dark-mode color palette. Referenced by the dark preset stylesheet
 * (`globalStyles/DarkModeGlobalStyles`), the viewer page background, and the
 * per-widget dark defaults resolved via `resolveWidgetColor`. Keeping them in
 * one place avoids the same hex literal drifting across widgets.
 */
export const DARK_MODE_COLORS = {
  // Page canvas behind all widgets — the darkest layer.
  pageBackground: "#0f0f0f",
  // Default widget surface (containers, primary buttons, table base).
  surface: "#1a1a1a",
  // Slightly raised surface used for table row striping.
  rowSurface: "#1e1e1e",
  // Primary readable text on dark surfaces.
  text: "#e6e6e6",
};

/**
 * The dark preset expressed as editable CSS (the `--wds-color-*` overrides).
 * Single source of truth: applied by `DarkModeGlobalStyles` AND used to seed the
 * "Custom dark mode CSS" editor, so developers see exactly what's applied and
 * can tweak the values instead of starting from a blank box.
 */
export const DARK_MODE_PRESET_CSS = `--wds-color-border: #3a3a3a;
--wds-color-border-onaccent: rgba(255, 255, 255, 0.3);
--wds-color-border-light: #4a4a4a;
--wds-color-border-hover: #555555;
--wds-color-border-disabled: #3a3a3a;
--wds-color-border-danger: #e5484d;
--wds-color-border-danger-hover: #f2555a;
--wds-color-border-danger-focus: #f2555a;
--wds-color-border-danger-focus-light: #5a2a2c;

--wds-color-bg: ${DARK_MODE_COLORS.surface};
--wds-color-bg-hover: #2a2a2a;
--wds-color-bg-selected: #2f2f2f;
--wds-color-bg-focus: #333333;
--wds-color-bg-light: #262626;
--wds-color-bg-strong: #3a3a3a;
--wds-color-bg-strong-hover: #4a4a4a;
--wds-color-bg-disabled: #2a2a2a;
--wds-color-bg-disabled-light: #333333;
--wds-color-bg-disabled-strong: #555555;
--wds-color-bg-danger: #e5484d;
--wds-color-bg-danger-hover: #f2555a;

--wds-color-icon: #b0b0b0;
--wds-color-icon-disabled: #6a6a6a;
--wds-color-icon-hover: #d6d6d6;

--wds-color-text: ${DARK_MODE_COLORS.text};
--wds-color-text-danger: #f2555a;
--wds-color-text-light: #a0a0a0;
--wds-color-text-disabled: #6a6a6a;
--wds-color-text-disabled-light: #555555;`;
