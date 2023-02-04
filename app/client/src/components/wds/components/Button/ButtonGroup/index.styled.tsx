import styled from "styled-components";
import { ButtonGroupProps } from "./ButtonGroup";

export const StyledContainer = styled.div<
  Pick<ButtonGroupProps, "orientation">
>`
  display: flex;
  flex-direction: ${({ orientation }) =>
    orientation === "vertical" ? "column" : "row"};

  & [data-button] {
    &:first-child {
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-bottom-left-radius: 0; border-bottom-right-radius: 0;"
          : "border-top-right-radius: 0; border-bottom-right-radius: 0;"}
    }

    &:last-of-type {
      ${({ orientation }) =>
        orientation === "vertical"
          ? "border-top-left-radius: 0; border-top-right-radius: 0;"
          : "border-top-left-radius: 0; border-bottom-left-radius: 0;"}
    }

    &:not(:first-child):not(:last-of-type) {
      border-radius: 0;
    }
  }
`;
