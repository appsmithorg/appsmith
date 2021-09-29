import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray } from "lodash";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";

import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import MultiSelectComponent from "../component";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import { Layers } from "constants/Layers";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

function defaultOptionValueValidation(value: unknown): ValidationResponse {
  let values: string[] = [];
  if (typeof value === "string") {
    try {
      values = JSON.parse(value);
      if (!Array.isArray(values)) {
        throw new Error();
      }
    } catch {
      values = value.length ? value.split(",") : [];
      if (values.length > 0) {
        values = values.map((_v: string) => _v.trim());
      }
    }
  }
  if (Array.isArray(value)) {
    values = Array.from(new Set(value));
  }

  return {
    isValid: true,
    parsed: values,
  };
}

class MultiSelectWidget extends BaseWidget<
  MultiSelectWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Allows users to select multiple options. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: false,
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
            label: "Default Value",
            controlType: "INPUT_TEXT",
            placeholderText: "[GREEN]",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: "Array of values",
                  example: `['option1', 'option2']`,
                  autocompleteDataType: AutocompleteDataType.ARRAY,
                },
              },
            },
          },
          {
            helpText: "Sets a Placeholder text",
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Search",
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
            hidden: (props: MultiSelectWidgetProps) =>
              !props.serverSideFiltering,
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
      selectedIndexArr: `{{ this.selectedOptionValues.map(o => _.findIndex(this.options, { value: o })) }}`,
      selectedOptionLabels: `{{ this.selectedOptionValueArr.map((o) => { const index = _.findIndex(this.options, { value: o }); return this.options[index]?.label ?? this.options[index]?.value; })  }}`,
      selectedOptionValues: `{{ this.selectedOptionValueArr.filter((o) => { const index = _.findIndex(this.options, { value: o });  return index > -1; })  }}`,
      isValid: `{{this.isRequired ? !!this.selectedIndexArr && this.selectedIndexArr.length > 0 : true}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValueArr: "defaultOptionValue",
      filterText: "",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValueArr: undefined,
      filterText: "",
    };
  }

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const values: string[] = isArray(this.props.selectedOptionValues)
      ? this.props.selectedOptionValues
      : [];
    return (
      <MultiSelectComponent
        disabled={this.props.isDisabled ?? false}
        dropdownStyle={{
          zIndex: Layers.dropdownModalWidget,
        }}
        loading={this.props.isLoading}
        onChange={this.onOptionChange}
        onFilterChange={this.onFilterChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        serverSideFiltering={this.props.serverSideFiltering}
        value={values}
      />
    );
  }

  onOptionChange = (value: DefaultValueType) => {
    this.props.updateWidgetMetaProperty("selectedOptionValueArr", value, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });

    // Empty filter after Selection
    this.onFilterChange("");
  };

  onFilterChange = (value: string) => {
    this.props.updateWidgetMetaProperty("filterText", value);

    if (this.props.onFilterUpdate) {
      super.executeAction({
        triggerPropertyName: "onFilterUpdate",
        dynamicString: this.props.onFilterUpdate,
        event: {
          type: EventType.ON_FILTER_UPDATE,
        },
      });
    }
  };

  static getWidgetType(): WidgetType {
    return "MULTI_SELECT_WIDGET";
  }
}

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface MultiSelectWidgetProps extends WidgetProps {
  placeholderText?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange: string;
  onFilterChange: string;
  defaultOptionValue: string | string[];
  isRequired: boolean;
  isLoading: boolean;
  selectedOptionValueArr: string[];
  filterText: string;
  selectedOptionValues: string[];
  selectedOptionLabels: string[];
  serverSideFiltering: boolean;
  onFilterUpdate: string;
}

export default MultiSelectWidget;
