import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  isArray,
  isEqual,
  isFinite,
  isString,
  isNumber,
  LoDashStatic,
  xorWith,
} from "lodash";
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
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export function defaultOptionValueValidation(
  value: unknown,
  props: MultiSelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  let isValid = false;
  let parsed: any[] = [];
  let message = "";

  const DEFAULT_ERROR_MESSAGE =
    "value should match: Array<string | number> | Array<{label: string, value: string | number}>";

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
  if (_.isString(value) && value.trim() !== "") {
    try {
      /*
       * when value is "['green', 'red']", "[{label: 'green', value: 'green'}]"
       */
      const parsedValue = JSON.parse(value);
      // Only parse value if resulting value is an array or string
      if (Array.isArray(parsedValue) || _.isString(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {
      /*
       * when value is "green, red", JSON.parse throws error
       */
      const splitByComma = (value as string).split(",") || [];

      value = splitByComma.map((s) => s.trim());
    }
  }

  /*
   * When value is "['green', 'red']", "[{label: 'green', value: 'green'}]" and "green, red"
   */
  if (Array.isArray(value)) {
    if (value.every((val) => _.isString(val) || _.isFinite(val))) {
      /*
       * When value is ["green", "red"]
       */
      if (hasUniqueValues(value)) {
        isValid = true;
        parsed = value;
      } else {
        parsed = [];
        message = "values must be unique. Duplicate values found";
      }
    } else if (value.every(hasLabelValue)) {
      /*
       * When value is [{label: "green", value: "red"}]
       */
      if (hasUniqueValues(value.map((val) => val.value))) {
        isValid = true;
        parsed = value;
      } else {
        parsed = [];
        message = "path:value must be unique. Duplicate values found";
      }
    } else {
      /*
       * When value is [true, false], [undefined, undefined] etc.
       */
      parsed = [];
      message = DEFAULT_ERROR_MESSAGE;
    }

    return {
      isValid,
      parsed,
      messages: [message],
    };
  }

  /*
   * When value is an empty string
   */
  if (_.isString(value) && value.trim() === "") {
    isValid = true;
    parsed = [];
  } else if (_.isNumber(value) || _.isString(value)) {
    /*
     * When value is a number or just a single string e.g "Blue"
     */
    isValid = true;
    parsed = [value];
  } else {
    /*
     * When value is undefined, null, {} etc.
     */
    parsed = [];
    message = DEFAULT_ERROR_MESSAGE;
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
                  example: ` "option1, option2" | ['option1', 'option2'] | [{ "label": "label1", "value": "value1" }]`,
                  autocompleteDataType: AutocompleteDataType.ARRAY,
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
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
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "labelText",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "DROP_DOWN",
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
              { label: "Auto", value: LabelPosition.Auto },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            options: [
              {
                icon: "LEFT_ALIGN",
                value: Alignment.LEFT,
              },
              {
                icon: "RIGHT_ALIGN",
                value: Alignment.RIGHT,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: MultiSelectWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
            propertyName: "labelWidth",
            label: "Width (in columns)",
            controlType: "NUMERIC_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            min: 0,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                natural: true,
              },
            },
            hidden: (props: MultiSelectWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
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
            defaultValue: "0.875rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "2xl",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3xl",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "accentColor",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            invisible: true,
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
      value: `{{this.selectedOptionValues}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedOptions: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedOptions: undefined,
      filterText: "",
      isDirty: false,
    };
  }

  componentDidUpdate(prevProps: MultiSelectWidgetProps): void {
    // Check if defaultOptionValue is string
    let isStringArray = false;
    if (
      this.props.defaultOptionValue.some(
        (value: any) => isString(value) || isFinite(value),
      )
    ) {
      isStringArray = true;
    }

    const hasChanges = isStringArray
      ? xorWith(
          this.props.defaultOptionValue as string[],
          prevProps.defaultOptionValue as string[],
          isEqual,
        ).length > 0
      : xorWith(
          this.props.defaultOptionValue as OptionValue[],
          prevProps.defaultOptionValue as OptionValue[],
          isEqual,
        ).length > 0;

    if (hasChanges && this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const minDropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;
    const { componentWidth } = this.getComponentDimensions();
    const values: LabelValueType[] = this.props.selectedOptions
      ? this.props.selectedOptions.map((o) =>
          isString(o) || isNumber(o) ? { value: o } : { value: o.value },
        )
      : [];
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    return (
      <MultiSelectComponent
        accentColor={this.props.accentColor}
        allowSelectAll={this.props.allowSelectAll}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
            1
          )
        }
        disabled={this.props.isDisabled ?? false}
        dropDownWidth={minDropDownWidth}
        dropdownStyle={{
          zIndex: Layers.dropdownModalWidget,
        }}
        filterText={this.props.filterText}
        isFilterable={this.props.isFilterable}
        isValid={!isInvalid}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        loading={this.props.isLoading}
        onChange={this.onOptionChange}
        onFilterChange={this.onFilterChange}
        options={options}
        placeholder={this.props.placeholderText as string}
        renderMode={this.props.renderMode}
        serverSideFiltering={this.props.serverSideFiltering}
        value={values}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  onOptionChange = (value: DefaultValueType) => {
    this.props.updateWidgetMetaProperty("selectedOptions", value, {
      triggerPropertyName: "onOptionChange",
      dynamicString: this.props.onOptionChange,
      event: {
        type: EventType.ON_OPTION_CHANGE,
      },
    });
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
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
export interface OptionValue {
  label: string;
  value: string;
}
export interface DropdownOption extends OptionValue {
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
  defaultOptionValue: string[] | OptionValue[];
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
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  isDirty?: boolean;
}

export default MultiSelectWidget;
