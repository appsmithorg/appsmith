import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import DropDownComponent from "components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATORS } from "utils/Validators";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      placeholderText: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectionType: VALIDATION_TYPES.TEXT,
      selectedIndexArr: VALIDATION_TYPES.ARRAY,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      onOptionChange: VALIDATION_TYPES.ACTION_SELECTOR,
      defaultOptionValue: (value: string | string[], props?: WidgetProps) => {
        let values = value;

        if (props) {
          if (props.selectionType === "SINGLE_SELECT") {
            return VALIDATORS[VALIDATION_TYPES.TEXT](value);
          } else if (props.selectionType === "MULTI_SELECT") {
            if (typeof value === "string") {
              try {
                values = JSON.parse(value);
                if (!Array.isArray(values)) {
                  throw new Error();
                }
              } catch {
                values = value.split(",");
                if (values.length > 0) {
                  values = values.map(value => value.trim());
                }
              }
            }
          }
        }

        if (Array.isArray(values)) {
          values = _.uniq(values);
        }

        return {
          isValid: true,
          parsed: values,
        };
      },
    };
  }
  static getDerivedPropertiesMap() {
    return {
      isValid: `{{this.isRequired ? this.selectionType === 'SINGLE_SELECT' ? !!this.selectedOption : !!this.selectedIndexArr && this.selectedIndexArr.length > 0 : true}}`,
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

  componentDidMount() {
    super.componentDidMount();
    if (this.props.defaultOptionValue) {
      const selectionOptions: number[] = [];
      if (this.props.selectionType === "SINGLE_SELECT") {
        const selectedIndex = _.findIndex(this.props.options, option => {
          return (
            option.value.toString() ===
            (this.props.defaultOptionValue as string).toString()
          );
        });
        if (selectedIndex > -1) {
          selectionOptions.push(selectedIndex);
        }
      } else if (this.props.selectionType === "MULTI_SELECT") {
        (this.props.defaultOptionValue as string[]).forEach(optionValue => {
          const selectedIndex = _.findIndex(this.props.options, option => {
            return option.value.toString() === optionValue.toString();
          });
          if (selectedIndex > -1) {
            selectionOptions.push(selectedIndex);
          }
        });
      }

      if (selectionOptions.length > 0) {
        this.updateWidgetMetaProperty("selectedIndex", selectionOptions[0]);
        this.updateWidgetMetaProperty("selectedIndexArr", selectionOptions);
      }
    }
  }

  componentDidUpdate(prevProps: DropdownWidgetProps) {
    super.componentDidUpdate(prevProps);

    if (this.props.defaultOptionValue) {
      if (
        this.props.defaultOptionValue.toString() !==
        prevProps.defaultOptionValue?.toString()
      ) {
        const selectionOptions: number[] = [];
        if (this.props.selectionType === "SINGLE_SELECT") {
          const selectedIndex = _.findIndex(this.props.options, option => {
            return (
              option.value.toString() ===
              (this.props.defaultOptionValue as string).toString()
            );
          });
          if (selectedIndex > -1) {
            selectionOptions.push(selectedIndex);
          }
        } else {
          (this.props.defaultOptionValue as string[]).forEach(optionValue => {
            const selectedIndex = _.findIndex(this.props.options, option => {
              return option.value.toString() === optionValue.toString();
            });
            if (selectedIndex > -1) {
              selectionOptions.push(selectedIndex);
            }
          });
        }
        if (selectionOptions.length > 0) {
          this.updateWidgetMetaProperty("selectedIndexArr", selectionOptions);
          this.updateWidgetMetaProperty("selectedIndex", selectionOptions[0]);
        } else {
          this.updateWidgetMetaProperty("selectedIndex", undefined);
          this.updateWidgetMetaProperty("selectedIndexArr", []);
        }
      }
    }
  }
  getPageView() {
    const options = this.props.options || [];
    const selectedIndexArr = this.props.selectedIndexArr || [];
    let computedSelectedIndexArr = selectedIndexArr.slice();
    selectedIndexArr.forEach(selectedIndex => {
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
        selectedIndex={this.props.selectedIndex}
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
  defaultOptionValue?: string | string[];
  isRequired: boolean;
}

export default DropdownWidget;
