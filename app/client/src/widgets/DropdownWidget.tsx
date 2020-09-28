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
import { Intent as BlueprintIntent } from "@blueprintjs/core";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { ActionDescription } from "../entities/DataTree/dataTreeFactory";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      placeholderText: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectionType: VALIDATION_TYPES.TEXT,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onOptionChange: VALIDATION_TYPES.ACTION_SELECTOR,
      selectedOptionValueArr: VALIDATION_TYPES.ARRAY,
      selectedOptionValues: VALIDATION_TYPES.ARRAY,
      defaultOptionValue: VALIDATION_TYPES.DEFAULT_OPTION_VALUE,
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
      selectedOptionValues: `{{ this.selectedOptionValueArr }}`,
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
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    return (
      <DropDownComponent
        onOptionSelected={this.onOptionSelected}
        onOptionRemoved={this.onOptionRemoved}
        widgetId={this.props.widgetId}
        placeholder={this.props.placeholderText}
        options={options}
        height={componentHeight}
        width={componentWidth}
        selectionType={this.props.selectionType}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        selectedIndexArr={computedSelectedIndexArr}
        label={`${this.props.label}`}
        isLoading={this.props.isLoading}
        disabled={this.props.isDisabled}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    let isChanged = true;
    if (this.props.selectionType === "SINGLE_SELECT") {
      isChanged = !(this.props.selectedOption.value === selectedOption.value);
      if (isChanged) {
        this.props.updateWidgetMetaProperty(
          "selectedOptionValue",
          selectedOption.value,
          {
            dynamicString: this.props.onOptionChange,
            event: {
              type: EventType.ON_OPTION_CHANGE,
            },
          },
        );
      }
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
      this.props.updateWidgetMetaProperty(
        "selectedOptionValueArr",
        newSelectedValue,
        {
          triggers: this.props.onOptionChange,
          event: {
            type: EventType.ON_OPTION_CHANGE,
          },
        },
      );
    }
  };

  onOptionRemoved = (removedIndex: number) => {
    const newSelectedValue = this.props.selectedOptionValueArr.filter(
      (v: string) =>
        _.findIndex(this.props.options, { value: v }) !== removedIndex,
    );
    this.props.updateWidgetMetaProperty(
      "selectedOptionValueArr",
      newSelectedValue,
      {
        triggers: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      },
    );
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

export interface DropdownWidgetProps extends WidgetProps, WithMeta {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectionType: SelectionType;
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange?: ActionDescription<any>[];
  defaultOptionValue?: string | string[];
  isRequired: boolean;
  selectedOptionValue: string;
  selectedOptionValueArr: string[];
}

export default DropdownWidget;
export const ProfiledDropDownWidget = Sentry.withProfiler(
  withMeta(DropdownWidget),
);
