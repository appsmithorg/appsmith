import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "design-system";
import { isNil } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { DSEventDetail, DSEventTypes, DS_EVENT } from "utils/AppsmithUtils";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

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

    const options = this.props?.options || [];

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
        isDynamicValue(this.props.propertyValue)
          ? this.props.evaluatedValue
          : this.props.propertyValue;

      selected = options.find((option) => option.value === computedValue);
    }

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer ref={this.containerRef}>
        <StyledDropDown
          closeOnSpace={false}
          dropdownHeight={this.props.dropdownHeight}
          dropdownMaxHeight="200px"
          enableSearch={this.props.enableSearch}
          fillOptions
          hideSubText={this.props.hideSubText}
          isMultiSelect={this.props.isMultiSelect}
          onSelect={this.onItemSelect}
          optionWidth={
            this.props.optionWidth ? this.props.optionWidth : "231px"
          }
          options={options}
          placeholder={this.props.placeholderText}
          removeSelectedOption={this.onItemRemove}
          searchAutoFocus
          searchPlaceholder={this.props.searchPlaceholderText}
          selected={defaultSelected}
          showEmptyOptions
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
    const allowedValues = new Set(
      config?.options?.map((x: { value: string | number }) =>
        x.value.toString(),
      ),
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
  options?: any[];
  defaultValue?: string;
  placeholderText: string;
  searchPlaceholderText: string;
  isMultiSelect?: boolean;
  dropdownHeight?: string;
  enableSearch?: boolean;
  propertyValue: string;
  optionWidth?: string;
  hideSubText?: boolean;
}

export default DropDownControl;
