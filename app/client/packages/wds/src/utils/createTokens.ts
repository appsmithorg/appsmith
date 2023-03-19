import kebabCase from "lodash/kebabCase";
import type { CSSProperties } from "styled-components";
import { css } from "styled-components";
import {
  lightenColor,
  darkenColor,
  getComplementaryGrayscaleColor,
  parseColor,
  calulateHoverColor,
} from "./colors";
import defaultsTokens from "../constants/defaultTokens.json";

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

/** Semantic tokens utils */

const getBgAccentColor = (color: CSSProperties["color"]) => {
  return parseColor(color).toString({ format: "hex" });
};

const getBgAccentHoverColor = (color: CSSProperties["color"]) => {
  return calulateHoverColor(color);
};

const getBgAccentSubtleColor = (color: CSSProperties["color"]) => {
  return lightenColor(color);
};

const getBgAccentSubtleHoverColor = (color: CSSProperties["color"]) => {
  return calulateHoverColor(color);
};

const getBgAccentActiveColor = (color: CSSProperties["color"]) => {
  return darkenColor(color);
};

const getFgOnAccentTextColor = (color: CSSProperties["color"]) => {
  return getComplementaryGrayscaleColor(color);
};

const getAccentSubtleActiveColor = (color: CSSProperties["color"]) => {
  return darkenColor(color, 0.03);
};

const getBdOnAccentColor = (color: CSSProperties["color"]) => {
  return darkenColor(color, 0.1);
};

const getBdOnAccentSubtleColor = (color: CSSProperties["color"]) => {
  return lightenColor(color, 0.98);
};

/**
 * create semantic color tokens
 *
 * @param color
 * @returns
 */
export const createSemanticColorTokens = (
  color: CSSProperties["color"] = defaultsTokens.seedColor,
) => {
  const bgAccent = getBgAccentColor(color);
  const bgAccentHover = getBgAccentHoverColor(color);
  const bgAccentSubtle = getBgAccentSubtleColor(color);
  const bgAccentActive = getBgAccentActiveColor(bgAccentHover);
  const bgAccentSubtleHover = getBgAccentSubtleHoverColor(bgAccentSubtle);
  const fgOnaccent = getFgOnAccentTextColor(bgAccent);
  const bgAccentSubtleActive = getAccentSubtleActiveColor(bgAccentSubtleHover);
  const bgOnAccent = getBdOnAccentColor(color);
  const bdOnAccentSubtle = getBdOnAccentSubtleColor(color);

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
    bdOnaccent: bgOnAccent,
    bdOnaccentSubtle: bdOnAccentSubtle,
  };
};
