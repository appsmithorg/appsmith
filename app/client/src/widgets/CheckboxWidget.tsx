import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import CheckboxComponent from "components/designSystems/blueprint/CheckboxComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { AlignWidget } from "./SwitchWidget";

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
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
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
          {
            propertyName: "defaultCheckedState",
            label: "Default Selected",
            helpText:
              "Checks / un-checks the checkbox by default. Changes to the default selection update the widget state",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
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
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      defaultCheckedState: VALIDATION_TYPES.BOOLEAN,
      // onCheckChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isChecked: "defaultCheckedState",
      alignWidget: "LEFT",
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
        isRequired={this.props.isRequired}
        isChecked={!!this.props.isChecked}
        alignWidget={this.props.alignWidget}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        onCheckChange={this.onCheckChange}
        isLoading={this.props.isLoading}
      />
    );
  }

  onCheckChange = (isChecked: boolean) => {
    this.props.updateWidgetMetaProperty("isChecked", isChecked, {
      dynamicString: this.props.onCheckChange,
      event: {
        type: EventType.ON_CHECK_CHANGE,
      },
    });
  };

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps, WithMeta {
  label: string;
  defaultCheckedState: boolean;
  isChecked?: boolean;
  isDisabled?: boolean;
  onCheckChange?: string;
  isRequired?: boolean;
  alignWidget: AlignWidget;
}

export default CheckboxWidget;
export const ProfiledCheckboxWidget = Sentry.withProfiler(
  withMeta(CheckboxWidget),
);
