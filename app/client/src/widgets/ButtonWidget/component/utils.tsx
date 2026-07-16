import { css } from "styled-components";
import tinycolor from "tinycolor2";
import validateColor from "validate-color";

import { ButtonVariantTypes } from "components/constants";
import { getCustomHoverColor } from "widgets/WidgetUtils";
import type { ButtonContainerProps } from "./DragContainer";

/*
  Created a css util so that we don't repeat our styles.
  Add more styles in the future also make sure you pass the
  same props to the ButtonContainerProps, because we have to
  repeat on the button and the container.
*/

export const buttonHoverActiveStyles = css<ButtonContainerProps>`
  ${({ buttonColor, buttonVariant, disabled, loading, theme }) => {
    if (!disabled && !loading) {
      return `
        background: ${
          getCustomHoverColor(theme, buttonVariant, buttonColor) !== "none"
            ? getCustomHoverColor(theme, buttonVariant, buttonColor)
            : buttonVariant === ButtonVariantTypes.SECONDARY
              ? theme.colors.button.primary.secondary.hoverColor
              : buttonVariant === ButtonVariantTypes.TERTIARY
                ? theme.colors.button.primary.tertiary.hoverColor
                : theme.colors.button.primary.primary.hoverColor
        } !important;
      `;
    }
  }}
`;

const CSS_COLOR_KEYWORDS = new Set([
  "currentcolor",
  "inherit",
  "initial",
  "transparent",
  "unset",
]);

/**
 * Returns a CSS color value safe for interpolation into styled-components.
 * Rejects values that can break out of a property/selector (e.g. via `;` / `}`).
 */
export function getSafeCssColor(color?: string): string | undefined {
  if (typeof color !== "string") return undefined;

  const trimmed = color.trim();

  if (!trimmed || /[;{}\\]/.test(trimmed)) return undefined;

  const keyword = trimmed.toLowerCase();

  if (CSS_COLOR_KEYWORDS.has(keyword)) {
    return keyword === "currentcolor" ? "currentColor" : keyword;
  }

  const parsed = tinycolor(trimmed);

  if (parsed.isValid()) {
    return parsed.getAlpha() < 1 ? parsed.toRgbString() : parsed.toHexString();
  }

  // Named colors / formats tinycolor may miss but validate-color accepts
  if (validateColor(trimmed)) {
    return trimmed;
  }

  return undefined;
}

const SAFE_FONT_SIZE_REGEX =
  /^(inherit|initial|unset|smaller|larger|(xx?-)?small|medium|(xx?-)?large|xxx-large|(\d*\.?\d+)(px|rem|em|%|pt|pc|in|cm|mm|ex|ch|vh|vw|vmin|vmax))$/i;

/**
 * Returns a CSS font-size value safe for interpolation into styled-components.
 */
export function getSafeFontSize(fontSize?: string): string | undefined {
  if (typeof fontSize !== "string") return undefined;

  const trimmed = fontSize.trim();

  if (!trimmed || !SAFE_FONT_SIZE_REGEX.test(trimmed)) return undefined;

  return trimmed;
}
