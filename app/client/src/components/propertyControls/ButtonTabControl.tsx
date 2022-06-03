import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import ButtonTabComponent, {
  ButtonTabOption,
} from "components/ads/ButtonTabComponent";
import produce from "immer";
import { DropDownControlProps } from "./DropDownControl";

class ButtonTabControl extends BaseControl<ButtonTabControlProps> {
  selectButton = (value: string, isUpdatedViaKeyboard = false) => {
    const { defaultValue, propertyValue } = this.props;
    const values: string[] = propertyValue
      ? propertyValue.split(",")
      : defaultValue
      ? defaultValue.split(",")
      : [];
    if (values.includes(value)) {
      values.splice(values.indexOf(value), 1);
      this.updateProperty(
        this.props.propertyName,
        values.join(","),
        isUpdatedViaKeyboard,
      );
    } else {
      const updatedValues: string[] = produce(values, (draft: string[]) => {
        draft.push(value);
      });
      this.updateProperty(
        this.props.propertyName,
        updatedValues.join(","),
        isUpdatedViaKeyboard,
      );
    }
  };
  render() {
    const { options, propertyValue } = this.props;
    return (
      <ButtonTabComponent
        options={options}
        selectButton={this.selectButton}
        values={propertyValue ? propertyValue.split(",") : []}
      />
    );
  }

  static getControlType() {
    return "BUTTON_TABS";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    const allowedValues = new Set(
      (config as DropDownControlProps)?.options?.map(
        (x: { value: string }) => x.value,
      ),
    );

    const values = value.split(",");

    for (const x of values) {
      if (!allowedValues.has(x)) return false;
    }

    return true;
  }
}

export interface ButtonTabControlProps extends ControlProps {
  options: ButtonTabOption[];
  defaultValue: string;
}

export default ButtonTabControl;
