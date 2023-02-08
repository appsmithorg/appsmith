import styled from "styled-components";
import { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<
  Pick<ButtonGroupProps, "orientation">
>`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: ${({ orientation }) =>
    orientation === "vertical" ? "column" : "row"};

  & [data-button] {
    &:is([data-variant="filled"]) {
      border-color: var(--wds-vs-color-border-accent-dark);
    }

    &:is([data-variant="light"]) {
      border-color: var(--wds-vs-color-border-accent-light);
    }

    &:first-child {
      border-bottom-right-radius: 0;
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-bottom-left-radius: 0; border-bottom-width: 0.5px;"
          : "border-top-right-radius: 0; border-right-width: 0.5px;"}
    }

    &:last-of-type {
      border-top-left-radius: 0;
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-top-right-radius: 0; border-top-width: 0.5px"
          : "border-bottom-left-radius: 0; border-left-width: 0.5px"}
    }

    &:not(:first-child):not(:last-of-type) {
      border-radius: 0;

      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-top-width: 0.5px; border-bottom-width: 0.5px;"
          : "border-left-width: 0.5px; border-right-radius: 0.5px;"}
    }

    & + [data-button] {
      ${({ orientation }) =>
        orientation === "vertical" ? "margin-top: -1px;" : "margin-left: -1px;"}

      @media (min-resolution: 192dpi) {
        ${({ orientation }) =>
          orientation === "vertical" ? "margin-top: 0px;" : "margin-left: 0px;"}
      }
    }
  }
`;
