import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { ValidationTypes } from "constants/WidgetValidation";
import { SwitchComponent } from "components/designSystems/blueprint/SwitchComponent";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
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
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "alignWidget",
            helpText: "Sets the alignment of the widget",
            label: "Alignment",
            controlType: "DROP_DOWN",
            isBindProperty: true,
            isTriggerProperty: false,
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
          },
          {
            propertyName: "defaultSwitchState",
            label: "Default Selected",
            helpText:
              "On / Off the Switch by default. Changes to the default selection update the widget state",
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
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the switch state is changed",
            propertyName: "onChange",
            label: "onChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  getPageView() {
    return (
      <SwitchComponent
        alignWidget={this.props.alignWidget ? this.props.alignWidget : "LEFT"}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        isSwitchedOn={!!this.props.isSwitchedOn}
        key={this.props.widgetId}
        label={this.props.label}
        onChange={this.onChange}
        widgetId={this.props.widgetId}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isSwitchedOn: "defaultSwitchState",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isSwitchedOn: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isSwitchedOn}}`,
    };
  }

  onChange = (isSwitchedOn: boolean) => {
    this.props.updateWidgetMetaProperty("isSwitchedOn", isSwitchedOn, {
      triggerPropertyName: "onChange",
      dynamicString: this.props.onChange,
      event: {
        type: EventType.ON_SWITCH_CHANGE,
      },
    });
  };
}

export type AlignWidget = "LEFT" | "RIGHT";

export interface SwitchWidgetProps extends WidgetProps, WithMeta {
  isSwitchedOn: boolean;
  defaultSwitchState: boolean;
  alignWidget: AlignWidget;
  label: string;
}

export default SwitchWidget;
export const ProfiledSwitchWidget = Sentry.withProfiler(withMeta(SwitchWidget));
