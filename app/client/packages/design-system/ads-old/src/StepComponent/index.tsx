import React, { useCallback } from "react";
import { ControlIcons } from "../ControlIcons";
import type { AnyStyledComponent } from "styled-components";
import styled from "styled-components";
import useDSEvent from "hooks/useDSEvent";
import { DSEventTypes } from "../types/common";

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
  background-color: var(--ads-step-component-wrapper-background-color);
  && svg {
    path {
      fill: var(--ads-step-component-wrapper-svg-fill-color);
    }
  }

  &:focus {
    border: 1px solid var(--appsmith-input-focus-border-color);
  }
`;

const InputWrapper = styled.div`
  width: calc(100% - 120px);
  height: 30px;
  line-height: 30px;
  font-size: 14px;
  text-align: center;
  letter-spacing: 1.44px;
  color: var(--ads-step-component-input-wrapper-text-color);
  background-color: var(--ads-step-component-input-wrapper-background-color);
`;

interface StepComponentProps {
  value: number;
  min: number;
  max: number;
  steps: number;
  displayFormat: (value: number) => string;
  onChange: (value: number, isUpdatedViaKeyboard: boolean) => void;
}

const StepComponent = React.forwardRef(
  (props: StepComponentProps, ref: any) => {
    const { displayFormat, onChange } = props;
    const { emitDSEvent, eventEmitterRef } = useDSEvent<HTMLDivElement>(
      false,
      ref,
    );

    const emitKeyPressEvent = useCallback(
      (key: string) => {
        emitDSEvent({
          component: "StepComponent",
          event: DSEventTypes.KEYPRESS,
          meta: {
            key,
          },
        });
      },
      [emitDSEvent],
    );

    function decrease(isUpdatedViaKeyboard = false) {
      if (props.value < props.min) {
        return;
      }
      const value = props.value - props.steps;
      onChange(value, isUpdatedViaKeyboard);
    }

    function increase(isUpdatedViaKeyboard = false) {
      if (props.value > props.max) {
        return;
      }
      const value = props.value + props.steps;
      onChange(value, isUpdatedViaKeyboard);
    }

    function handleKeydown(e: React.KeyboardEvent) {
      switch (e.key) {
        case "ArrowUp":
        case "Up":
        case "ArrowRight":
        case "Right":
          emitKeyPressEvent(e.key);
          increase(true);
          e.preventDefault();
          break;
        case "ArrowDown":
        case "Down":
        case "ArrowLeft":
        case "Left":
          emitKeyPressEvent(e.key);
          decrease(true);
          e.preventDefault();
          break;
        case "Tab":
          emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
          break;
      }
    }

    return (
      <StepWrapper
        data-testid="step-wrapper"
        onKeyDown={handleKeydown}
        ref={eventEmitterRef}
        tabIndex={0}
      >
        <StyledDecreaseIcon
          height={2}
          onClick={() => decrease(false)}
          width={12}
        />
        <InputWrapper>{displayFormat(props.value)}</InputWrapper>
        <StyledIncreaseIcon
          height={12}
          onClick={() => increase(false)}
          width={12}
        />
      </StepWrapper>
    );
  },
);

StepComponent.displayName = "StepComponent";

export default StepComponent;
