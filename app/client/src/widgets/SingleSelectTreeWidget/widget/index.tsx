import React, { ReactNode } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TextSize, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray, findIndex } from "lodash";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import { Layers } from "constants/Layers";
import { isString } from "../../../utils/helpers";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { GRID_DENSITY_MIGRATION_V1, MinimumPopupRows } from "widgets/constants";
import SingleSelectTreeComponent from "../component";

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
class SingleSelectTreeWidget extends BaseWidget<
  SingleSelectTreeWidgetProps,
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
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: false,
            validation: {
              type: ValidationTypes.NESTED_OBJECT_ARRAY,
              params: {
                unique: ["value"],
                default: [],
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
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
                        },
                      },
                      {
                        name: "children",
                        type: ValidationTypes.ARRAY,
                        required: false,
                        params: {
                          children: {
                            type: ValidationTypes.OBJECT,
                            params: {
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
                                  },
                                },
                              ],
                            },
                          },
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
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: "value",
                  example: `value1`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
          {
            helpText: "Sets a Label Text",
            propertyName: "labelText",
            label: "Label Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter Label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets a Placeholder Text",
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
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
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
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Label Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Label Text Size",
            controlType: "DROP_DOWN",
            defaultValue: "PARAGRAPH",
            options: [
              {
                label: "Heading 1",
                value: "HEADING1",
                subText: "24px",
                icon: "HEADING_ONE",
              },
              {
                label: "Heading 2",
                value: "HEADING2",
                subText: "18px",
                icon: "HEADING_TWO",
              },
              {
                label: "Heading 3",
                value: "HEADING3",
                subText: "16px",
                icon: "HEADING_THREE",
              },
              {
                label: "Paragraph",
                value: "PARAGRAPH",
                subText: "14px",
                icon: "PARAGRAPH",
              },
              {
                label: "Paragraph 2",
                value: "PARAGRAPH2",
                subText: "12px",
                icon: "PARAGRAPH_TWO",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "labelStyle",
            label: "Label Font Style",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Events",
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
      selectedOptionLabel: `{{  this.selectedLabel[0] }}`,
      selectedOptionValue:
        '{{  JSON.stringify(this.options).match(new RegExp(`"value":${Number.isFinite(this.selectedOption) ? this.selectedOption : `"${this.selectedOption}"` }`), "g") ? this.selectedOption : undefined  }}',
      isValid: `{{this.isRequired  ? !!this.selectedOptionValue || this.selectedOptionValue === 0 : true}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOption: "defaultOptionValue",
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
    const options =
      isArray(this.props.options) &&
      !this.props.__evaluation__?.errors.options.length
        ? this.props.options
        : [];
    const value: string | number | undefined =
      isString(this.props.selectedOption) ||
      Number.isFinite(this.props.selectedOption)
        ? this.props.selectedOption
        : undefined;

    const filteredValue = this.filterValue(value);
    const dropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;
    const { componentWidth } = this.getComponentDimensions();
    return (
      <SingleSelectTreeComponent
        allowClear={this.props.allowClear}
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
            1
          )
        }
        disabled={this.props.isDisabled ?? false}
        dropDownWidth={dropDownWidth}
        dropdownStyle={{
          zIndex: Layers.dropdownModalWidget,
        }}
        expandAll={this.props.expandAll}
        isValid={this.props.isValid}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        loading={this.props.isLoading}
        onChange={this.onOptionChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        value={filteredValue}
        width={componentWidth}
      />
    );
  }

  onOptionChange = (value?: DefaultValueType, labelList?: ReactNode[]) => {
    this.props.updateWidgetMetaProperty("selectedOption", value);
    this.props.updateWidgetMetaProperty("selectedLabel", labelList, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  flat(array: DropdownOption[]) {
    let result: { value: string | number }[] = [];
    array.forEach((a) => {
      result.push({ value: a.value });
      if (Array.isArray(a.children)) {
        result = result.concat(this.flat(a.children));
      }
    });
    return result;
  }

  filterValue(value: string | number | undefined) {
    const options = this.props.options ? this.flat(this.props.options) : [];

    if (isString(value) || Number.isFinite(value)) {
      const index = findIndex(options, { value: value as string });
      return index > -1 ? value : undefined;
    }
  }

  static getWidgetType(): WidgetType {
    return "SINGLE_SELECT_TREE_WIDGET";
  }
}

export interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: DropdownOption[];
}

export interface SingleSelectTreeWidgetProps extends WidgetProps {
  placeholderText?: string;
  selectedIndex?: number;
  options?: DropdownOption[];
  onOptionChange: string;
  defaultOptionValue: string;
  isRequired: boolean;
  isLoading: boolean;
  allowClear: boolean;
  labelText?: string;
  selectedLabel: string[];
  selectedOption: string | number;
  selectedOptionValue: string;
  selectedOptionLabel: string;
  expandAll: boolean;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
}

export default SingleSelectTreeWidget;
