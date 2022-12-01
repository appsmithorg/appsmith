import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import SwitchComponent from "../component";

import { ValidationTypes } from "constants/WidgetValidation";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "widgets/constants";
import { Stylesheet } from "entities/AppTheming";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Label",
        children: [
          {
            propertyName: "label",
            label: "Text",
            controlType: "INPUT_TEXT",
            helpText: "Displays a label next to the widget",
            placeholderText: "Enable Option",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Right", value: LabelPosition.Right },
            ],
            defaultValue: LabelPosition.Left,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "alignWidget",
            helpText: "Sets the alignment of the widget",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            isBindProperty: true,
            isTriggerProperty: false,
            options: [
              {
                icon: "LEFT_ALIGN",
                value: AlignWidgetTypes.LEFT,
              },
              {
                icon: "RIGHT_ALIGN",
                value: AlignWidgetTypes.RIGHT,
              },
            ],
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultSwitchState",
            label: "Default State",
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
        ],
      },
      {
        sectionName: "Events",
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

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font Color",
            helpText: "Control the color of the label associated",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "labelTextSize",
            label: "Font Size",
            helpText: "Control the font size of the label associated",
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
            label: "Emphasis",
            helpText: "Control if the label should be bold or italics",
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
        sectionName: "Color",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the background color of the widget",
            label: "Accent Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      boxShadow: "none",
    };
  }

  getPageView() {
    return (
      <SwitchComponent
        accentColor={this.props.accentColor}
        alignWidget={this.props.alignWidget}
        isDisabled={this.props.isDisabled}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isLoading={this.props.isLoading}
        isSwitchedOn={!!this.props.isSwitchedOn}
        key={this.props.widgetId}
        label={this.props.label}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        onChange={this.onChange}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
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
      isDirty: false,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isSwitchedOn}}`,
    };
  }

  componentDidUpdate(prevProps: SwitchWidgetProps): void {
    if (
      this.props.defaultSwitchState !== prevProps.defaultSwitchState &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  onChange = (isSwitchedOn: boolean) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("isSwitchedOn", isSwitchedOn, {
      triggerPropertyName: "onChange",
      dynamicString: this.props.onChange,
      event: {
        type: EventType.ON_SWITCH_CHANGE,
      },
    });
  };
}

export interface SwitchWidgetProps extends WidgetProps {
  isSwitchedOn: boolean;
  defaultSwitchState: boolean;
  alignWidget: AlignWidgetTypes;
  labelPosition: LabelPosition;
  label: string;
  accentColor: string;
  isDirty: boolean;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}

export default SwitchWidget;
