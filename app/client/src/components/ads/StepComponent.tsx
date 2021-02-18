import React from "react";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import styled from "constants/DefaultTheme";

const StyledIncreaseIcon = styled(
  ControlIcons.INCREASE_CONTROL as AnyStyledComponent,
)`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  width: 60px;
  height: 32px;
`;

const StyledDecreaseIcon = styled(
  ControlIcons.DECREASE_CONTROL as AnyStyledComponent,
)`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  width: 60px;
  height: 32px;
`;

const StepWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  line-height: 32px;
  margin-top: 6px;
  background-color: ${(props) => props.theme.colors.propertyPane.zoomButtonBG};
  && svg {
    path {
      fill: ${(props) => props.theme.colors.propertyPane.radioGroupText};
    }
  }
`;

const InputWrapper = styled.div`
  width: calc(100% - 120px);
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  text-align: center;
  letter-spacing: 1.44px;
  color: ${(props) => props.theme.colors.propertyPane.radioGroupText};
  background-color: ${(props) => props.theme.colors.propertyPane.buttonText};
`;

interface StepComponentProps {
  value: number;
  min: number;
  max: number;
  steps: number;
  displayFormat: (value: number) => string;
  onChange: (value: number) => void;
}

export const StepComponent = (props: StepComponentProps) => {
  function decrease() {
    if (props.value < props.min) {
      return;
    }
    const value = props.value - props.steps;
    props.onChange(value);
  }
  function increase() {
    if (props.value > props.max) {
      return;
    }
    const value = props.value + props.steps;
    props.onChange(value);
  }
  return (
    <StepWrapper>
      <StyledDecreaseIcon height={2} width={12} onClick={decrease} />
      <InputWrapper>{props.displayFormat(props.value)}</InputWrapper>
      <StyledIncreaseIcon height={12} width={12} onClick={increase} />
    </StepWrapper>
  );
};

export default StepComponent;
