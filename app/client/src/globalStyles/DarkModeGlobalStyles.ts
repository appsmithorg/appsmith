import { createGlobalStyle } from "styled-components";
import { CANVAS_SELECTOR } from "constants/WidgetConstants";
import { DARK_MODE_COLORS } from "constants/darkModeColors";

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
  ${SCOPE} {
    --wds-color-border: #3a3a3a;
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
    --wds-color-text-disabled-light: #555555;
  }

  ${({ customCss }) => (customCss ? `${SCOPE} { ${customCss} }` : "")}
`;
