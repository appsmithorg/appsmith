import React from "react";
import { NumberInput } from "@appsmith/ads";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

export interface NumericInputControlProps extends ControlProps {
  propertyValue: string;
  min?: number;
  max?: number;
  placeholderText?: string;
  stepSize?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}
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
      max,
      min,
      onBlur,
      onFocus,
      placeholderText,
      propertyValue,
      stepSize,
    } = this.props;
    return (
      <NumberInput
        max={max}
        min={min}
        onBlur={onBlur}
        onChange={this.handleValueChange}
        onFocus={onFocus}
        placeholder={placeholderText}
        ref={(element: HTMLInputElement) => {
          this.inputElement = element;
        }}
        scale={stepSize}
        value={propertyValue}
      />
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isNaN(Number(value));
  }

  private handleValueChange = (value: string | undefined) => {
    // Update the propertyValue
    this.updateProperty(
      this.props.propertyName,
      value?.toString(),
      document.activeElement === this.inputElement,
    );
  };
}

export default NumericInputControl;
