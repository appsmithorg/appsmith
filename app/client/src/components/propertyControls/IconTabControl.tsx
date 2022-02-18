import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import ButtonTabComponent, {
  ButtonTabOption,
} from "components/ads/ButtonTabComponent";

class IconTabControl extends BaseControl<IconTabControlProps> {
  selectOption = (value: string) => {
    const { defaultValue, propertyValue } = this.props;
    if (propertyValue === value) {
      this.updateProperty(this.props.propertyName, defaultValue);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };
  render() {
    const { options, propertyValue } = this.props;
    return (
      <ButtonTabComponent
        options={options}
        selectButton={this.selectOption}
        values={[propertyValue]}
      />
    );
  }

  static getControlType() {
    return "ICON_TABS";
  }
}

export interface IconTabControlProps extends ControlProps {
  options: ButtonTabOption[];
  defaultValue: string;
}

export default IconTabControl;
