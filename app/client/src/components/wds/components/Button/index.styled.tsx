import styled, { css } from "styled-components";

import {
  lightenColor,
  getComplementaryGrayscaleColor,
  calulateHoverColor,
} from "components/wds/utils/color";
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
          background-color: var(--wds-v2-color-bg-brand);
          color: var(--wds-v2-color-text-onbrand);

          &:enabled:hover {
            background-color: var(--wds-v2-color-bg-brand-hover);
          }

          &:enabled:active {
            transform: translateY(1px);
          }
        `;
      case "outline":
        return css`
          border-width: 1px;
          background-color: transparent;
          color: var(--wds-v2-color-text-brand);
          border-color: var(--wds-v2-color-border-brand);

          &:hover {
            background-color: var(--wds-v2-color-bg-brand-light-hover);
          }

          &:hover:disabled {
            background-color: transparent;
          }
        `;
      case "link":
        return css`
          color: var(--wds-v2-color-text-brand);
          box-shadow: none;

          &:hover {
            color: var(--wds-v2-color-text-brand-hover);
            text-decoration: underline;
          }
        `;
      case "light":
        return css`
          background: var(--wds-v2-color-bg-brand-light);
          border-color: transparent;
          color: var(--wds-v2-color-text-brand);
          border-width: 0;

          &:enabled:hover {
            background: var(--wds-v2-color-bg-brand-light-hover);
          }
        `;
      case "subtle":
        return css`
          border-color: transparent;
          color: var(--wds-v2-color-text-brand);
          border-width: 0;

          &:enabled:hover {
            background: var(--wds-v2-color-bg-brand-light-hover);
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
  ${({ accentColor }: Pick<ButtonProps, "accentColor" | "variant">) => {
    if (!accentColor) return "";

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
    `;
  }}
`;

type StyledButtonProps = Pick<
  ButtonProps,
  "variant" | "borderRadius" | "boxShadow"
>;

export const StyledButton = styled.button<StyledButtonProps>`
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
  gap: var(--wds-v2-spacing-md);
  padding: 0 var(--wds-v2-spacing-md);
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

  &:disabled {
    cursor: not-allowed;
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

  &:active {
    transform: translateY(1px);
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
