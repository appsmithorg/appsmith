import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DropDownComponent from "components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { Intent as BlueprintIntent } from "@blueprintjs/core";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { IconName } from "@blueprintjs/icons";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Allows users to select either a single option or multiple options",
            propertyName: "selectionType",
            label: "Selection Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Single Select",
                value: "SINGLE_SELECT",
              },
              {
                label: "Multi Select",
                value: "MULTI_SELECT",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText:
              "Allows users to select either a single option or multiple options. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: 'Enter [{label: "label1", value: "value2"}]',
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default Option",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when a user selects an option",
            propertyName: "onOptionChange",
            label: "onOptionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      placeholderText: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      options: VALIDATION_TYPES.OPTIONS_DATA,
      selectionType: VALIDATION_TYPES.TEXT,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onOptionChange: VALIDATION_TYPES.ACTION_SELECTOR,
      selectedOptionValues: VALIDATION_TYPES.ARRAY,
      selectedOptionLabels: VALIDATION_TYPES.ARRAY,
      selectedOptionLabel: VALIDATION_TYPES.TEXT,
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
      selectedOptionLabels: `{{ this.selectionType === "MULTI_SELECT" ? this.selectedOptionValueArr.map(o => { const index = _.findIndex(this.options, { value: o }); return this.options[index]?.label; }) : [] }}`,
      selectedOptionLabel: `{{(()=>{const index = _.findIndex(this.options, { value: this.selectedOptionValue }); return this.selectionType === "SINGLE_SELECT" ? this.options[index]?.label : ""; })()}}`,
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

  getSelectedOptionValueArr(): string[] {
    return Array.isArray(this.props.selectedOptionValueArr)
      ? this.props.selectedOptionValueArr
      : [];
  }

  getPageView() {
    const options = this.props.options || [];
    const selectedIndex = _.findIndex(this.props.options, {
      value: this.props.selectedOptionValue,
    });
    const computedSelectedIndexArr = this.getSelectedOptionValueArr()
      .map((opt: string) =>
        _.findIndex(this.props.options, {
          value: opt,
        }),
      )
      .filter((i: number) => i > -1);
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
      // Check if the value has changed. If no option
      // selected till now, there is a change
      if (this.props.selectedOption) {
        isChanged = !(this.props.selectedOption.value === selectedOption.value);
      }
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
      const selectedOptionValueArr = this.getSelectedOptionValueArr();
      const isAlreadySelected = selectedOptionValueArr.includes(
        selectedOption.value,
      );

      let newSelectedValue = [...selectedOptionValueArr];
      if (isAlreadySelected) {
        newSelectedValue = newSelectedValue.filter(
          (v) => v !== selectedOption.value,
        );
      } else {
        newSelectedValue.push(selectedOption.value);
      }
      this.props.updateWidgetMetaProperty(
        "selectedOptionValueArr",
        newSelectedValue,
        {
          dynamicString: this.props.onOptionChange,
          event: {
            type: EventType.ON_OPTION_CHANGE,
          },
        },
      );
    }
  };

  onOptionRemoved = (removedIndex: number) => {
    const newSelectedValue = this.getSelectedOptionValueArr().filter(
      (v: string) =>
        _.findIndex(this.props.options, { value: v }) !== removedIndex,
    );
    this.props.updateWidgetMetaProperty(
      "selectedOptionValueArr",
      newSelectedValue,
      {
        dynamicString: this.props.onOptionChange,
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
  icon?: IconName;
  subText?: string;
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
  onOptionChange?: string;
  defaultOptionValue?: string | string[];
  isRequired: boolean;
  selectedOptionValue: string;
  selectedOptionValueArr: string[];
  selectedOptionLabels: string[];
  selectedOptionLabel: string;
}

export default DropdownWidget;
export const ProfiledDropDownWidget = Sentry.withProfiler(
  withMeta(DropdownWidget),
);
