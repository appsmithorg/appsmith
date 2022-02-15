import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import ButtonTabComponent, {
  ButtonTabOption,
} from "components/ads/ButtonTabComponent";
import produce from "immer";

class ButtonTabControl extends BaseControl<ButtonTabControlProps> {
  selectButton = (value: string) => {
    const { defaultValue, propertyValue } = this.props;
    const values: string[] = propertyValue
      ? propertyValue.split(",")
      : defaultValue
      ? defaultValue.split(",")
      : [];
    if (values.includes(value)) {
      values.splice(values.indexOf(value), 1);
      this.updateProperty(this.props.propertyName, values.join(","));
    } else {
      const updatedValues: string[] = produce(values, (draft: string[]) => {
        draft.push(value);
      });
      this.updateProperty(this.props.propertyName, updatedValues.join(","));
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
}

export interface ButtonTabControlProps extends ControlProps {
  options: ButtonTabOption[];
  defaultValue: string;
}

export default ButtonTabControl;
