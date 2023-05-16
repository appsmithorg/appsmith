import styled from "styled-components";

import type { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<ButtonGroupProps>`
  --border-width: 1px;

  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: ${({ orientation }) =>
    orientation === "vertical" ? "column" : "row"};

  & [data-button] {
    // increasing z index to make sure the focused button is on top of the others
    &:not([data-disabled]):focus {
      z-index: 1;
    }

    &:is([data-variant="filled"]):not([data-disabled]) {
      border-color: var(--wds-vs-color-border-onaccent);
    }

    &:is([data-variant="light"]):not([data-disabled]) {
      border-color: var(--wds-vs-color-border-onaccent-light);
    }

    &:first-child {
      border-bottom-right-radius: 0;
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-bottom-left-radius: 0; border-bottom-width: calc(var(--border-width) / 2);"
          : "border-top-right-radius: 0; border-right-width: calc(var(--border-width) / 2);"}
    }

    &:last-of-type {
      border-top-left-radius: 0;
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-top-right-radius: 0; border-top-width: calc(var(--border-width) / 2);"
          : "border-bottom-left-radius: 0; border-left-width: calc(var(--border-width) / 2);"}
    }

    &:not(:first-child):not(:last-of-type) {
      border-radius: 0;

      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-top-width: calc(var(--border-width) / 2); border-bottom-width: calc(var(--border-width) / 2);"
          : "border-left-width: calc(var(--border-width) / 2); border-right-width: calc(var(--border-width) / 2);"}
    }

    & + [data-button] {
      ${({ orientation }) =>
        orientation === "vertical"
          ? "margin-top: calc(var(--border-width) * -1);"
          : "margin-left: calc(var(--border-width) * -1);"}

      @media (min-resolution: 192dpi) {
        ${({ orientation }) =>
          orientation === "vertical" ? "margin-top: 0px;" : "margin-left: 0px;"}
      }
    }
  }
`;
