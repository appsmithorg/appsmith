import { css, CSSProperties } from "styled-components";
import {
  lightenColor,
  getComplementaryGrayscaleColor,
  calulateHoverColor,
} from "components/wds/utils/color";

/**
 * This function is used to create tokens for widgets
 */
export const createTokens = css`
  ${({
    accentColor,
    borderRadius,
    boxShadow,
  }: {
    accentColor: CSSProperties["color"];
    borderRadius: CSSProperties["borderRadius"];
    boxShadow: CSSProperties["boxShadow"];
  }) => {
    const accentHoverColor = calulateHoverColor(accentColor);
    const lightAccentColor = lightenColor(accentColor);
    const lightAccentHoverColor = calulateHoverColor(lightAccentColor);
    const complementaryAccentColor = getComplementaryGrayscaleColor(
      accentColor,
    );

    return css`
      --wds-v2-color-bg-brand: ${accentColor};
      --wds-v2-color-bg-brand-hover: ${accentHoverColor};
      --wds-v2-color-bg-brand-light: ${lightAccentColor};
      --wds-v2-color-bg-brand-light-hover: ${lightAccentHoverColor};

      --wds-v2-color-text-brand: ${accentColor};
      --wds-v2-color-text-onbrand: ${complementaryAccentColor};

      --wds-v2-color-border-brand: ${accentColor};

      --wds-v2-shadow: ${boxShadow};
      --wds-v2-radii: ${borderRadius};
    `;
  }}
`;
