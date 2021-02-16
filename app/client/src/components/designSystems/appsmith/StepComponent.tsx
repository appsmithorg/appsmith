import React from "react";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

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
  width: 60px;
  height: 32px;
  svg {
    path {
      fill: ${(props) => props.theme.colors.paneSectionLabel};
    }
  }
`;

const StepWrapper = styled.div<{ themeMode: EditorTheme }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: ${(props) =>
    props.themeMode === EditorTheme.DARK ? Colors.NERO : Colors.ALTO};
  height: 32px;
  line-height: 32px;
  margin-top: 6px;
`;

const InputWrapper = styled.div<{ themeMode: EditorTheme }>`
  width: calc(100% - 120px);
  height: 32px;
  line-height: 32px;
  font-size: 14px;
  text-align: center;
  letter-spacing: 1.44px;
  background: ${(props) =>
    props.themeMode === EditorTheme.DARK ? Colors.CODE_GRAY : Colors.WHITE};
  color: ${(props) =>
    props.themeMode === EditorTheme.DARK ? Colors.LIGHT_GREY : Colors.CHARCOAL};
`;

interface StepComponentProps {
  value: number;
  min: number;
  max: number;
  steps: number;
  displayFormat: (value: number) => string;
  onChange: (value: number) => void;
  theme: EditorTheme;
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
    <StepWrapper themeMode={props.theme}>
      <StyledDecreaseIcon height={2} width={12} onClick={decrease} />
      <InputWrapper themeMode={props.theme}>
        {props.displayFormat(props.value)}
      </InputWrapper>
      <StyledIncreaseIcon height={12} width={12} onClick={increase} />
    </StepWrapper>
  );
};

export default StepComponent;
