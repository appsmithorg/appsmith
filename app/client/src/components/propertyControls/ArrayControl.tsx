import { objectKeys } from "@appsmith/utils";
import type { DropdownOption } from "components/constants";
import React from "react";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { ArrayComponent } from "./ArrayComponent";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

class ArrayControl extends BaseControl<ControlProps> {
  render() {
    return (
      <ArrayComponent
        items={this.props.propertyValue}
        updateItems={this.updateItems}
      />
    );
  }

  updateItems = (items: string[], isUpdatedViaKeyboard = false) => {
    this.updateProperty(this.props.propertyName, items, isUpdatedViaKeyboard);
  };

  static getControlType() {
    return "ARRAY_INPUT";
  }

  static canDisplayValueInUI(_config: ControlData, value: string): boolean {
    if (isDynamicValue(value)) return false;

    try {
      const items: DropdownOption[] = JSON.parse(value);

      for (const x of items) {
        const keys = objectKeys(x);

        if (!keys.includes("label") || !keys.includes("value")) {
          return false;
        }
      }
    } catch {
      return false;
    }

    return true;
  }
}

export default ArrayControl;
