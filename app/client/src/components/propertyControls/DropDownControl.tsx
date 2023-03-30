import React from "react";
import styled from "styled-components";
import { Option, Select } from "design-system";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { StyledDropDownContainer } from "./StyledControls";
import type { DropdownOption } from "design-system-old";
import { isNil } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { DSEventDetail } from "utils/AppsmithUtils";
import { DSEventTypes, DS_EVENT } from "utils/AppsmithUtils";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

const StyledSelect = styled(Select)`
  /*
    We use this font family to show emoji flags
    on windows devices
  */
  .left-icon-wrapper {
    font-family: "Twemoji Country Flags";
  }
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
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
    let defaultSelected: DropdownOption | DropdownOption[] = {
      label: "No selection.",
      value: undefined,
    };

    if (this.props.isMultiSelect) {
      defaultSelected = [defaultSelected];
    }

    const options =
      typeof this.props.options === "function"
        ? this.props.options(this.props.widgetProperties)
        : this.props?.options || [];

    if (this.props.defaultValue) {
      if (this.props.isMultiSelect) {
        const defaultValueSet = new Set(this.props.defaultValue);
        defaultSelected = options.filter((option) =>
          defaultValueSet.has(option.value),
        );
      } else {
        defaultSelected = options.find(
          (option) => option.value === this.props.defaultValue,
        );
      }
    }

    let selected: DropdownOption | DropdownOption[];

    if (this.props.isMultiSelect) {
      const propertyValueSet = new Set(this.props.propertyValue);
      selected = options.filter((option) => propertyValueSet.has(option.value));
    } else {
      const computedValue =
        !isNil(this.props.propertyValue) &&
        isDynamicValue(this.props.propertyValue) &&
        // "dropdownUsePropertyValue" comes from the property config. This is set to true when
        // the actual propertyValue (not the evaluated) is to be used for finding the option from "options".
        !this.props.dropdownUsePropertyValue
          ? this.props.evaluatedValue
          : this.props.propertyValue;

      selected = options.find((option) => option.value === computedValue);
    }

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer ref={this.containerRef}>
        <StyledSelect
          // closeOnSpace={false}
          // dropdownHeight={this.props.dropdownHeight}
          // dropdownMaxHeight="200px"
          isMultiSelect={this.props.isMultiSelect}
          // enableSearch={this.props.enableSearch}
          // fillOptions
          // hideSubText={this.props.hideSubText}
          // @ts-expect-error: Type mismatch
          onSelect={this.onItemSelect}
          // options={options}
          // optionWidth={
          //   this.props.optionWidth ? this.props.optionWidth : "231px"
          // }
          placeholder={this.props.placeholderText}
          removeSelectedOption={this.onItemRemove}
          selected={defaultSelected}
          // searchAutoFocus
          // searchPlaceholder={this.props.searchPlaceholderText}
          showSearch={this.props.enableSearch}
          // showEmptyOptions
          // showLabelOnly
          // width="100%"
        >
          {options.map((option) => {
            return (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            );
          })}
        </StyledSelect>
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (
    value?: string,
    _option?: DropdownOption,
    isUpdatedViaKeyboard?: boolean,
  ): void => {
    if (!isNil(value)) {
      let selectedValue: string | string[] = this.props.propertyValue;
      if (this.props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          const index = selectedValue.indexOf(value);
          if (index >= 0) {
            selectedValue = [
              ...selectedValue.slice(0, index),
              ...selectedValue.slice(index + 1),
            ];
          } else {
            selectedValue = [...selectedValue, value];
          }
        } else {
          selectedValue = [selectedValue, value];
        }
      } else {
        selectedValue = value;
      }
      this.updateProperty(
        this.props.propertyName,
        selectedValue,
        isUpdatedViaKeyboard,
      );
    }
  };

  onItemRemove = (value?: string) => {
    if (!isNil(value)) {
      let selectedValue: string | string[] = this.props.propertyValue;
      if (this.props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          const index = selectedValue.indexOf(value);
          if (index >= 0) {
            selectedValue = [
              ...selectedValue.slice(0, index),
              ...selectedValue.slice(index + 1),
            ];
          }
        } else {
          selectedValue = [];
        }
      } else {
        selectedValue = "";
      }
      this.updateProperty(this.props.propertyName, selectedValue);
    }
  };

  isOptionSelected = (selectedOption: any) => {
    return selectedOption.value === this.props.propertyValue;
  };

  static getControlType() {
    return "DROP_DOWN";
  }

  static canDisplayValueInUI(
    config: DropDownControlProps,
    value: any,
  ): boolean {
    const options =
      typeof config?.options === "function"
        ? config?.options(config.widgetProperties)
        : config?.options || [];

    const allowedValues = new Set(
      options?.map((x: { value: string | number }) => x.value.toString()),
    );
    if (config.isMultiSelect) {
      try {
        const values = JSON.parse(value);
        for (const x of values) {
          if (!allowedValues.has(x.toString())) return false;
        }
      } catch {
        return false;
      }
      return true;
    } else {
      return allowedValues.has(value);
    }
  }
}

export interface DropDownControlProps extends ControlProps {
  options?: any[] | ((props: ControlProps["widgetProperties"]) => any[]);
  defaultValue?: string;
  placeholderText: string;
  searchPlaceholderText: string;
  isMultiSelect?: boolean;
  dropdownHeight?: string;
  enableSearch?: boolean;
  propertyValue: string;
  optionWidth?: string;
  hideSubText?: boolean;
  dropdownUsePropertyValue?: boolean;
}

export default DropDownControl;
