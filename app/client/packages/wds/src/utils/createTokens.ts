import kebabCase from "lodash/kebabCase";
import { css, CSSProperties } from "styled-components";
import {
  lightenColor,
  getComplementaryGrayscaleColor,
  calulateHoverColor,
  darkenColor,
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
  const accentColor = parseColor(color).toString({ format: "hex" });
  const accentHoverColor = calulateHoverColor(color);
  const lightAccentColor = lightenColor(color);
  const accentActiveColor = darkenColor(accentHoverColor);
  const lightAccentHoverColor = calulateHoverColor(lightAccentColor);
  const complementaryAccentColor = getComplementaryGrayscaleColor(accentColor);
  const lightAcctentActiveColor = darkenColor(lightAccentHoverColor, 0.03);
  const onAccentBorderColor = darkenColor(color, 0.1);
  const onAccentLightBorderColor = lightenColor(color, 0.98);

  return {
    bgAccent: accentColor,
    bgAccentHover: accentHoverColor,
    bgAccentLight: lightAccentColor,
    bgAccentActive: accentActiveColor,
    bgAccentLightActive: lightAcctentActiveColor,
    bgAccentLightHover: lightAccentHoverColor,

    textAccent: accentColor,
    textOnaccent: complementaryAccentColor,

    borderAccent: accentColor,
    borderOnaccent: onAccentBorderColor,
    borderOnaccentLight: onAccentLightBorderColor,
  };
};
