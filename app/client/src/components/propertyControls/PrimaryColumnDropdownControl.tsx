import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";
import {
  DSEventDetail,
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

class PrimaryColumnDropdownControl extends BaseControl<ControlProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.containerRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "Dropdown" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.containerRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

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
      <StyledDropDownContainer ref={this.containerRef}>
        <StyledDropDown
          dropdownMaxHeight="200px"
          fillOptions
          onSelect={this.onItemSelect}
          options={options}
          selected={defaultSelected}
          showLabelOnly
          width="100%"
        />
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (
    value?: string,
    _option?: DropdownOption,
    isUpdatedViaKeyboard?: boolean,
  ): void => {
    if (value) {
      this.updateProperty(this.props.propertyName, value, isUpdatedViaKeyboard);
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
