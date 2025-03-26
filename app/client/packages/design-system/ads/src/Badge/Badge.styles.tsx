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
    --badge-color-bg: var(--ads-v2-color-fg-information);
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
}>`
  background-color: var(--badge-color-bg);
  border-radius: 50%;
  ${({ kind }) => kind && Kind[kind]}
  ${({ size }) => size && Size[size]}
`;
