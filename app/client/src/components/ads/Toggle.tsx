import { CommonComponentProps, Classes } from "./common";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Spinner from "./Spinner";

type ToggleProps = CommonComponentProps & {
  onToggle?: (value: boolean) => void;
  label: string;
  switchOn: boolean;
};

const StyledToggle = styled.label<{
  isLoading?: boolean;
  disabled?: boolean;
  switchOn: boolean;
}>`
  position: relative;
  display: block;
  padding-left: 56px;
  font-weight: ${props => props.theme.typography.p1.fontWeight};
  font-size: ${props => props.theme.typography.p1.fontSize}px;
  line-height: ${props => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${props => props.theme.typography.p1.letterSpacing}px;
  color: ${props => props.theme.colors.blackShades[7]};

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
    background-color: ${props =>
      props.isLoading
        ? props.theme.colors.blackShades[3]
        : props.theme.colors.blackShades[4]};
    transition: 0.4s;
    width: 46px;
    height: 23px;
    border-radius: 92px;
  }

  ${props =>
    props.isLoading
      ? `.toggle-spinner {
      position: absolute;
      top: 3px;
      left: 17px;
    }
    .slider:before {
      display: none;
    }`
      : `.slider:before {
      position: absolute;
      content: "";
      height: 19px;
      width: 19px;
      top: 2px;
      left: 2px;
      background-color: ${
        props.isLoading
          ? props.theme.colors.blackShades[3]
          : props.theme.colors.blackShades[9]
      };
      box-shadow: ${
        props.switchOn
          ? "1px 0px 3px rgba(0, 0, 0, 0.16)"
          : "-1px 0px 3px rgba(0, 0, 0, 0.16)"
      };
      opacity: ${props.switchOn ? 1 : 0.9};
      transition: .4s;
      border-radius: 50%;
    }`}

  input:hover + .slider:before {
    opacity: 1;
  }

  input:focus + .slider:before {
    ${props => (props.switchOn ? 0.6 : 0.7)};
  }

  input:disabled + .slider:before {
    ${props => (props.switchOn ? 0.24 : 1)};
  }

  input:checked + .slider:before {
    transform: translateX(23px);
  }

  input:checked + .slider {
    background-color: ${props => props.theme.colors.info.main};
  }

  input:hover + .slider,
  input:focus + .slider {
    background-color: ${props => (props.switchOn ? "#F56426" : "#5E5E5E")};
  }

  input:disabled + .slider {
    background-color: ${props =>
      props.switchOn && !props.isLoading
        ? "#3D2219"
        : props.theme.colors.info.darkest};
  }

  .${Classes.SPINNER} {
    circle {
      stroke: ${props => props.theme.colors.blackShades[6]};
    }
  }
`;

export default function Toggle(props: ToggleProps) {
  const [switchOn, setSwitchOn] = useState(false);

  useEffect(() => {
    setSwitchOn(props.switchOn);
  }, [props.switchOn]);

  const onChangeHandler = (value: boolean) => {
    setSwitchOn(value);
    props.onToggle && props.onToggle(value);
  };

  return (
    <StyledToggle
      isLoading={props.isLoading}
      disabled={props.disabled}
      switchOn={switchOn}
    >
      {props.label}
      <input
        type="checkbox"
        checked={switchOn}
        disabled={props.disabled || props.isLoading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChangeHandler(e.target.checked)
        }
      />
      <span className="slider"></span>
      {props.isLoading ? (
        <div className="toggle-spinner">
          <Spinner />
        </div>
      ) : null}
    </StyledToggle>
  );
}
