import React, { ReactNode } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray, findIndex } from "lodash";
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
import { isString } from "../../utils/helpers";
import { CheckedStrategy } from "rc-tree-select/lib/utils/strategyUtil";

function defaultOptionValueValidation(
  value: unknown,
  props: TreeSelectWidgetProps,
): ValidationResponse {
  if (props.selectionType === "SINGLE_SELECT") {
    if (typeof value === "string")
      return { isValid: true, parsed: value.trim() };
    if (value === undefined || value === null)
      return {
        isValid: false,
        parsed: "",
        message: "This value does not evaluate to type: string",
      };
    return { isValid: true, parsed: value };
  } else {
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
}
class TreeSelectWidget extends BaseWidget<TreeSelectWidgetProps, WidgetState> {
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
            helpText: "Mode to Display options",
            propertyName: "mode",
            label: "Mode",
            hidden: (props: TreeSelectWidgetProps) => {
              return props.selectionType !== "MULTI_SELECT";
            },
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Display only parent items",
                value: "SHOW_PARENT",
              },
              {
                label: "Display only child items",
                value: "SHOW_CHILD",
              },
              {
                label: "Display all items",
                value: "SHOW_ALL",
              },
            ],
            isBindProperty: false,
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
            propertyName: "allowClear",
            label: "Clear all Selections",
            helpText: "Enables Icon to clear all Selections",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "expandAll",
            label: "Expand all by default",
            helpText: "Expand All nested options",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
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
            helpText: "Label Text",
            propertyName: "labelText",
            label: "Label Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter Label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
      selectedOptionLabel: `{{ this.selectionType === "SINGLE_SELECT" ? this.selectedLabel[0] : undefined }}`,
      selectedOptionLabels: `{{ this.selectionType === "MULTI_SELECT" ? this.selectedLabel : this.selectedLabel }}`,
      selectedOptionValues:
        '{{ this.selectionType === "MULTI_SELECT" ? this.selectedOptionValueArr.filter((o) => JSON.stringify(this.options).match(new RegExp(`"value":"${o}"`, "g")) ) : undefined}}',
      selectedOptionValue:
        '{{ this.selectionType === "SINGLE_SELECT" && JSON.stringify(this.options).match(new RegExp(`"value":"${this.selectedOption}"`), "g") ? this.selectedOption : undefined }}',
      isValid: `{{this.isRequired && this.selectionType === "SINGLE_SELECT" ? !!this.selectedOptionValue?.length : this.isRequired && this.selectionType === "MULTI_SELECT" ? this.selectedOptionValues?.length > 0 : true}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOption: "defaultOptionValue",
      selectedOptionValueArr: "defaultOptionValue",
      selectedLabel: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOption: undefined,
      selectedOptionValueArr: undefined,
      selectedLabel: [],
    };
  }

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    let values: string | string[] | undefined;
    if (this.props.selectionType === "SINGLE_SELECT") {
      values = isString(this.props.selectedOption)
        ? this.props.selectedOption
        : isArray(this.props.selectedOption)
        ? this.props.selectedOption[0]
        : undefined;
    } else {
      values = isArray(this.props.selectedOptionValueArr)
        ? this.props.selectedOptionValueArr
        : [];
    }
    const filteredValue = this.filterValues(values);

    return (
      <TreeSelectComponent
        allowClear={this.props.allowClear}
        disabled={this.props.isDisabled ?? false}
        dropdownStyle={{
          zIndex: Layers.dropdownModalWidget,
        }}
        expandAll={this.props.expandAll}
        labelText={this.props.labelText}
        loading={this.props.isLoading}
        mode={this.props.mode}
        onChange={this.onOptionChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        selectionType={this.props.selectionType}
        value={filteredValue}
      />
    );
  }

  onOptionChange = (value?: DefaultValueType, labelList?: ReactNode[]) => {
    this.props.updateWidgetMetaProperty("selectedLabel", labelList, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });

    if (this.props.selectionType === "SINGLE_SELECT") {
      this.props.updateWidgetMetaProperty("selectedOption", value, {
        triggerPropertyName: "onOptionChange",
        dynamicString: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
      return;
    }
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

  filterValues(values: string | string[] | undefined) {
    const options = this.flat(this.props.options as DropdownOption[]);

    if (isString(values)) {
      const index = findIndex(options, { value: values as string });
      return index > -1 ? values : undefined;
    }
    if (isArray(values)) {
      return values.filter((o) => {
        const index = findIndex(options, { value: o });
        return index > -1;
      });
    }
  }

  getWidgetType(): WidgetType {
    return "TREE_SELECT_WIDGET";
  }
}
export type SelectionType = "SINGLE_SELECT" | "MULTI_SELECT";

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
  options?: DropdownOption[];
  onOptionChange: string;
  defaultOptionValue: string | string[];
  isRequired: boolean;
  isLoading: boolean;
  allowClear: boolean;
  labelText?: string;
  selectedLabel: string[];
  selectedOption: string | string[];
  selectedOptionValue: string;
  selectedOptionValueArr: string[];
  selectedOptionValues: string[];
  selectedOptionLabel: string;
  selectedOptionLabels: string[];
  selectionType: SelectionType;
  expandAll: boolean;
  mode: CheckedStrategy;
}

export default TreeSelectWidget;
export const ProfiledTreeSelectWidget = Sentry.withProfiler(
  withMeta(TreeSelectWidget),
);
