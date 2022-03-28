import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import CheckboxComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { AlignWidget } from "widgets/constants";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "label",
            label: "Label",
            controlType: "INPUT_TEXT",
            helpText: "Displays a label next to the widget",
            placeholderText: "I agree to the T&C",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "defaultCheckedState",
            label: "Default Selected",
            helpText: "Sets the default checked state of the widget",
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
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
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
            propertyName: "alignWidget",
            helpText: "Sets the alignment of the widget",
            label: "Alignment",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Left",
                value: "LEFT",
              },
              {
                label: "Right",
                value: "RIGHT",
              },
            ],
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "Triggers an action when the check state is changed",
            propertyName: "onCheckChange",
            label: "onCheckChange",
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
      isChecked: "defaultCheckedState",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isChecked}}`,
      isValid: `{{ this.isRequired ? !!this.isChecked : true }}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isChecked: undefined,
    };
  }

  getPageView() {
    return (
      <CheckboxComponent
        alignWidget={this.props.alignWidget}
        isChecked={!!this.props.isChecked}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        isRequired={this.props.isRequired}
        key={this.props.widgetId}
        label={this.props.label}
        onCheckChange={this.onCheckChange}
        rowSpace={this.props.parentRowSpace}
        widgetId={this.props.widgetId}
      />
    );
  }

  onCheckChange = (isChecked: boolean) => {
    this.props.updateWidgetMetaProperty("isChecked", isChecked, {
      triggerPropertyName: "onCheckChange",
      dynamicString: this.props.onCheckChange,
      event: {
        type: EventType.ON_CHECK_CHANGE,
      },
    });
  };

  static getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps {
  label: string;
  defaultCheckedState: boolean;
  isChecked?: boolean;
  isDisabled?: boolean;
  onCheckChange?: string;
  isRequired?: boolean;
  alignWidget: AlignWidget;
}

export default CheckboxWidget;
