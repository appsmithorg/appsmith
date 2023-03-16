import type { WidgetType } from "constants/WidgetConstants";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import RateComponent from "../component";
import type { RateSize } from "../constants";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { Stylesheet } from "entities/AppTheming";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { getResponsiveLayoutConfig } from "utils/layoutPropertiesUtils";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";

function validateDefaultRate(value: unknown, props: any, _: any) {
  try {
    let parsed = value;
    let isValid = false;

    if (_.isString(value as string)) {
      if (/^\d+\.?\d*$/.test(value as string)) {
        parsed = Number(value);
        isValid = true;
      } else {
        if (value === "") {
          return {
            isValid: true,
            parsed: 0,
          };
        }

        return {
          isValid: false,
          parsed: 0,
          messages: [
            {
              name: "TypeError",
              message: `Value must be a number`,
            },
          ],
        };
      }
    }

    if (Number.isFinite(parsed)) {
      isValid = true;
    }

    // default rate must be less than max count
    if (!_.isNaN(props.maxCount) && Number(value) > Number(props.maxCount)) {
      return {
        isValid: false,
        parsed,
        messages: [
          {
            name: "RangeError",
            message: `This value must be less than or equal to max count`,
          },
        ],
      };
    }

    // default rate can be a decimal only if Allow half property is true
    if (!props.isAllowHalf && !Number.isInteger(parsed)) {
      return {
        isValid: false,
        parsed,
        messages: [
          {
            name: "ValidationError",
            message: `This value can be a decimal only if 'Allow half' is true`,
          },
        ],
      };
    }

    return { isValid, parsed };
  } catch (e) {
    return {
      isValid: false,
      parsed: value,
      messages: [
        {
          name: "ValidationError",
          message: `Could not validate `,
        },
      ],
    };
  }
}

class RateWidget extends BaseWidget<RateWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "maxCount",
            helpText: "Sets the maximum allowed rating",
            label: "Max Rating",
            controlType: "INPUT_TEXT",
            placeholderText: "5",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { natural: true },
            },
          },
          {
            propertyName: "defaultRate",
            helpText: "Sets the default rating",
            label: "Default Rating",
            controlType: "INPUT_TEXT",
            placeholderText: "2.5",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: validateDefaultRate,
                expected: {
                  type: "number",
                  example: 5,
                  autocompleteDataType: AutocompleteDataType.NUMBER,
                },
              },
            },
            dependencies: ["maxCount", "isAllowHalf"],
          },
          {
            propertyName: "tooltips",
            helpText: "Sets the tooltip contents of stars",
            label: "Tooltips",
            controlType: "INPUT_TEXT",
            placeholderText: '["Bad", "Neutral", "Good"]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: { children: { type: ValidationTypes.TEXT } },
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isAllowHalf",
            helpText: "Controls if user can submit half stars",
            label: "Allow Half Stars",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isReadOnly",
            helpText: "Makes the widget read only",
            label: "Read only",
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
        ],
      },
      ...getResponsiveLayoutConfig(this.getWidgetType()),
      {
        sectionName: "Events",
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

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "size",
            label: "Star Size",
            helpText: "Controls the size of the stars in the widget",
            controlType: "ICON_TABS",
            fullWidth: true,
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
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "activeColor",
            label: "Active Color",
            helpText: "Color of the selected stars",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "inactiveColor",
            label: "Inactive Color",
            helpText: "Color of the unselected stars",
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

  static getStylesheetConfig(): Stylesheet {
    return {
      activeColor: "{{appsmith.theme.colors.primaryColor}}",
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
          activeColor={this.props.activeColor}
          bottomRow={this.props.bottomRow}
          inactiveColor={this.props.inactiveColor}
          isAllowHalf={this.props.isAllowHalf}
          isDisabled={this.props.isDisabled}
          isLoading={this.props.isLoading}
          key={this.props.widgetId}
          leftColumn={this.props.leftColumn}
          maxCount={this.props.maxCount}
          onValueChanged={this.valueChangedHandler}
          readonly={this.props.isReadOnly}
          rightColumn={this.props.rightColumn}
          size={this.props.size}
          tooltips={this.props.tooltips}
          topRow={this.props.topRow}
          value={this.props.rate}
          widgetId={this.props.widgetId}
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
  isReadOnly?: boolean;
}

export default RateWidget;
