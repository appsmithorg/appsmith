import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import CheckboxGroupComponent, {
  OptionProps,
} from "components/designSystems/appsmith/CheckboxGroupComponent";

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
            helpText:
              "Displays a list of options for a user to select. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "label",
                        isUnique: true,
                        type: ValidationTypes.TEXT,
                      },
                      {
                        name: "value",
                        isUnique: true,
                        type: ValidationTypes.TEXT,
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
            helpText: "Selects values of the options checked by default",
            propertyName: "defaultSelectedValues",
            label: "Default Selected Values",
            placeholderText: "Enter option values",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.TEXT,
                },
              },
            },
          },
          {
            propertyName: "isInline",
            label: "Inline",
            controlType: "SWITCH",
            helpText:
              "Whether the checkbox buttons are to be displayed inline horizontally",
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
            propertyName: "onCheckChanged",
            label: "onCheckChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
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

  getPageView() {
    return (
      <CheckboxGroupComponent
        isDisabled={this.props.isDisabled}
        isInline={this.props.isInline}
        isRequired={this.props.isRequired}
        isValid={this.props.isValid}
        key={this.props.widgetId}
        onChange={this.handleCheckboxChange}
        options={this.props.options}
        selectedValues={this.props.selectedValues}
        widgetId={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
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
        triggerPropertyName: "onCheckChange",
        dynamicString: this.props.onCheckChanged,
        event: {
          type: EventType.ON_CHECK_CHANGE,
        },
      });
    };
  };
}

export interface CheckboxGroupWidgetProps extends WidgetProps, WithMeta {
  options: OptionProps[];
  isInline: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  onCheckChanged?: string;
}

export default CheckboxGroupWidget;
export const ProfiledCheckboxGroupWidget = Sentry.withProfiler(
  withMeta(CheckboxGroupWidget),
);
