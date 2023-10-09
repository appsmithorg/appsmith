import styled from "styled-components";

import type { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<ButtonGroupProps>`
  display: flex;

  &[data-orientation="vertical"] {
    flex-direction: column;
  }

  & [data-button] {
    // increasing z index to make sure the focused button is on top of the others
    &:not([data-disabled]):focus {
      z-index: 1;
    }

    &:first-child {
      border-bottom-right-radius: 0;
    }

    &:last-of-type {
      border-top-left-radius: 0;
    }

    &:not(:first-child):not(:last-of-type) {
      border-radius: 0;
    }
  }

  &:not([data-orientation="vertical"]) [data-button] {
    &:first-child {
      border-top-right-radius: 0;
      border-right-width: calc(var(--border-width-1) / 2);
    }

    &:last-of-type {
      border-bottom-left-radius: 0;
      border-left-width: calc(var(--border-width-1) / 2);
    }

    &:not(:first-child):not(:last-of-type) {
      border-left-width: calc(var(--border-width-1) / 2);
      border-right-width: calc(var(--border-width-1) / 2);
    }

    & + [data-button] {
      margin-left: calc(var(--border-width-1) * -1);
    }
  }

  &[data-orientation="vertical"] [data-button] {
    &:first-child {
      border-bottom-left-radius: 0;
      border-bottom-width: calc(var(--border-width-1) / 2);
    }

    &:last-of-type {
      border-top-right-radius: 0;
      border-top-width: calc(var(--border-width-1) / 2);
    }

    &:not(:first-child):not(:last-of-type) {
      border-top-width: calc(var(--border-width-1) / 2);
      border-bottom-width: calc(var(--border-width-1) / 2);
    }

    & + [data-button] {
      margin-top: calc(var(--border-width-1) * -1);
    }
  }

  /**
  * ----------------------------------------------------------------------------
  * Filled variant
  *-----------------------------------------------------------------------------
  */
  & [data-variant="filled"] {
    border-width: 0;
  }

  & [data-variant="filled"][data-color="accent"] {
    border-color: var(--color-bd-on-accent);
  }

  & [data-variant="filled"][data-color="neutral"] {
    border-color: var(--color-bd-on-neutral);
  }

  & [data-variant="filled"][data-color="positive"] {
    border-color: var(--color-bd-on-positive);
  }

  & [data-variant="filled"][data-color="negative"] {
    border-color: var(--color-bd-on-negative);
  }

  & [data-variant="filled"][data-color="warning"] {
    border-color: var(--color-bd-on-warning);
  }

  /**
  * ----------------------------------------------------------------------------
  * Outlined variant
  *-----------------------------------------------------------------------------
  */
  & [data-variant="outlined"][data-color="accent"] {
    border-color: var(--color-bd-accent);
  }

  & [data-variant="outlined"][data-color="neutral"] {
    border-color: var(--color-bd-neutral);
  }

  & [data-variant="outlined"][data-color="positive"] {
    border-color: var(--color-bd-positive);
  }

  & [data-variant="outlined"][data-color="negative"] {
    border-color: var(--color-bd-negative);
  }

  & [data-variant="outlined"][data-color="warning"] {
    border-color: var(--color-bd-warning);
  }
`;
