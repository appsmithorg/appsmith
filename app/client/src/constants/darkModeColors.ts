/**
 * Shared dark-mode constants for classic (non-Anvil) published apps.
 *
 * Dependency-free leaf module: the color-mode types live here (not in the heavy
 * constants/AppConstants) so widget/util modules can import them without an
 * import cycle.
 *
 * Palette: a modern layered blue-gray dark theme (à la Linear/Vercel/GitHub
 * dark) — elevation by lightness rather than pure black, softened text, and a
 * desaturated accent. Everything below references these tokens so the whole
 * theme can be tuned in one place.
 */

// The effective color mode actually applied at render time.
export type ResolvedColorMode = "LIGHT" | "DARK";

// The developer-selected default; AUTO follows the end user's OS preference.
export type DarkModeDefault = "LIGHT" | "DARK" | "AUTO";

export const DARK_MODE_COLORS = {
  // --- Surfaces (elevation layers; each ~8-10 lightness points up) ---
  pageBackground: "#0f1117", // outermost page canvas
  surface: "#1c1e26", // panels, cards, table body, containers
  elevated: "#252836", // inputs, form containers, dropdowns
  overlay: "#2e3146", // hover states, selected rows

  // --- Text ---
  text: "#e2e4ec", // primary — not pure white
  textSecondary: "#9095a8", // labels, placeholders, helper text
  textMuted: "#5c6070", // disabled, faded metadata

  // --- Borders ---
  borderSubtle: "#2a2d3a", // dividers, table grid lines
  borderDefault: "#3b3f52", // input outlines, card edges
  borderFocus: "#6b6ef0", // active focus ring

  // --- Accent / status ---
  accent: "#7b77f0", // desaturated indigo
  accentHover: "#8f8cf5",
  danger: "#e05c5c", // muted red

  // Slightly raised surface used for subtle table row striping.
  rowSurface: "#1c1e26",
};

/**
 * The dark preset expressed as editable CSS — the `--wds-color-*` overrides
 * plus a few element rules for widgets that hardcode literal colors (notably
 * text inputs, which ship a literal white background that no variable controls).
 *
 * Single source of truth: applied by `DarkModeGlobalStyles` as the always-on
 * baseline AND used to seed the "Custom dark mode CSS" editor, so developers see
 * exactly what's applied and can tweak it. Injected nested under the dark canvas
 * scope, so the element rules below are scoped to the published app's canvas.
 */
export const DARK_MODE_PRESET_CSS = `--wds-color-bg: ${DARK_MODE_COLORS.elevated};
--wds-color-bg-hover: ${DARK_MODE_COLORS.overlay};
--wds-color-bg-selected: ${DARK_MODE_COLORS.overlay};
--wds-color-bg-focus: ${DARK_MODE_COLORS.overlay};
--wds-color-bg-light: ${DARK_MODE_COLORS.surface};
--wds-color-bg-strong: ${DARK_MODE_COLORS.borderDefault};
--wds-color-bg-strong-hover: #4a4f66;
--wds-color-bg-disabled: ${DARK_MODE_COLORS.surface};
--wds-color-bg-disabled-light: ${DARK_MODE_COLORS.elevated};
--wds-color-bg-disabled-strong: ${DARK_MODE_COLORS.borderDefault};
--wds-color-bg-danger: ${DARK_MODE_COLORS.danger};
--wds-color-bg-danger-hover: #c94f4f;

--wds-color-border: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-onaccent: rgba(255, 255, 255, 0.12);
--wds-color-border-light: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-hover: ${DARK_MODE_COLORS.borderDefault};
--wds-color-border-disabled: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-danger: ${DARK_MODE_COLORS.danger};
--wds-color-border-danger-hover: #c94f4f;
--wds-color-border-danger-focus: ${DARK_MODE_COLORS.borderFocus};
--wds-color-border-danger-focus-light: #3b2a3a;

--wds-color-icon: ${DARK_MODE_COLORS.textSecondary};
--wds-color-icon-disabled: ${DARK_MODE_COLORS.textMuted};
--wds-color-icon-hover: ${DARK_MODE_COLORS.text};

--wds-color-text: ${DARK_MODE_COLORS.text};
--wds-color-text-danger: ${DARK_MODE_COLORS.danger};
--wds-color-text-light: ${DARK_MODE_COLORS.textSecondary};
--wds-color-text-disabled: ${DARK_MODE_COLORS.textMuted};
--wds-color-text-disabled-light: ${DARK_MODE_COLORS.borderDefault};

/* Text inputs hardcode a literal white background; force the elevated surface. */
.bp3-input, .bp3-input-group input, textarea.bp3-input {
  background: ${DARK_MODE_COLORS.elevated} !important;
  color: ${DARK_MODE_COLORS.text} !important;
  border-color: ${DARK_MODE_COLORS.borderDefault} !important;
}
.bp3-input::placeholder, textarea.bp3-input::placeholder {
  color: ${DARK_MODE_COLORS.textSecondary} !important;
}`;
