import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import SelectComponent from "../component";
import { DropdownOption } from "../constants";
import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { MinimumPopupRows, GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import {
  findIndex,
  isArray,
  isEqual,
  isNumber,
  isString,
  LoDashStatic,
} from "lodash";

export function defaultOptionValueValidation(
  value: unknown,
  props: SelectWidgetProps,
  _: LoDashStatic,
): ValidationResponse {
  let isValid;
  let parsed;
  let message = "";

  /*
   * Function to check if the object has `label` and `value`
   */
  const hasLabelValue = (obj: any) => {
    return (
      _.isPlainObject(value) &&
      obj.hasOwnProperty("label") &&
      obj.hasOwnProperty("value") &&
      _.isString(obj.label) &&
      (_.isString(obj.value) || _.isFinite(obj.value))
    );
  };

  /*
   * When value is "{label: 'green', value: 'green'}"
   */
  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);
      if (_.isObject(parsedValue)) {
        value = parsedValue;
      }
    } catch (e) {}
  }

  if (_.isString(value) || _.isFinite(value) || hasLabelValue(value)) {
    /*
     * When value is "", "green", 444, {label: "green", value: "green"}
     */
    isValid = true;
    parsed = value;
  } else {
    isValid = false;
    parsed = {};
    message =
      'value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }';
  }

  return {
    isValid,
    parsed,
    messages: [message],
  };
}

class SelectWidget extends BaseWidget<SelectWidgetProps, WidgetState> {
  constructor(props: SelectWidgetProps) {
    super(props);
  }
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
            placeholderText: '[{ "label": "label1", "value": "value1" }]',
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
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default Value",
            controlType: "INPUT_TEXT",
            placeholderText: '{ "label": "label1", "value": "value1" }',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: 'value1 or { "label": "label1", "value": "value1" }',
                  example: `value1 | { "label": "label1", "value": "value1" }`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
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
            hidden: (props: SelectWidgetProps) => !props.serverSideFiltering,
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
            hidden: (props: SelectWidgetProps) =>
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
            hidden: (props: SelectWidgetProps) =>
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
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
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
            propertyName: "accentColor",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            invisible: true,
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      defaultValue: "defaultOptionValue",
      value: "defaultOptionValue",
      label: "defaultOptionValue",
      filterText: "",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
      label: undefined,
      filterText: "",
      isDirty: false,
    };
  }

  static getDerivedPropertiesMap() {
    return {
      isValid: `{{this.isRequired  ? !!this.selectedOptionValue || this.selectedOptionValue === 0 : true}}`,
      selectedOptionLabel: `{{(()=>{const label = _.isPlainObject(this.label) ? this.label?.label : this.label; return label; })()}}`,
      selectedOptionValue: `{{(()=>{const value = _.isPlainObject(this.value) ? this.value?.value : this.value; return value; })()}}`,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this.changeSelectedOption();
  }

  componentDidUpdate(prevProps: SelectWidgetProps): void {
    // Reset isDirty to false if defaultOptionValue changes
    if (
      !isEqual(this.props.defaultOptionValue, prevProps.defaultOptionValue) &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  isStringOrNumber = (value: any): value is string | number =>
    isString(value) || isNumber(value);

  getPageView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const dropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;

    const selectedIndex = findIndex(this.props.options, {
      value: this.props.selectedOptionValue,
    });
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return (
      <SelectComponent
        accentColor={this.props.accentColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={
          !(
            (this.props.bottomRow - this.props.topRow) /
              GRID_DENSITY_MIGRATION_V1 >
            1
          )
        }
        disabled={this.props.isDisabled}
        dropDownWidth={dropDownWidth}
        filterText={this.props.filterText}
        hasError={isInvalid}
        height={componentHeight}
        isFilterable={this.props.isFilterable}
        isLoading={this.props.isLoading}
        isValid={this.props.isValid}
        label={this.props.selectedOptionLabel}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        onFilterChange={this.onFilterChange}
        onOptionSelected={this.onOptionSelected}
        options={options}
        placeholder={this.props.placeholderText}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        serverSideFiltering={this.props.serverSideFiltering}
        value={this.props.selectedOptionValue}
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
      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty("label", selectedOption.label ?? "");

      this.props.updateWidgetMetaProperty("value", selectedOption.value ?? "", {
        triggerPropertyName: "onOptionChange",
        dynamicString: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }
    }
  };

  changeSelectedOption = () => {
    const label = this.isStringOrNumber(this.props.label)
      ? this.props.label
      : this.props.label?.label;
    const value = this.isStringOrNumber(this.props.value)
      ? this.props.value
      : this.props.value?.value;
    this.props.updateWidgetMetaProperty("value", value);
    this.props.updateWidgetMetaProperty("label", label);
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
    return "SELECT_WIDGET";
  }
}

export interface SelectWidgetProps extends WidgetProps {
  placeholderText?: string;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  selectedIndex?: number;
  options?: DropdownOption[];
  onOptionChange?: string;
  defaultOptionValue?: any;
  value?: any;
  label?: any;
  isRequired: boolean;
  isFilterable: boolean;
  defaultValue: string | { value: string; label: string };
  selectedOptionLabel: string;
  serverSideFiltering: boolean;
  onFilterUpdate: string;
  isDirty?: boolean;
  filterText: string;
}

export default SelectWidget;
