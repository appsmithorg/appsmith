import React from "react";
import styled from "styled-components";
import { Classes, INumericInputProps, NumericInput } from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ThemeProp } from "components/ads/common";

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
  static getControlType() {
    return "NUMERIC_INPUT";
  }

  public render() {
    const {
      majorStepSize,
      max,
      min,
      minorStepSize,
      placeholderText,
      propertyValue,
      stepSize,
    } = this.props;
    return (
      <StyledNumericInput
        fill
        large
        majorStepSize={majorStepSize}
        max={max}
        min={min}
        minorStepSize={minorStepSize}
        onValueChange={this.handleValueChange}
        placeholder={placeholderText}
        stepSize={stepSize}
        value={propertyValue}
      />
    );
  }

  private handleValueChange = (_v: number, value: string) => {
    // Update the propertyValue
    this.updateProperty(this.props.propertyName, value);
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
}

export default NumericInputControl;
