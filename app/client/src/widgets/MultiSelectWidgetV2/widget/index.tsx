import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray, isString, isNumber } from "lodash";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import MultiSelectComponent from "../component";
import {
  DefaultValueType,
  LabelValueType,
} from "rc-select/lib/interface/generator";
import { Layers } from "constants/Layers";
import { MinimumPopupRows, GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export function defaultOptionValueValidation(
  value: unknown,
  props: MultiSelectWidgetProps,
  _: any,
): ValidationResponse {
  let isValid;
  let parsed;
  let message = "";

  /*
   * Function to check if the object has `label` and `value`
   */
  const hasLabelValue = (obj: any) => {
    return (
      _.isPlainObject(obj) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  /*
   * Function to check for duplicate values in array
   */
  const hasUniqueValues = (arr: Array<string>) => {
    const uniqueValues = new Set(arr);

    return uniqueValues.size === arr.length;
  };

  /*
   * When value is "['green', 'red']", "[{label: 'green', value: 'green'}]" and "green, red"
   */
  if (_.isString(value) && (value as string).trim() !== "") {
    try {
      /*
       * when value is "['green', 'red']", "[{label: 'green', value: 'green'}]"
       */
      value = JSON.parse(value as string);
    } catch (e) {
      /*
       * when value is "green, red", JSON.parse throws error
       */
      const splitByComma = (value as string).split(",") || [];

      value = splitByComma.map((s) => s.trim());
    }
  }

  if (_.isString(value) && (value as string).trim() === "") {
    isValid = true;
    parsed = [];
    message = "";
  } else if (Array.isArray(value)) {
    if (value.every((val) => _.isString(val) || _.isFinite(val))) {
      /*
       * When value is ["green", "red"]
       */
      if (hasUniqueValues(value as [])) {
        isValid = true;
        parsed = value;
        message = "";
      } else {
        isValid = false;
        parsed = [];
        message = "values must be unique. Duplicate values found";
      }
    } else if (value.every(hasLabelValue)) {
      /*
       * When value is [{label: "green", value: "red"}]
       */
      if (hasUniqueValues(value.map((val) => val.value) as [])) {
        isValid = true;
        parsed = value;
        message = "";
      } else {
        isValid = false;
        parsed = [];
        message = "path:value must be unique. Duplicate values found";
      }
    } else {
      /*
       * When value is [true, false], [undefined, undefined] etc.
       */
      isValid = false;
      parsed = [];
      message =
        "value should match: Array<string | number> | Array<{label: string, value: string | number}>";
    }
  } else {
    /*
     * When value is undefined, null, {} etc.
     */
    isValid = false;
    parsed = [];
    message =
      "value should match: Array<string | number> | Array<{label: string, value: string | number}>";
  }

  return {
    isValid,
    parsed,
    messages: [message],
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
                          requiredKey: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          requiredKey: true,
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
            helpText: "Selects the option(s) with value by default",
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
                  example: `['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
                  autocompleteDataType: AutocompleteDataType.ARRAY,
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
          {
            helpText:
              "Controls the visibility of select all option in dropdown.",
            propertyName: "allowSelectAll",
            label: "Allow Select All",
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
      selectedOptionLabels: `{{ this.selectedOptions ? this.selectedOptions.map((o) => _.isNil(o.label) ? o : o.label ) : [] }}`,
      selectedOptionValues: `{{ this.selectedOptions ? this.selectedOptions.map((o) =>  _.isNil(o.value) ? o : o.value  ) : [] }}`,
      isValid: `{{this.isRequired ? !!this.selectedOptionValues && this.selectedOptionValues.length > 0 : true}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptions: "defaultOptionValue",
      filterText: "",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptions: undefined,
      filterText: "",
    };
  }

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const dropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;
    const { componentWidth } = this.getComponentDimensions();
    const values: LabelValueType[] = this.props.selectedOptions
      ? this.props.selectedOptions.map((o) =>
          isString(o) || isNumber(o)
            ? { label: o, value: o }
            : { label: o.label, value: o.value },
        )
      : [];
    return (
      <MultiSelectComponent
        allowSelectAll={this.props.allowSelectAll}
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
        filterText={this.props.filterText}
        isFilterable={this.props.isFilterable}
        isValid={this.props.isValid}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        loading={this.props.isLoading}
        onChange={this.onOptionChange}
        onFilterChange={this.onFilterChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        serverSideFiltering={this.props.serverSideFiltering}
        value={values}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  onOptionChange = (value: DefaultValueType) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("selectedOptions", value, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
  };

  onFilterChange = (value: string) => {
    this.props.updateWidgetMetaProperty("filterText", value);

    if (this.props.onFilterUpdate && this.props.serverSideFiltering) {
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
    return "MULTI_SELECT_WIDGET_V2";
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
  selectedOptions: LabelValueType[];
  filterText: string;
  selectedOptionValues: string[];
  selectedOptionLabels: string[];
  serverSideFiltering: boolean;
  onFilterUpdate: string;
  allowSelectAll?: boolean;
  isFilterable: boolean;
}

export default MultiSelectWidget;
