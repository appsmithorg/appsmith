import kebabCase from "lodash/kebabCase";
import { css, CSSProperties } from "styled-components";
import {
  getAccentDarkColor,
  getAccentHoverColor,
  getAccentLightColor,
  getOnAccentTextColor,
  parseColor,
} from "./colors";

/**
 * This function is used to create tokens for widgets
 */
export const createCSSVars = css`
  ${({
    accentColor: color,
    borderRadius,
    boxShadow,
  }: {
    accentColor: CSSProperties["color"];
    borderRadius: CSSProperties["borderRadius"];
    boxShadow: CSSProperties["boxShadow"];
  }) => {
    const colorTokens: any = createSemanticColorTokens(color);

    return css`
      ${Object.keys(colorTokens).map(
        (key) => css`
          --wds-v2-color-${kebabCase(key)}: ${colorTokens[key]};`,
      )}

      --wds-v2-shadow: ${boxShadow};
      --wds-v2-radii: ${borderRadius};
    `;
  }}
`;

/**
 *
 * @param color
 * @returns
 */
export const createSemanticColorTokens = (color: CSSProperties["color"]) => {
  const bgAccent = parseColor(color).toString({ format: "hex" });
  const bgAccentHover = getAccentHoverColor(color);
  const bgAccentSubtle = getAccentLightColor(color);
  const bgAccentActive = getAccentDarkColor(bgAccentHover);
  const bgAccentSubtleHover = getAccentHoverColor(bgAccentSubtle);
  const fgOnaccent = getOnAccentTextColor(bgAccent);
  const bgAccentSubtleActive = getAccentDarkColor(bgAccentSubtleHover, 0.03);
  const onAccentBorderColor = getAccentDarkColor(color, 0.1);
  const onAccentLightBorderColor = getAccentLightColor(color, 0.98);

  return {
    bgAccent,
    bgAccentHover,
    bgAccentSubtle,
    bgAccentActive,
    bgAccentSubtleActive,
    bgAccentSubtleHover,

    fgAccent: color,
    fgOnaccent,

    bdAccent: color,
    bdOnaccent: onAccentBorderColor,
    bdOnaccentSubtle: onAccentLightBorderColor,
  };
};
