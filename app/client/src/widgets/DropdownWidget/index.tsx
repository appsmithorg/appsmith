import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DropDownComponent from "components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { Intent as BlueprintIntent } from "@blueprintjs/core";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "../MetaHOC";
import { IconName } from "@blueprintjs/icons";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import derivedProperties from "./parseDerivedProperties";

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
            placeholderText: 'Enter [{"label": "label1", "value": "value2"}]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.OPTIONS_DATA,
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default Option",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.DEFAULT_OPTION_VALUE,
          },
          {
            propertyName: "isFilterable",
            label: "Filterable",
            helpText: "Makes the dropdown list filterable",
            controlType: "SWITCH",
            isJSConvertible: true,
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
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
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

  static getDerivedPropertiesMap() {
    return {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
      selectedOption: `{{(() => {${derivedProperties.getSelectedOption}})()}}`,
      selectedOptionArr: `{{(() => {${derivedProperties.getSelectedOptionValueArr}})()}}`,
      selectedIndex: `{{(() => {${derivedProperties.getSelectedIndex}})()}}`,
      selectedIndexArr: `{{(() => {${derivedProperties.getSelectedIndexArr}})()}}`,
      value: `{{(() => {${derivedProperties.getSelectedValue}})()}}`,
      selectedOptionValues: `{{(() => {${derivedProperties.getSelectedOptionValues}})()}}`,
      selectedOptionLabels: `{{(() => {${derivedProperties.getSelectedOptionLabels}})()}}`,
      selectedOptionLabel: `{{(() => {${derivedProperties.getSelectedOptionLabel}})()}}`,
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

  getSelectedOptionValueArr(): Array<number | string> {
    const { options } = this.props;
    return Array.isArray(this.props.selectedIndexArr) && options
      ? this.props.selectedIndexArr.map((index) => options[index].value)
      : [];
  }

  getPageView() {
    const options = _.isArray(this.props.options) ? this.props.options : [];
    const selectedIndex = _.findIndex(this.props.options, {
      value: this.props.selectedOptionValue,
    });
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return (
      <DropDownComponent
        disabled={this.props.isDisabled}
        height={componentHeight}
        isFilterable={this.props.isFilterable}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        onOptionRemoved={this.onOptionRemoved}
        onOptionSelected={this.onOptionSelected}
        options={options}
        placeholder={this.props.placeholderText}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        selectedIndexArr={this.props.selectedIndexArr || []}
        selectionType={this.props.selectionType}
        widgetId={this.props.widgetId}
        width={componentWidth}
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
            triggerPropertyName: "onOptionChange",
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
          triggerPropertyName: "onOptionChange",
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
      (v: number | string) =>
        _.findIndex(this.props.options, { value: v }) !== removedIndex,
    );
    this.props.updateWidgetMetaProperty(
      "selectedOptionValueArr",
      newSelectedValue,
      {
        triggerPropertyName: "onOptionChange",
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
  value: any;
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
  isFilterable: boolean;
  selectedOptionValue: string;
  selectedOptionValueArr: string[];
  selectedOptionLabels: string[];
  selectedOptionLabel: string;
}

export default DropdownWidget;
export const ProfiledDropDownWidget = Sentry.withProfiler(
  withMeta(DropdownWidget),
);
