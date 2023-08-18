import React from "react";

import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import { Colors } from "constants/Colors";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import ProgressComponent from "../component";
import { ProgressType, ProgressVariant } from "../constants";
import type { AutocompletionDefinitions } from "widgets/constants";
import { isAutoLayout } from "utils/autoLayout/flexWidgetUtils";

class ProgressWidget extends BaseWidget<ProgressWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Basic",
        children: [
          {
            helpText:
              "Determines if progress indicator will be determinate or not",
            propertyName: "isIndeterminate",
            label: "Infinite loading",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Determines the shape of the progress indicator",
            propertyName: "progressType",
            label: "Type",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              {
                label: "Circular",
                value: ProgressType.CIRCULAR,
              },
              {
                label: "Linear",
                value: ProgressType.LINEAR,
              },
            ],
            defaultValue: ProgressType.LINEAR,
            isBindProperty: false,
            isTriggerProperty: false,
            hidden: isAutoLayout,
          },
          {
            helpText: "Sets the value of the progress indicator",
            propertyName: "progress",
            label: "Progress",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter progress value",
            isBindProperty: true,
            isTriggerProperty: false,
            defaultValue: 50,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { min: 0, max: 100, default: 50 },
            },
            hidden: (props: ProgressWidgetProps) => props.isIndeterminate,
            dependencies: ["isIndeterminate"],
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            helpText: "Sets the number of steps",
            propertyName: "steps",
            label: "Number of steps",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter number of steps",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                min: 1,
                max: 100,
                default: 1,
                natural: true,
                passThroughOnZero: false,
              },
            },
            hidden: (props: ProgressWidgetProps) => props.isIndeterminate,
            dependencies: ["isIndeterminate"],
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "counterClockwise",
            helpText: "Whether to rotate in counterclockwise direction",
            label: "Counterclockwise",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: ProgressWidgetProps) =>
              props.progressType === ProgressType.LINEAR ||
              props.isIndeterminate,
            dependencies: ["isIndeterminate", "progressType"],
          },
          {
            helpText:
              "Controls the visibility with the value of progress indicator",
            propertyName: "showResult",
            label: "Show result",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: ProgressWidgetProps) => props.isIndeterminate,
            dependencies: ["isIndeterminate"],
          },
        ],
      },
    ];
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Progress indicators commonly known as spinners, express an unspecified wait time or display the length of a process.",
      "!url": "https://docs.appsmith.com/widget-reference/progress",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      progress: "number",
    };
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Color",
        children: [
          {
            helpText: "Sets the color of the progress indicator",
            propertyName: "fillColor",
            label: "Fill color",
            controlType: "COLOR_PICKER",
            defaultColor: Colors.GREEN,
            isBindProperty: true,
            isJSConvertible: true,
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

  static getStylesheetConfig(): Stylesheet {
    return {
      fillColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setProgress: {
          path: "progress",
          type: "number",
        },
      },
    };
  }

  getPageView() {
    const {
      borderRadius,
      counterClockwise,
      fillColor,
      isIndeterminate,
      progress,
      progressType,
      showResult,
      steps,
    } = this.props;
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const isScaleY = componentHeight > componentWidth;

    return (
      <ProgressComponent
        borderRadius={borderRadius}
        counterClockwise={counterClockwise}
        fillColor={fillColor}
        isScaleY={isScaleY}
        showResult={showResult}
        steps={steps}
        type={progressType}
        value={progress}
        variant={
          isIndeterminate
            ? ProgressVariant.INDETERMINATE
            : ProgressVariant.DETERMINATE
        }
      />
    );
  }

  static getWidgetType(): string {
    return "PROGRESS_WIDGET";
  }
}

export interface ProgressWidgetProps extends WidgetProps {
  isIndeterminate: boolean;
  progressType: ProgressType;
  progress: number;
  steps: number;
  showResult: boolean;
  counterClockwise: boolean;
  fillColor: string;
}

export default ProgressWidget;
