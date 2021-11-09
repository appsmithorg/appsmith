import React from "react";
import { compact } from "lodash";

import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { WidgetType } from "constants/WidgetConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

import CheckboxGroupComponent, { OptionProps } from "../component";
import { ButtonBorderRadiusTypes } from "components/propertyControls/ButtonBorderRadiusControl";
import { ButtonBorderRadius, ButtonBoxShadow } from "components/constants";

export function defaultSelectedValuesValidation(
  value: unknown,
): ValidationResponse {
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

class CheckboxGroupWidget extends BaseWidget<
  CheckboxGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Displays a list of unique checkbox options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                default: [],
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
            helpText: "Sets the values of the options checked by default",
            propertyName: "defaultSelectedValues",
            label: "Default Selected Values",
            placeholderText: '["apple", "orange"]',
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultSelectedValuesValidation,
                expected: {
                  type: "String or Array<string>",
                  example: `apple | ["apple", "orange"]`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
          {
            propertyName: "isInline",
            label: "Inline",
            controlType: "SWITCH",
            helpText: "Displays the checkboxes horizontally",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the check state is changed",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },

      {
        sectionName: "Style",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            options: [
              ButtonBorderRadiusTypes.SHARP,
              ButtonBorderRadiusTypes.ROUNDED,
              ButtonBorderRadiusTypes.CIRCLE,
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["SHARP", "ROUNDED", "CIRCLE"],
              },
            },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "NONE",
                  "VARIANT1",
                  "VARIANT2",
                  "VARIANT3",
                  "VARIANT4",
                  "VARIANT5",
                ],
              },
            },
          },
          {
            propertyName: "boxShadowColor",
            helpText: "Sets the shadow color of the widget",
            label: "Shadow Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
    };
  }

  componentDidUpdate(prevProps: CheckboxGroupWidgetProps) {
    if (
      Array.isArray(prevProps.options) &&
      Array.isArray(this.props.options) &&
      this.props.options.length !== prevProps.options.length
    ) {
      const prevOptions = compact(prevProps.options).map(
        (prevOption) => prevOption.value,
      );
      const options = compact(this.props.options).map((option) => option.value);

      const diffOptions = prevOptions.filter(
        (prevOption) => !options.includes(prevOption),
      );

      const selectedValues = this.props.selectedValues.filter(
        (selectedValue: string) => !diffOptions.includes(selectedValue),
      );

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECK_CHANGE,
        },
      });
    }
  }

  getPageView() {
    return (
      <CheckboxGroupComponent
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        isDisabled={this.props.isDisabled}
        isInline={this.props.isInline}
        isRequired={this.props.isRequired}
        isValid={this.props.isValid}
        key={this.props.widgetId}
        onChange={this.handleCheckboxChange}
        options={compact(this.props.options)}
        rowSpace={this.props.parentRowSpace}
        selectedValues={this.props.selectedValues}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "CHECKBOX_GROUP_WIDGET";
  }

  private handleCheckboxChange = (value: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      let { selectedValues } = this.props;
      const isChecked = (event.target as HTMLInputElement).checked;
      if (isChecked) {
        selectedValues = [...selectedValues, value];
      } else {
        selectedValues = selectedValues.filter(
          (item: string) => item !== value,
        );
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };
}

export interface CheckboxGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  isInline: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  onCheckChanged?: string;
  backgroundColor: string;
  borderRadius: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
}

export default CheckboxGroupWidget;
