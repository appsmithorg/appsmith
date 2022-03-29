import styled from "styled-components";
import { Button, ButtonGroup, IButtonProps } from "@blueprintjs/core";

import { Colors } from "constants/Colors";

export const StyledButtonGroup = styled(ButtonGroup)`
  height: 33px;
`;

export const StyledButton = styled(Button)<IButtonProps>`
  &&& {
    border-radius: 0;
    box-shadow: none;
    background-image: none;
    background: none;
    border: 1px solid
      ${(props) => (props.active ? Colors.GREY_10 : Colors.GREY_5)};
    font-size: 14px;

    &:hover,
    &:active,
    &.bp3-active {
      background: ${Colors.GREY_3};
    }

    & > div {
      display: flex;
      cursor: pointer;
    }
  }
`;
