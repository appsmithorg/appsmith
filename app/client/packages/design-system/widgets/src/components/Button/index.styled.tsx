import styled from "styled-components";
import { Button as HeadlessButton } from "@design-system/headless";
import type { ButtonProps } from "./Button";

export const StyledButton = styled(HeadlessButton)<ButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  outline: 0;
  gap: var(--spacing-4);
  padding: var(--spacing-2) var(--spacing-4);
  min-height: calc(var(--sizing-root-unit) * 8);
  border-radius: var(--border-radius-1);
  user-select: none;

  // TODO: remove this when we use only flex layout
  &[data-fit-container="true"] {
    width: 100%;
    height: 100%;
  }

  &[data-loading="true"] {
    pointer-events: none;
  }

  &[data-variant="primary"] {
    background-color: var(--color-bg-accent);
    color: var(--color-fg-on-accent);
    border-color: transparent;

    &.is-hovered {
      background-color: var(--color-bg-accent-hover);
    }

    &.is-active {
      background-color: var(--color-bg-accent-active);
    }
  }

  &[data-variant="secondary"] {
    background-color: transparent;
    color: var(--color-fg-accent);
    border-color: var(--color-bd-accent);
    border-width: var(--border-width-1);

    &.is-hovered {
      background-color: var(--color-bg-accent-subtle-hover);
    }

    &.is-active {
      background-color: var(--color-bg-accent-subtle-active);
    }
  }

  &[data-variant="tertiary"] {
    background: transparent;
    color: var(--color-fg-accent);
    border-color: transparent;
    border-width: 0;

    &.is-hovered {
      background: var(--color-bg-accent-subtle-hover);
    }

    &.is-active {
      background: var(--color-bg-accent-subtle-active);
    }
  }

  // we don't use :focus-visible because not all browsers (safari) have it yet
  &:not([data-loading]).focus-ring,
  &[data-focus="true"] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  &.is-disabled {
    pointer-events: none;
    opacity: var(--opacity-disabled);
  }
`;
