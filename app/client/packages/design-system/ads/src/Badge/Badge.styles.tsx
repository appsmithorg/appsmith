import styled, { css } from "styled-components";
import type { BadgeKind, BadgeSize } from "./Badge.types";

const Kind = {
  error: css`
    --badge-color-bg: var(--ads-v2-color-fg-error);
  `,
  warning: css`
    --badge-color-bg: var(--ads-v2-color-fg-warning);
  `,
  success: css`
    --badge-color-bg: var(--ads-v2-color-fg-success);
  `,
  info: css`
    --badge-color-bg: var(--ads-v2-color-fg);
  `,
};

const Size = {
  small: css`
    width: 5px;
    height: 5px;
  `,
  medium: css`
    width: 8px;
    height: 8px;
  `,
};

export const StyledBadge = styled.div<{
  kind?: BadgeKind;
  size?: BadgeSize;
  isAnimated?: boolean;
}>`
  background-color: var(--badge-color-bg);
  border-radius: 50%;
  ${({ kind }) => kind && Kind[kind]}
  ${({ size }) => size && Size[size]}
  ${({ isAnimated }) =>
    isAnimated &&
    `
    position: relative;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
      background-color: inherit;
      opacity: 0.5;
    }

    @keyframes pulse {
      75%, to {
        opacity: 0;
        transform: scale(3);
      }
    }
  `}
`;
