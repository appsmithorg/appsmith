import styled from "styled-components";
import { Button as HeadlessButton } from "@design-system/headless";
import type { ButtonProps } from "./Button";

export const StyledButton = styled(HeadlessButton)<ButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  outline: 0;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-4);
  height: calc(var(--sizing-root-unit) * 8);
  border-radius: var(--border-radius-1);
  user-select: none;

  // TODO: remove this when we use only flex layout
  &[data-fit-container] {
    width: 100%;
    height: 100%;
  }

  &[data-variant="primary"] {
    background-color: var(--color-bg-accent);
    color: var(--color-fg-on-accent);
    border-color: transparent;

    &[data-hovered]:not([data-loading]) {
      background-color: var(--color-bg-accent-hover);
    }

    &[data-active]:not([data-loading]) {
      background-color: var(--color-bg-accent-active);
    }
  }

  &[data-variant="secondary"] {
    background-color: transparent;
    color: var(--color-fg-accent);
    border-color: var(--color-bd-accent);
    border-width: var(--border-width-1);

    &[data-hovered]:not([data-loading]) {
      background-color: var(--color-bg-accent-subtle-hover);
    }

    &[data-active]:not([data-loading]) {
      background-color: var(--color-bg-accent-subtle-active);
    }
  }

  &[data-variant="tertiary"] {
    background: transparent;
    color: var(--color-fg-accent);
    border-color: transparent;
    border-width: 0;

    &[data-hovered]:not([data-loading]) {
      background: var(--color-bg-accent-subtle-hover);
    }

    &[data-active]:not([data-loading]) {
      background: var(--color-bg-accent-subtle-active);
    }
  }

  &[data-focused] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  &[data-disabled] {
    cursor: default;
    opacity: var(--opacity-disabled);
  }

  &[data-loading] {
    cursor: default;
  }

  & [data-icon] {
    height: calc(var(--sizing-root-unit) * 5);
    width: calc(var(--sizing-root-unit) * 5);
  }

  &[data-icon-position="end"] {
    flex-direction: row-reverse;
  }
`;
