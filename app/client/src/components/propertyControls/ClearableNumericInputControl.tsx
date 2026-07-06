import React from "react";
import { NumberInput } from "@appsmith/ads";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

export interface ClearableNumericInputControlProps extends ControlProps {
  propertyValue?: number | string | null;
  min?: number;
  max?: number;
  placeholderText?: string;
}

/**
 * Numeric input that treats an empty field as "unset": clearing the field
 * removes the property from the DSL instead of persisting a blank value, so a
 * blank field means the property is not set.
 *
 * It is intentionally generic — non-numeric input is rejected by the underlying
 * NumberInput, and range/format validation of the entered value is left to the
 * property's own `validation` config (e.g. `{ min, natural }`).
 */
class ClearableNumericInputControl extends BaseControl<ClearableNumericInputControlProps> {
  inputElement: HTMLInputElement | null = null;

  static getControlType() {
    return "CLEARABLE_NUMERIC_INPUT";
  }

  public render() {
    const { max, min, placeholderText, propertyValue } = this.props;

    return (
      <NumberInput
        max={max}
        min={min}
        onChange={this.handleValueChange}
        placeholder={placeholderText}
        ref={(element: HTMLInputElement) => {
          this.inputElement = element;
        }}
        value={
          propertyValue === undefined || propertyValue === null
            ? ""
            : String(propertyValue)
        }
      />
    );
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    if (value === null || value === undefined) return false;

    // trim strings so whitespace-only input is treated as blank, matching the
    // clear semantics in handleValueChange
    const normalized = typeof value === "string" ? value.trim() : value;

    if (normalized === "") return false;

    return !isNaN(Number(normalized));
  }

  private handleValueChange = (value: string | undefined) => {
    const { propertyName, propertyValue } = this.props;

    if (value === undefined || value.trim() === "") {
      // Clearing the field unsets the property instead of persisting a blank.
      // Delete any existing value (including a stale null), but skip when the
      // property is already absent.
      if (propertyValue !== undefined) {
        this.deleteProperties([propertyName]);
      }

      return;
    }

    const parsed = Number(value);

    if (isNaN(parsed)) return;

    this.updateProperty(
      propertyName,
      parsed,
      document.activeElement === this.inputElement,
    );
  };
}

export default ClearableNumericInputControl;
