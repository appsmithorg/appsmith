import styled, { css } from "styled-components";
import type { TagKind, TagSizes } from "./Tag.types";
import { Button } from "../Button";

const Variables = css`
  --tag-color-background: var(--ads-v2-colors-content-surface-neutral-bg);
  --tag-color-border: transparent;
  --tag-color-fg: var(--ads-v2-colors-content-label-default-fg);
`;

const TagSizeMap = {
  sm: css`
    padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-2);
    height: 18px;
  `,
  md: css`
    padding: var(--ads-v2-spaces-2);
    height: 22px;
  `,
};

const KindMap = {
  success: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-success-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-success-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-success-fg);
  `,
  warning: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-warning-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-warning-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-warning-fg);
  `,
  info: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-info-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-info-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-info-fg);
  `,
  error: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-error-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-error-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-error-fg);
  `,
  neutral: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-neutral-bg);
    --tag-color-border: transparent;
    --tag-color-fg: var(--ads-v2-colors-content-label-default-fg);
  `,
  special: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-special-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-special-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-special-fg);
  `,
  premium: css`
    --tag-color-background: var(--ads-v2-colors-content-surface-premium-bg);
    --tag-color-border: var(--ads-v2-colors-content-surface-premium-border);
    --tag-color-fg: var(--ads-v2-colors-content-label-premium-fg);
  `,
};

export const StyledTag = styled.span<{
  isClosed: boolean;
  kind?: TagKind;
  size?: TagSizes;
}>`
  ${Variables}

  ${({ size }) => size && TagSizeMap[size]}
  ${({ kind }) => kind && KindMap[kind]}
  min-width: fit-content;

  background-color: var(--tag-color-background);
  border: 1px solid var(--tag-color-border);
  color: var(--tag-color-fg);

  border-radius: var(--ads-v2-border-radius);
  box-sizing: border-box;

  display: flex;
  align-items: center;

  & > span {
    line-height: normal;
  }

  ${({ isClosed }) => isClosed && `display: none;`}
`;

export const StyledButton = styled(Button)`
  --button-color-fg: var(--tag-color-fg);
  --button-color-bg: inherit;

  margin-left: var(--ads-v2-spaces-1);
  position: relative;
  cursor: pointer;

  &:hover:not([data-disabled="true"]):not([data-loading="true"]) {
    --button-color-fg: var(--tag-color-fg);
    --button-color-bg: inherit;
  }
  &:active:not([data-disabled="true"]):not([data-loading="true"]) {
    --button-color-fg: var(--tag-color-fg);
    --button-color-bg: inherit;
  }
`;
