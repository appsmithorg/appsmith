import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";

class PrimaryColumnDropdownControl extends BaseControl<ControlProps> {
  render() {
    // Get columns from widget properties
    const columns: Record<string, ColumnProperties> = this.props
      .widgetProperties.primaryColumns;
    const options: any[] = [];

    for (const i in columns) {
      options.push({
        label: columns[i].label,
        id: columns[i].id,
        value: i,
      });
    }

    let defaultSelected: DropdownOption = {
      label: "No selection.",
      value: undefined,
    };

    const selected: DropdownOption = options.find(
      (option) => option.value === this.props.propertyValue,
    );

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer>
        <StyledDropDown
          onSelect={this.onItemSelect}
          options={options}
          selected={defaultSelected}
          showLabelOnly
          width="100%"
        />
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (value?: string): void => {
    if (value) {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  static getControlType() {
    return "PRIMARY_COLUMNS_DROPDOWN";
  }
}

export interface PrimaryColumnDropdownControlProps extends ControlProps {
  propertyValue: string;
}

export default PrimaryColumnDropdownControl;
