import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";

const JSToggleButtonWrapper = styled.button<{ active: boolean }>`
  margin: 4px;
  margin-top: 0px;
  cursor: pointer;
  height: auto;
  width: 28px;
  height: 16px;
  border: 0.5px solid ${Colors.BLACK};
  background-color: ${(props) =>
    props.active ? Colors.GREY_10 : Colors.GREY_2};

  &:hover {
    background-color: ${(props) =>
      props.active ? Colors.GREY_9 : Colors.GREY_3};

    &&& svg {
      path {
        fill: ${(props) => (props.active ? Colors.GREY_2 : Colors.GREY_9)};
      }
    }
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
      fill: ${(props) =>
        props.active ? props.theme.colors.GREY_2 : Colors.GREY_9};
    }
  }
`;

type JSToggleButtonProps = {
  isActive: boolean;
  isToggleDisabled?: boolean;
  handleClick: (_: any) => void;
};

function JSToggleButton(props: JSToggleButtonProps) {
  return (
    <JSToggleButtonWrapper
      active={props.isActive}
      className={`focus:ring-2 t--js-toggle ${
        props.isActive ? "is-active" : ""
      }`}
      disabled={props.isToggleDisabled}
      onClick={props.handleClick}
    >
      <ControlIcons.JS_TOGGLE />
    </JSToggleButtonWrapper>
  );
}

export default JSToggleButton;
