import { createGlobalStyle } from "styled-components";
import { CANVAS_SELECTOR } from "constants/WidgetConstants";
import { DARK_MODE_PRESET_CSS } from "constants/darkModeColors";

// The preset rules below are nested under the canvas root that carries
// `data-theme="dark"` so they apply only inside the published app's canvas in
// dark mode, not the editor chrome or the app header.
const SCOPE = `.${CANVAS_SELECTOR}[data-theme="dark"]`;

/**
 * Injects the curated dark preset for classic (non-Anvil) published apps.
 *
 * Layer 1 — redefines every `--wds-color-*` token (mirrors `theme/wds.css`)
 * with dark values, so the ~40% of widget styling that already consumes these
 * variables flips automatically (borders, hover/disabled backgrounds, icons).
 *
 * Layer 2 — the developer's optional raw `customCss`, injected last so it wins
 * the cascade. CONTRACT: `customCss` is trusted developer input (the builder
 * already controls their whole app). Well-formed rules are nested under SCOPE
 * by stylis; we do NOT guarantee containment against deliberately malformed
 * CSS (e.g. an unbalanced `}`), so a developer can only ever break the styling
 * of their own published app — never another app or the editor.
 *
 * Per-widget literal colors (Text/Container/Table/etc.) are handled separately
 * via `resolveWidgetColor` + `ColorModeContext`, not here.
 */
export const DarkModeGlobalStyles = createGlobalStyle<{
  customCss?: string;
}>`
  ${SCOPE} { ${DARK_MODE_PRESET_CSS} }

  ${({ customCss }) => (customCss ? `${SCOPE} { ${customCss} }` : "")}
`;
