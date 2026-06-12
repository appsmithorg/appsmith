import React from "react";
import { NumberInput } from "@appsmith/ads";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { sanitizeTabOrder } from "utils/widgetTabOrder";

export interface TabOrderControlProps extends ControlProps {
  propertyValue?: number | string;
  placeholderText?: string;
}

/**
 * Numeric input for the shared `tabOrder` property.
 *
 * Unlike NUMERIC_INPUT, this control:
 * - persists valid values as numbers (non-negative integers only)
 * - removes the property from the DSL when the field is cleared, so a blank
 *   field always means "Auto"
 * - never persists invalid placeholder strings
 */
class TabOrderControl extends BaseControl<TabOrderControlProps> {
  inputElement: HTMLInputElement | null;

  constructor(props: TabOrderControlProps) {
    super(props);
    this.inputElement = null;
  }

  static getControlType() {
    return "TAB_ORDER_INPUT";
  }

  public render() {
    const { placeholderText, propertyValue } = this.props;

    return (
      <NumberInput
        min={0}
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
    return sanitizeTabOrder(value) !== undefined;
  }

  private handleValueChange = (value: string | undefined) => {
    const { propertyName, propertyValue } = this.props;

    if (value === undefined || value.trim() === "") {
      // Clearing the field returns the widget to "Auto" by removing the
      // property from the DSL instead of persisting an empty string
      if (propertyValue !== undefined && propertyValue !== null) {
        this.deleteProperties([propertyName]);
      }

      return;
    }

    const sanitized = sanitizeTabOrder(value);

    // invalid values (decimals, non-numeric input) are never persisted
    if (sanitized === undefined) return;

    this.updateProperty(
      propertyName,
      sanitized,
      document.activeElement === this.inputElement,
    );
  };
}

export default TabOrderControl;
