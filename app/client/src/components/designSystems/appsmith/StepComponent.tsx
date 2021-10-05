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
  width: 40px;
  height: 32px;
  svg {
    path {
      fill: ${(props) => props.theme.colors.paneSectionLabel};
    }
  }
`;

const StyledDecreaseIcon = styled(
  ControlIcons.DECREASE_CONTROL as AnyStyledComponent,
)`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  width: 40px;
  height: 32px;
  svg {
    path {
      fill: ${(props) => props.theme.colors.paneSectionLabel};
    }
  }
`;

const StepWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #121518;
  border-radius: 4px;
  height: 32px;
  line-height: 32px;
`;

const InputWrapper = styled.div`
  width: calc(100% - 80px);
  height: 32px;
  line-height: 32px;
  background: #23292e;
  font-size: 14px;
  color: ${(props) => props.theme.colors.textOnDarkBG};
  text-align: center;
  letter-spacing: 1.44px;
`;

interface StepComponentProps {
  value: number;
  min: number;
  max: number;
  steps: number;
  displayFormat: (value: number) => string;
  onChange: (value: number) => void;
}

export function StepComponent(props: StepComponentProps) {
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
      <StyledDecreaseIcon height={2} onClick={decrease} width={12} />
      <InputWrapper>{props.displayFormat(props.value)}</InputWrapper>
      <StyledIncreaseIcon height={12} onClick={increase} width={12} />
    </StepWrapper>
  );
}

export default StepComponent;
