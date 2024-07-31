import { Classes } from "../constants/classes";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Text, { TextType } from "../Text";
import type { CommonComponentProps } from "../types/common";

type SwitchProps = CommonComponentProps & {
  onSwitch: (value: boolean) => void;
  value: boolean;
};

const StyledSwitch = styled.label<{
  isLoading?: boolean;
  value: boolean;
  firstRender: boolean;
}>`
  position: relative;
  display: block;
  width: 78px;
  height: 26px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    border: 1px solid var(--ads-rectangular-switch-slider-border-color);
    background-color: var(--ads-rectangular-switch-slider-background-color);
    width: 78px;
    height: 26px;
  }

  ${(props) =>
    `.slider:before {
      position: absolute;
      content: "";
			width: 36px;
			height: 20px;
			top: 2px;
	    background-color: var(--ads-rectangular-switch-background-color);
      left: ${props.value && !props.firstRender ? "38px" : "2px"};
    	transition: ${props.firstRender ? "0.4s" : "none"};
		}
	`}

  input:checked + .slider:before {
    transform: ${(props) => (props.firstRender ? "translateX(36px)" : "none")};
  }

  input:checked + .slider:before {
    background-color: var(--ads-rectangular-switch-hover-background-color);
  }
`;

const Light = styled.div<{ value: boolean }>`
  .${Classes.TEXT} {
    color: ${(props) =>
      props.value
        ? "var(--ads-rectangular-switch-light-text-color)"
        : "var(--ads-rectangular-switch-dark-text-color)"};
    font-size: 10px;
    line-height: 12px;
    letter-spacing: -0.171429px;
  }
  position: absolute;
  top: 3px;
  left: 10px;
`;

const Dark = styled.div<{ value: boolean }>`
  &&&& .${Classes.TEXT} {
    font-size: 10px;
    line-height: 12px;
    letter-spacing: -0.171429px;
    color: ${(props) =>
      props.value
        ? "var(--ads-rectangular-switch-dark-text-color)"
        : "var(--ads-rectangular-switch-light-text-color)"};
  }
  position: absolute;
  top: 3px;
  left: 46px;
`;

export default function Switch(props: SwitchProps) {
  const { onSwitch } = props;
  const [value, setValue] = useState(false);
  const [firstRender, setFirstRender] = useState(false);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const onChangeHandler = (value: boolean) => {
    setValue(value);
    onSwitch && onSwitch(value);
  };

  return (
    <StyledSwitch
      className={props.className}
      data-cy={props.cypressSelector}
      firstRender={firstRender}
      isLoading={props.isLoading}
      value={value}
    >
      <input
        checked={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (!firstRender) {
            setFirstRender(true);
          }
          onChangeHandler(e.target.checked);
        }}
        type="checkbox"
      />
      <span className="slider" />
      <Light value={value}>
        <Text type={TextType.H6}>Light</Text>
      </Light>
      <Dark value={value}>
        <Text type={TextType.H6}>Dark</Text>
      </Dark>
    </StyledSwitch>
  );
}
