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

  &[data-variant="primary" i] {
    background-color: var(--color-bg-accent);
    color: var(--color-fg-on-accent);
    border-color: transparent;

    &[data-hovered]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background-color: var(--color-bg-accent-hover);
    }

    &[data-active]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background-color: var(--color-bg-accent-active);
    }
  }

  &[data-variant="secondary" i] {
    background-color: transparent;
    color: var(--color-fg-accent);
    border-color: var(--color-bd-accent);
    border-width: var(--border-width-1);

    &[data-hovered]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background-color: var(--color-bg-accent-subtle-hover);
    }

    &[data-active]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background-color: var(--color-bg-accent-subtle-active);
    }
  }

  &[data-variant="tertiary" i] {
    background: transparent;
    color: var(--color-fg-accent);
    border-color: transparent;
    border-width: 0;

    &[data-hovered]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background: var(--color-bg-accent-subtle-hover);
    }

    &[data-active]:not(:is([data-loading], [data-disabled], [aria-disabled])) {
      background: var(--color-bg-accent-subtle-active);
    }
  }

  &[data-focused] {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-bd-focus);
  }

  &[data-disabled],
  // TODO(Pawan): Check if we need to make the UI of loading state same as disabled?
  &[aria-disabled]:not([data-loading]) {
    cursor: default;
    opacity: var(--opacity-disabled);
  }

  &[data-loading] {
    cursor: default;
  }

  /** Note: adding direct selector ">" here because blueprint also had data-icon attribute on their icons */
  & > [data-icon] {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(var(--sizing-root-unit) * 4);
    width: calc(var(--sizing-root-unit) * 4);
  }

  &[data-icon-position="end"] {
    flex-direction: row-reverse;
  }
`;

/**
 * We have this Bug in Firefox where we are unable to drag
 * buttons - https://bugzilla.mozilla.org/show_bug.cgi?id=568313
 *
 * We found a solution here - https://stackoverflow.com/a/43888410
 */
export const DragContainer = styled.div`
  &:after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    position: absolute;
  }
`;
