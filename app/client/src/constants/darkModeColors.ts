/**
 * Shared dark-mode constants for classic (non-Anvil) published apps.
 *
 * Dependency-free leaf module: the color-mode types live here (not in the heavy
 * constants/AppConstants) so widget/util modules can import them without an
 * import cycle.
 *
 * Palette: a modern, layered blue-gray dark theme (à la Linear / Vercel / GitHub
 * dark) — depth via lightness rather than pure black, softened text, and a
 * desaturated accent. Every dark default in the app references these semantic
 * tokens, so the whole theme can be tuned here in one place.
 */

// The effective color mode actually applied at render time.
export type ResolvedColorMode = "LIGHT" | "DARK";

// The developer-selected default; AUTO follows the end user's OS preference.
export type DarkModeDefault = "LIGHT" | "DARK" | "AUTO";

export const DARK_MODE_COLORS = {
  // --- Surfaces (elevation layers; each a few lightness points up) ---
  pageBackground: "#11131a", // outermost page canvas
  surface: "#181b24", // table body, base widget surfaces
  panel: "#202431", // containers, cards, form panels, table header
  control: "#262b3a", // inputs, buttons, dropdowns, steppers
  controlHover: "#30364a", // control hover / row hover
  selected: "#353b55", // selected rows / active controls

  // --- Borders ---
  borderSubtle: "#2b3040", // dividers, table grid lines
  borderDefault: "#3a4054", // input outlines, card edges
  borderStrong: "#515a76", // emphasized edges, focus-adjacent

  // --- Text ---
  text: "#e7eaf2", // primary — not pure white
  textSecondary: "#aeb5c6", // labels, placeholders, helper text
  textMuted: "#747d93", // disabled, faded metadata

  // --- Accent / status ---
  accent: "#6f63f4", // desaturated indigo (focus rings, derived highlights)
  accentHover: "#8177ff",
  danger: "#f06b6b", // muted red
};

/**
 * The dark preset, applied as the always-on baseline by `DarkModeGlobalStyles`
 * and used to seed the optional "Custom dark mode CSS" editor.
 *
 * Deliberately NARROW: it only redefines the `--wds-color-*` design tokens that
 * widgets already consume. It contains NO broad element selectors (no `button`,
 * `label`, `.bp3-*`, `div:has(...)`, etc.) — widgets that hardcode light
 * defaults are fixed in component code via `resolveWidgetColor` / `colorMode`
 * threading instead, which is more predictable and preserves developer colors.
 *
 * Note: `--wds-accent-color` is intentionally NOT overridden here so the
 * developer's brand/accent color is preserved in dark mode.
 */
export const DARK_MODE_PRESET_CSS = `--wds-color-bg: ${DARK_MODE_COLORS.control};
--wds-color-bg-hover: ${DARK_MODE_COLORS.controlHover};
--wds-color-bg-selected: ${DARK_MODE_COLORS.selected};
--wds-color-bg-focus: ${DARK_MODE_COLORS.selected};
--wds-color-bg-light: ${DARK_MODE_COLORS.panel};
--wds-color-bg-strong: ${DARK_MODE_COLORS.borderDefault};
--wds-color-bg-strong-hover: ${DARK_MODE_COLORS.borderStrong};
--wds-color-bg-disabled: ${DARK_MODE_COLORS.surface};
--wds-color-bg-disabled-light: ${DARK_MODE_COLORS.panel};
--wds-color-bg-disabled-strong: ${DARK_MODE_COLORS.borderDefault};
--wds-color-bg-danger: ${DARK_MODE_COLORS.danger};
--wds-color-bg-danger-hover: #d85f5f;

--wds-color-border: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-onaccent: rgba(255, 255, 255, 0.12);
--wds-color-border-light: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-hover: ${DARK_MODE_COLORS.borderDefault};
--wds-color-border-disabled: ${DARK_MODE_COLORS.borderSubtle};
--wds-color-border-danger: ${DARK_MODE_COLORS.danger};
--wds-color-border-danger-hover: #d85f5f;
--wds-color-border-danger-focus: ${DARK_MODE_COLORS.accent};
--wds-color-border-danger-focus-light: #3a2a3a;

--wds-color-icon: ${DARK_MODE_COLORS.textSecondary};
--wds-color-icon-disabled: ${DARK_MODE_COLORS.textMuted};
--wds-color-icon-hover: ${DARK_MODE_COLORS.text};

--wds-color-text: ${DARK_MODE_COLORS.text};
--wds-color-text-danger: ${DARK_MODE_COLORS.danger};
--wds-color-text-light: ${DARK_MODE_COLORS.textSecondary};
--wds-color-text-disabled: ${DARK_MODE_COLORS.textMuted};
--wds-color-text-disabled-light: ${DARK_MODE_COLORS.borderDefault};`;
