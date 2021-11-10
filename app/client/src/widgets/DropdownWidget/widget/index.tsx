import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DropDownComponent from "../component";
import _ from "lodash";
import { DropdownOption } from "../constants";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function defaultOptionValueValidation(value: unknown): ValidationResponse {
  if (typeof value === "string") return { isValid: true, parsed: value.trim() };
  if (value === undefined || value === null)
    return {
      isValid: false,
      parsed: "",
      messages: ["This value does not evaluate to type: string"],
    };
  return { isValid: true, parsed: value };
}

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Allows users to select a single option. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                unique: ["value"],
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default Option",
            controlType: "INPUT_TEXT",
            placeholderText: "GREEN",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: "value or Array of values",
                  example: `option1 | ['option1', 'option2']`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["selectionType"],
          },
          {
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter placeholder text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isFilterable",
            label: "Filterable",
            helpText: "Makes the dropdown list filterable",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Enables server side filtering of the data",
            propertyName: "serverSideFiltering",
            label: "Server Side Filtering",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
          {
            helpText: "Trigger an action on change of filterText",
            hidden: (props: DropdownWidgetProps) => !props.serverSideFiltering,
            dependencies: ["serverSideFiltering"],
            propertyName: "onFilterUpdate",
            label: "onFilterUpdate",
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
      isValid: `{{this.isRequired  ? !!this.selectedOption : true}}`,
      selectedOption: `{{  _.find(this.options, { value:  this.defaultValue }) }}`,
      selectedIndex: `{{ _.findIndex(this.options, { value: this.selectedOption.value } ) }}`,
      value: `{{  this.defaultValue }}`,
      selectedOptionLabel: `{{(()=>{const index = _.findIndex(this.options, { value: this.defaultValue }); return this.options[index]?.label; })()}}`,
      selectedOptionValue: `{{(()=>{const index = _.findIndex(this.options, { value: this.defaultValue }); return this.options[index]?.value; })()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      defaultValue: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      defaultValue: undefined,
    };
  }

  getPageView() {
    const options = _.isArray(this.props.options) ? this.props.options : [];

    const selectedIndex = _.findIndex(this.props.options, {
      value: this.props.defaultValue,
    });

    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return (
      <DropDownComponent
        disabled={this.props.isDisabled}
        height={componentHeight}
        isFilterable={this.props.isFilterable}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        onFilterChange={this.onFilterChange}
        onOptionSelected={this.onOptionSelected}
        options={options}
        placeholder={this.props.placeholderText}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        serverSideFiltering={this.props.serverSideFiltering}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    let isChanged = true;

    // Check if the value has changed. If no option
    // selected till now, there is a change
    if (this.props.selectedOptionValue) {
      isChanged = !(this.props.selectedOptionValue === selectedOption.value);
    }

    if (isChanged) {
      this.props.updateWidgetMetaProperty(
        "defaultValue",
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
  };

  onFilterChange = (value: string) => {
    this.props.updateWidgetMetaProperty("filterText", value);

    super.executeAction({
      triggerPropertyName: "onFilterUpdate",
      dynamicString: this.props.onFilterUpdate,
      event: {
        type: EventType.ON_FILTER_UPDATE,
      },
    });
  };

  static getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export interface DropdownWidgetProps extends WidgetProps {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange?: string;
  defaultOptionValue?: string | string[];
  isRequired: boolean;
  isFilterable: boolean;
  defaultValue: string;
  selectedOptionLabel: string;
  serverSideFiltering: boolean;
  onFilterUpdate: string;
}

export default DropdownWidget;
