import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { RateSize } from "../constants";
import RateComponent from "../component";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class RateWidget extends BaseWidget<RateWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "maxCount",
            helpText: "Sets the maximum limit of the number of stars",
            label: "Max count",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter max count",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.RATE_MAX_COUNT,
          },
          {
            propertyName: "defaultRate",
            helpText: "Sets the default number of stars",
            label: "Default rate",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter default value",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.RATE_DEFAULT_RATE,
          },
          {
            propertyName: "activeColor",
            label: "Active color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "inactiveColor",
            label: "Inactive color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "tooltips",
            helpText: "Sets the tooltip contents of stars",
            label: "Tooltips",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter tooltips array",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.ARRAY_OPTIONAL,
          },
          {
            propertyName: "size",
            label: "Size",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Small",
                value: "SMALL",
              },
              {
                label: "Medium",
                value: "MEDIUM",
              },
              {
                label: "Large",
                value: "LARGE",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isAllowHalf",
            helpText: "Controls if user can submit half stars",
            label: "Allow half stars",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the rate is changed",
            propertyName: "onRateChanged",
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      rate: "defaultRate",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{ this.rate }}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      rate: undefined,
    };
  }

  valueChangedHandler = (value: number) => {
    this.props.updateWidgetMetaProperty("rate", value, {
      triggerPropertyName: "onRateChanged",
      dynamicString: this.props.onRateChanged,
      event: {
        type: EventType.ON_RATE_CHANGED,
      },
    });
  };

  getPageView() {
    return (
      (this.props.rate || this.props.rate === 0) && (
        <RateComponent
          key={this.props.widgetId}
          onValueChanged={this.valueChangedHandler}
          readonly={this.props.isDisabled}
          value={this.props.rate}
          {...this.props}
        />
      )
    );
  }

  static getWidgetType(): WidgetType {
    return "RATE_WIDGET";
  }
}

export interface RateWidgetProps extends WidgetProps {
  maxCount: number;
  size: RateSize;
  defaultRate?: number;
  rate?: number;
  activeColor?: string;
  inactiveColor?: string;
  isAllowHalf?: boolean;
  onRateChanged?: string;
  tooltips?: Array<string>;
}

export default RateWidget;
