import styled, { css } from "styled-components";
import type { BadgeKind } from "./Badge.types";

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
};

export const StyledBadge = styled.div<{
  kind?: BadgeKind;
}>`
  width: 8px;
  height: 8px;
  background-color: var(--badge-color-bg);
  border-radius: 50%;
  ${({ kind }) => kind && Kind[kind]}
`;
