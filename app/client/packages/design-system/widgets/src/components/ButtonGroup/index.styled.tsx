import styled from "styled-components";

import type { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<ButtonGroupProps>`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;

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

      @media (min-resolution: 192dpi) {
        margin-left: 0px;
      }
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

      @media (min-resolution: 192dpi) {
        margin-top: 0px;
      }
    }
  }
`;
