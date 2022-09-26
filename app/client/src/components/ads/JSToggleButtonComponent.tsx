import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";
import { IconWrapper } from "constants/IconConstants";

const JSToggleButtonWrapper = styled.button<{ active: boolean }>`
  margin: 4px;
  margin-top: 0px;
  cursor: pointer;

  & ${IconWrapper} {
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  }

  height: auto;
  width: 28px;
  height: 16px;
  border: 0.5px solid
    ${(props) => (props.disabled ? Colors.GRAY_400 : Colors.GRAY_700)};
  background-color: ${(props) =>
    props.active
      ? props.disabled
        ? Colors.GRAY_400
        : Colors.GRAY_800
      : props.disabled
      ? Colors.GRAY_200
      : Colors.WHITE};

  &:hover {
    background-color: ${(props) =>
      props.disabled
        ? props.active
          ? Colors.GRAY_400
          : Colors.GRAY_200
        : props.active
        ? Colors.GRAY_900
        : Colors.GRAY_200};
  }

  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &&& svg {
    width: 28px;
    height: 16px;
    transform: scale(1.4);

    rect {
      fill: transparent;
    }

    path {
      fill: ${(props) => (props.active ? Colors.WHITE : Colors.GRAY_700)};
    }
  }
`;

type JSToggleButtonProps = {
  isActive: boolean;
  isToggleDisabled?: boolean;
  handleClick: (_: any) => void;
  cypressSelector?: string;
};

function JSToggleButton(props: JSToggleButtonProps) {
  return (
    <JSToggleButtonWrapper
      active={props.isActive}
      className={`focus:ring-2 t--js-toggle ${props.isActive ? "is-active" : ""}
      ${props.cypressSelector}
      `}
      disabled={props.isToggleDisabled}
      onClick={props.handleClick}
    >
      <ControlIcons.JS_TOGGLE />
    </JSToggleButtonWrapper>
  );
}

export default JSToggleButton;
