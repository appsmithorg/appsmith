import React from "react";
import styled from "styled-components";
import type { INumericInputProps } from "@blueprintjs/core";
import { Classes, NumericInput } from "@blueprintjs/core";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";
import type { ThemeProp } from "widgets/constants";

const StyledNumericInput = styled(NumericInput)<ThemeProp & INumericInputProps>`
  &&& {
    &.bp3-control-group {
      .${Classes.INPUT} {
        &:focus {
          box-shadow: none;
          border-radius: 0;
          border: 1px solid var(--appsmith-input-focus-border-color);
        }
      }
      .bp3-input-group {
        border-radius: 0;
        .bp3-input {
          font-size: 14px;
        }
      }
      .bp3-button-group {
        .bp3-button {
          border-radius: 0;
          &:focus {
            border: 1px solid var(--appsmith-input-focus-border-color);
          }
        }
      }
    }
  }
`;

class NumericInputControl extends BaseControl<NumericInputControlProps> {
  inputElement: HTMLInputElement | null;

  constructor(props: NumericInputControlProps) {
    super(props);
    this.inputElement = null;
  }

  static getControlType() {
    return "NUMERIC_INPUT";
  }

  handleKeydown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      emitInteractionAnalyticsEvent(this.inputElement, {
        key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
      });
    }
  };

  public render() {
    const {
      majorStepSize,
      max,
      min,
      minorStepSize,
      onBlur,
      onFocus,
      placeholderText,
      propertyValue,
      stepSize,
    } = this.props;
    return (
      <StyledNumericInput
        fill
        inputRef={(elm) => {
          this.inputElement = elm;
        }}
        large
        majorStepSize={majorStepSize}
        max={max}
        min={min}
        minorStepSize={minorStepSize}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={this.handleKeydown}
        onValueChange={this.handleValueChange}
        placeholder={placeholderText}
        stepSize={stepSize}
        value={propertyValue}
      />
    );
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isNaN(Number(value));
  }

  private handleValueChange = (_v: number, value: string) => {
    // Update the propertyValue
    this.updateProperty(
      this.props.propertyName,
      value,
      document.activeElement === this.inputElement,
    );
  };
}

export interface NumericInputControlProps extends ControlProps {
  propertyValue: string;
  min?: number;
  max?: number;
  minorStepSize?: number | null;
  majorStepSize?: number | null;
  placeholderText?: string;
  stepSize?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default NumericInputControl;
