import styled, { css } from "styled-components";

import {
  lightenColor,
  getComplementaryGrayscaleColor,
  calulateHoverColor,
  darkenColor,
  parseColor,
} from "../../utils/color";
import { ButtonProps } from "./Button";

/**
 * variant styles
 *
 * variant = "filled" | "outline" | "link" | "subtle" | "white" | "light"
 */

const variantStyles = css`
  ${({ variant }: Pick<ButtonProps, "accentColor" | "variant">) => {
    switch (variant) {
      case "filled":
        return css`
          background-color: var(--wds-v2-color-bg-accent);
          color: var(--wds-v2-color-text-onaccent);
          border-width: 1px;
          border-color: transparent;

          &:not([data-disabled]):hover {
            background-color: var(--wds-v2-color-bg-accent-hover);
          }

          &:not([data-disabled]):active {
            background-color: var(--wds-v2-color-bg-accent-active);
          }
        `;
      case "outline":
        return css`
          border-width: 1px;
          background-color: transparent;
          color: var(--wds-v2-color-text-accent);
          border-color: var(--wds-v2-color-border-accent);

          &:not([data-disabled]):hover {
            background-color: var(--wds-v2-color-bg-accent-light-hover);
          }

          &:not([data-disabled]):active {
            background-color: var(--wds-v2-color-bg-accent-light-active);
          }

          &:hover:disabled {
            background-color: transparent;
          }
        `;
      case "link":
        return css`
          color: var(--wds-v2-color-text-accent);
          box-shadow: none;

          &:not([data-disabled]):hover {
            text-decoration: underline;
          }
        `;
      case "light":
        return css`
          background: var(--wds-v2-color-bg-accent-light);
          border-color: transparent;
          color: var(--wds-v2-color-text-accent);
          border-width: 0;

          &:not([data-disabled]):hover {
            background: var(--wds-v2-color-bg-accent-light-hover);
          }

          &:not([data-disabled]):active {
            background: var(--wds-v2-color-bg-accent-light-active);
          }
        `;
      case "subtle":
        return css`
          border-color: transparent;
          color: var(--wds-v2-color-text-accent);
          border-width: 0;

          &:not([data-disabled]):hover {
            background: var(--wds-v2-color-bg-accent-light-hover);
          }

          &:not([data-disabled]):active {
            background: var(--wds-v2-color-bg-accent-light-active);
          }
        `;
    }
  }}
`;

/**
 * creates locally scoped css variables to be used in variants styles
 *
 */
export const variantTokens = css`
  ${({ accentColor: color }: Pick<ButtonProps, "accentColor" | "variant">) => {
    if (!color) return "";

    const accentColor = parseColor(color).toString({ format: "hex" });
    const accentHoverColor = calulateHoverColor(color);
    const lightAccentColor = lightenColor(color);
    const accentActiveColor = darkenColor(accentHoverColor);
    const lightAccentHoverColor = calulateHoverColor(lightAccentColor);
    const complementaryAccentColor = getComplementaryGrayscaleColor(
      accentColor,
    );
    const darkAccentColor = darkenColor(color);
    const lightAcctentActiveColor = darkenColor(lightAccentHoverColor, 0.03);

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
    `;
  }}
`;

export const StyledButton = styled.button<ButtonProps>`
  display: flex;
  overflow: hidden;
  text-align: center;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  white-space: nowrap;
  cursor: pointer;
  outline: 0;
  gap: var(--wds-v2-spacing-4);
  padding: var(--wds-v2-spacing-2) var(--wds-v2-spacing-4);
  min-height: 32px;
  border-radius: var(--wds-v2-radii);
  box-shadow: var(--wds-v2-shadow);

  ${({ borderRadius }) => borderRadius && `--wds-v2-radii: ${borderRadius};`};
  ${({ boxShadow }) => boxShadow && `--wds-v2-shadow: ${boxShadow};`};

  &[data-loading] {
    pointer-events: none;
  }

  & [data-component="leadingIcon"] {
    grid-area: leadingIcon;
  }

  & [data-component="trailingIcon"] {
    grid-area: trailingIcon;
  }

  & [data-component="text"] {
    grid-area: text;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  /* // we don't use :focus-visible because not all browsers (safari) have it yet */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--wds-color-border-focus);
  }

  &:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  &:hover {
    text-decoration: none;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    pointer-events: none;
    background: var(--wds-v2-color-bg-action-disabled);
    color: var(--wds-v2-color-text-action-disabled);
    box-shadow: none;
    border-width: 0;
  }

  ${variantTokens}
  ${variantStyles}
`;
