import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import DropDownComponent from "components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      placeholderText: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectionType: VALIDATION_TYPES.TEXT,
      selectedIndex: VALIDATION_TYPES.NUMBER,
      selectedIndexArr: VALIDATION_TYPES.ARRAY,
      isRequired: VALIDATION_TYPES.BOOLEAN,
    };
  }
  static getDerivedPropertiesMap() {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedOption.value : true }}`,
      selectedOption: `{{
        this.selectionType === 'SINGLE_SELECT'
          ? this.options[this.selectedIndex]
          : undefined
      }}`,
      selectedOptionArr: `{{
        this.selectionType === "MULTI_SELECT"
          ? this.options.filter((opt, index) =>
              _.includes(this.selectedIndexArr, index),
            )
          : undefined
      }}`,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onOptionChange: true,
    };
  }

  componentDidUpdate(prevProps: DropdownWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      JSON.stringify(prevProps.options) !== JSON.stringify(this.props.options)
    ) {
      this.updateWidgetMetaProperty("selectedIndex", undefined);
      this.updateWidgetMetaProperty("selectedIndexArr", []);
    }
  }
  getPageView() {
    const options = this.props.options || [];
    let selectedIndex: number | undefined = undefined;
    if (
      this.props.selectedIndex !== undefined &&
      this.props.selectedIndex < options.length &&
      this.props.selectedIndex >= 0
    ) {
      selectedIndex = this.props.selectedIndex;
    }

    const selectedIndexArr = this.props.selectedIndexArr || [];
    let computedSelectedIndexArr = selectedIndexArr.slice();
    selectedIndexArr.forEach((selectedIndex, index) => {
      if (options[selectedIndex] === undefined) {
        computedSelectedIndexArr = [];
      }
    });

    return (
      <DropDownComponent
        onOptionSelected={this.onOptionSelected}
        onOptionRemoved={this.onOptionRemoved}
        widgetId={this.props.widgetId}
        placeholder={this.props.placeholderText}
        options={options}
        selectionType={this.props.selectionType}
        selectedIndex={selectedIndex}
        selectedIndexArr={computedSelectedIndexArr}
        label={`${this.props.label}${this.props.isRequired ? " *" : ""}`}
        isLoading={this.props.isLoading}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    const selectedIndex = _.findIndex(this.props.options, option => {
      return option.value === selectedOption.value;
    });
    if (this.props.selectionType === "SINGLE_SELECT") {
      this.updateWidgetMetaProperty("selectedIndex", selectedIndex);
    } else if (this.props.selectionType === "MULTI_SELECT") {
      const selectedIndexArr = this.props.selectedIndexArr || [];
      const isAlreadySelected =
        _.find(selectedIndexArr, index => {
          return index === selectedIndex;
        }) !== undefined;
      if (isAlreadySelected) {
        this.onOptionRemoved(selectedIndex);
      } else {
        selectedIndexArr.push(selectedIndex);
        this.updateWidgetMetaProperty("selectedIndexArr", selectedIndexArr);
      }
    }
    if (this.props.onOptionChange) {
      super.executeAction({
        dynamicString: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }
  };

  onOptionRemoved = (removedIndex: number) => {
    const updateIndexArr = this.props.selectedIndexArr
      ? this.props.selectedIndexArr.filter(index => {
          return removedIndex !== index;
        })
      : [];
    this.updateWidgetMetaProperty("selectedIndexArr", updateIndexArr);
    if (this.props.onOptionChange) {
      super.executeAction({
        dynamicString: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }
  };

  getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export type SelectionType = "SINGLE_SELECT" | "MULTI_SELECT";
export interface DropdownOption {
  label: string;
  value: string;
  id?: string;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
}

export interface DropdownWidgetProps extends WidgetProps {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectionType: SelectionType;
  options?: DropdownOption[];
  onOptionChange?: string;
  isRequired: boolean;
}

export default DropdownWidget;
