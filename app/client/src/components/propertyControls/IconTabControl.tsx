import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import IconTabsComponent, {
  IconTabOption,
} from "components/ads/IconTabsComponent";

class IconTabControl extends BaseControl<IconTabControlProps> {
  selectOption = (value: string) => {
    const { propertyValue, defaultValue } = this.props;
    if (propertyValue === value) {
      this.updateProperty(this.props.propertyName, defaultValue);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };
  render() {
    const { propertyValue, options } = this.props;
    return (
      <IconTabsComponent
        options={options}
        value={propertyValue}
        selectOption={this.selectOption}
      />
    );
  }

  static getControlType() {
    return "ICON_TABS";
  }
}

export interface IconTabControlProps extends ControlProps {
  options: IconTabOption[];
  defaultValue: string;
}

export default IconTabControl;
