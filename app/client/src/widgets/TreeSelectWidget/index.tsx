import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray } from "lodash";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "../MetaHOC";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import TreeSelectComponent from "components/designSystems/appsmith/TreeSelectComponent";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import { Layers } from "constants/Layers";

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
class TreeSelectWidget extends BaseWidget<TreeSelectWidgetProps, WidgetState> {
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
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        default: "",
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        default: "",
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
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: "value or Array of values",
                  example: `value1 | ['value1', 'value2']`,
                },
              },
            },
          },
          {
            helpText: "Input Place Holder",
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
      selectedIndexArr: `{{ this.selectedOptionValues.map(o => _.findIndex(this.options, { value: o })) }}`,
      selectedOptionLabels: `{{ this.selectedOptionValueArr.map((o) => { const index = _.findIndex(this.options, { value: o }); return this.options[index]?.label ?? this.options[index]?.value; })  }}`,
      selectedOptionValues: `{{ this.selectedOptionValueArr.filter((o) => { const index = _.findIndex(this.flat(), { value: o });  return index > -1; })  }}`,
      isValid: `{{this.isRequired ? !!this.selectedIndexArr && this.selectedIndexArr.length > 0 : true}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptionValueArr: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptionValueArr: undefined,
    };
  }

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const values: string[] = isArray(this.props.selectedOptionValueArr)
      ? this.props.selectedOptionValueArr
      : [];

    console.log(values, "valuessss");
    return (
      <TreeSelectComponent
        disabled={this.props.isDisabled ?? false}
        dropdownStyle={{
          zIndex: Layers.dropdownModalWidget,
        }}
        loading={this.props.isLoading}
        onChange={this.onOptionChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        value={values}
      />
    );
  }

  onOptionChange = (value: DefaultValueType) => {
    console.log(value);
    this.props.updateWidgetMetaProperty("selectedOptionValueArr", value, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  flat(array: DropdownOption[]) {
    let result: { value: string }[] = [];
    array.forEach((a) => {
      result.push({ value: a.value });
      if (Array.isArray(a.children)) {
        result = result.concat(this.flat(a.children));
      }
    });
    return result;
  }

  getWidgetType(): WidgetType {
    return "TREE_SELECT_WIDGET";
  }
}

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
  children?: DropdownOption[];
}

export interface TreeSelectWidgetProps extends WidgetProps, WithMeta {
  placeholderText?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange: string;
  defaultOptionValue: string | string[];
  isRequired: boolean;
  isLoading: boolean;
  selectedOptionValueArr: string[];
  selectedOptionValues: string[];
  selectedOptionLabels: string[];
}

export default TreeSelectWidget;
export const ProfiledTreeSelectWidget = Sentry.withProfiler(
  withMeta(TreeSelectWidget),
);
