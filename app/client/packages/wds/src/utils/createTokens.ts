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
export const createTokens = css`
  ${({
    accentColor: color,
    borderRadius,
    boxShadow,
  }: {
    accentColor: CSSProperties["color"];
    borderRadius: CSSProperties["borderRadius"];
    boxShadow: CSSProperties["boxShadow"];
  }) => {
    const accentColor = parseColor(color).toString({ format: "hex" });
    const accentHoverColor = calulateHoverColor(color);
    const lightAccentColor = lightenColor(color);
    const accentActiveColor = darkenColor(accentHoverColor);
    const lightAccentHoverColor = calulateHoverColor(lightAccentColor);
    const complementaryAccentColor = getComplementaryGrayscaleColor(
      accentColor,
    );
    const lightAcctentActiveColor = darkenColor(lightAccentHoverColor, 0.03);
    const darkAccentColor = darkenColor(color);

    return css`
      --wds-v2-color-bg-accent: ${accentColor};
      --wds-v2-color-bg-accent-hover: ${accentHoverColor};
      --wds-v2-color-bg-accent-light: ${lightAccentColor};
      --wds-v2-color-bg-accent-active: ${accentActiveColor};
      --wds-v2-color-bg-accent-light-active: ${lightAcctentActiveColor};
      --wds-v2-color-bg-accent-light-hover: ${lightAccentHoverColor};

      --wds-v2-color-text-accent: ${accentColor};
      --wds-v2-color-text-onaccent: ${complementaryAccentColor};

      --wds-v2-color-border-accent: ${accentColor};
      --wds-vs-color-border-accent-dark: ${darkAccentColor};
      --wds-vs-color-border-accent-light: ${lightAccentHoverColor};

      --wds-v2-shadow: ${boxShadow};
      --wds-v2-radii: ${borderRadius};
    `;
  }}
`;
