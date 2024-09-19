import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import RateComponent from "../component";
import type { RateSize } from "../constants";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";

import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { Colors } from "constants/Colors";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type {
  SnipingModeProperty,
  PropertyUpdates,
} from "WidgetProvider/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  static type = "RATE_WIDGET";

  static getConfig() {
    return {
      name: "Rating",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.CONTENT],
      needsMeta: true,
      searchTags: ["stars", "rate"],
    };
  }

  static getDefaults() {
    return {
      rows: 4,
      columns: 20,
      animateLoading: true,
      maxCount: 5,
      defaultRate: 3,
      activeColor: Colors.RATE_ACTIVE,
      inactiveColor: Colors.ALTO2,
      size: "LARGE",
      isRequired: false,
      isAllowHalf: false,
      isDisabled: false,
      isReadOnly: false,
      tooltips: ["Terrible", "Bad", "Neutral", "Good", "Great"],
      widgetName: "Rating",
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 1,
        active: true,
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        size: "LARGE",
      },
      defaults: {
        columns: 7.272727,
        rows: 4,
      },
      autoDimension: {
        width: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: (props: RateWidgetProps) => {
            let maxCount = props.maxCount;

            if (typeof maxCount !== "number")
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              maxCount = parseInt(props.maxCount as any, 10);

            return {
              // 21 is the size of a star, 5 is the margin between stars
              minWidth: `${maxCount * 21 + (maxCount + 1) * 5}px`,
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        horizontal: true,
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: (props: RateWidgetProps) => {
        let maxCount = props.maxCount;

        if (typeof maxCount !== "number")
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          maxCount = parseInt(props.maxCount as any, 10);

        return {
          maxHeight: {},
          maxWidth: {},
          minHeight: { base: "40px" },
          minWidth: { base: `${maxCount * 21 + (maxCount + 1) * 5}px` },
        };
      },
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "onRateChanged",
            propertyValue: propValueMap.run,
            isDynamicPropertyPath: true,
          },
        ];
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Rating widget is used to display ratings in your app.",
      "!url": "https://docs.appsmith.com/widget-reference/rate",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      value: "number",
      maxCount: "number",
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "maxCount",
            helpText: "Sets the maximum allowed rating",
            label: "Max rating",
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
            label: "Default rating",
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
            label: "Allow half stars",
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
            label: "Animate loading",
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
            helpText: "when the rate is changed",
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
            label: "Star size",
            helpText: "Controls the size of the stars in the widget",
            controlType: "ICON_TABS",
            defaultValue: "LARGE",
            fullWidth: true,
            hidden: isAutoLayout,
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
            label: "Active color",
            helpText: "Color of the selected stars",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "inactiveColor",
            label: "Inactive color",
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
        setValue: {
          path: "defaultRate",
          type: "number",
          accessor: "value",
        },
      },
    };
  }

  getWidgetView() {
    return (
      (this.props.rate || this.props.rate === 0) && (
        <RateComponent
          activeColor={this.props.activeColor}
          inactiveColor={this.props.inactiveColor}
          isAllowHalf={this.props.isAllowHalf}
          isDisabled={this.props.isDisabled}
          isLoading={this.props.isLoading}
          key={this.props.widgetId}
          maxCount={this.props.maxCount}
          minHeight={this.props.minHeight}
          onValueChanged={this.valueChangedHandler}
          readonly={this.props.isReadOnly}
          size={this.props.size}
          tooltips={this.props.tooltips}
          value={this.props.rate}
          widgetId={this.props.widgetId}
        />
      )
    );
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
