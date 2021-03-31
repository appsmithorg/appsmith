import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
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
        isSwitchedOn={!!this.props.isSwitchedOn}
        alignWidget={this.props.alignWidget ? this.props.alignWidget : "LEFT"}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        onChange={this.onChange}
        isLoading={this.props.isLoading}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      defaultSwitchState: VALIDATION_TYPES.BOOLEAN,
    };
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
