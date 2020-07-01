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
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { Intent as BlueprintIntent } from "@blueprintjs/core";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      placeholderText: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectionType: VALIDATION_TYPES.TEXT,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      onOptionChange: VALIDATION_TYPES.ACTION_SELECTOR,
      selectedOptionValueArr: VALIDATION_TYPES.ARRAY,
      defaultOptionValue: (
        value: string | string[],
        props: WidgetProps,
        dataTree?: DataTree,
      ) => {
        let values = value;

        if (props) {
          if (props.selectionType === "SINGLE_SELECT") {
            return VALIDATORS[VALIDATION_TYPES.TEXT](value, props, dataTree);
          } else if (props.selectionType === "MULTI_SELECT") {
            if (typeof value === "string") {
              try {
                values = JSON.parse(value);
                if (!Array.isArray(values)) {
                  throw new Error();
                }
              } catch {
                values = value.length ? value.split(",") : [];
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
      selectedOption: `{{ this.selectionType === 'SINGLE_SELECT' ? _.find(this.options, { value:  this.selectedOptionValue }) : undefined}}`,
      selectedOptionArr: `{{this.selectionType === "MULTI_SELECT" ? this.options.filter(opt => _.includes(this.selectedOptionValueArr, opt.value)) : undefined}}`,
      selectedIndex: `{{ _.findIndex(this.options, { value: this.selectedOption.value } ) }}`,
      selectedIndexArr: `{{ this.selectedOptionValueArr.map(o => _.findIndex(this.options, { value: o })) }}`,
      value: `{{ this.selectionType === 'SINGLE_SELECT' ? this.selectedOptionValue : this.selectedOptionValueArr }}`,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onOptionChange: true,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValue: "defaultOptionValue",
      selectedOptionValueArr: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValue: undefined,
      selectedOptionValueArr: undefined,
    };
  }

  getPageView() {
    const options = this.props.options || [];
    const selectedIndex = _.findIndex(this.props.options, {
      value: this.props.selectedOptionValue,
    });
    const computedSelectedIndexArr = Array.isArray(
      this.props.selectedOptionValueArr,
    )
      ? this.props.selectedOptionValueArr
          .map((opt: string) =>
            _.findIndex(this.props.options, {
              value: opt,
            }),
          )
          .filter((i: number) => i > -1)
      : [];

    return (
      <DropDownComponent
        onOptionSelected={this.onOptionSelected}
        onOptionRemoved={this.onOptionRemoved}
        widgetId={this.props.widgetId}
        placeholder={this.props.placeholderText}
        options={options}
        selectionType={this.props.selectionType}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        selectedIndexArr={computedSelectedIndexArr}
        label={`${this.props.label}`}
        isLoading={this.props.isLoading}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    if (this.props.selectionType === "SINGLE_SELECT") {
      this.updateWidgetMetaProperty(
        "selectedOptionValue",
        selectedOption.value,
      );
    } else if (this.props.selectionType === "MULTI_SELECT") {
      const isAlreadySelected = this.props.selectedOptionValueArr.includes(
        selectedOption.value,
      );

      let newSelectedValue = [...this.props.selectedOptionValueArr];
      if (isAlreadySelected) {
        newSelectedValue = newSelectedValue.filter(
          v => v !== selectedOption.value,
        );
      } else {
        newSelectedValue.push(selectedOption.value);
      }
      this.updateWidgetMetaProperty("selectedOptionValueArr", newSelectedValue);
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
    const newSelectedValue = this.props.selectedOptionValueArr.filter(
      (v: string) =>
        _.findIndex(this.props.options, { value: v }) !== removedIndex,
    );
    this.updateWidgetMetaProperty("selectedOptionValueArr", newSelectedValue);
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
  intent?: BlueprintIntent;
}

export interface DropdownWidgetProps extends WidgetProps {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectionType: SelectionType;
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange?: string;
  defaultOptionValue?: string | string[];
  isRequired: boolean;
}

export default DropdownWidget;
