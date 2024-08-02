import React from "react";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";

import ProgressBarComponent from "../component";

import type {
  AutocompletionDefinitions,
  WidgetCallout,
} from "WidgetProvider/constants";
import { Colors } from "constants/Colors";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { Stylesheet } from "entities/AppTheming";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { buildDeprecationWidgetMessage } from "pages/Editor/utils";
import { BarType } from "../constants";
import IconSVG from "../icon.svg";

class ProgressBarWidget extends BaseWidget<
  ProgressBarWidgetProps,
  WidgetState
> {
  static type = "PROGRESSBAR_WIDGET";

  static getConfig() {
    return {
      name: "Progress Bar", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
      hideCard: true,
      isDeprecated: true,
      replacement: "PROGRESS_WIDGET",
      iconSVG: IconSVG,
      needsMeta: false, // Defines if this widget adds any meta properties
      isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
      tags: [WIDGET_TAGS.CONTENT],
    };
  }

  static getDefaults() {
    return {
      widgetName: "ProgressBar",
      rows: 4,
      columns: 28,
      isVisible: true,
      showResult: false,
      barType: BarType.INDETERMINATE,
      progress: 50,
      steps: 1,
      version: 1,
      responsiveBehavior: ResponsiveBehavior.Fill,
    };
  }

  static getMethods() {
    return {
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message: buildDeprecationWidgetMessage(
              ProgressBarWidget.getConfig().name,
            ),
          },
        ];
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc": "Progress bar is a simple UI widget used to show progress",
      "!url": "https://docs.appsmith.com/widget-reference/progressbar",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      progress: "number",
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Sets progress bar type",
            propertyName: "barType",
            label: "Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Indeterminate",
                value: BarType.INDETERMINATE,
              },
              {
                label: "Determinate",
                value: BarType.DETERMINATE,
              },
            ],
            defaultValue: BarType.INDETERMINATE,
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            helpText: "Provide progress value",
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
          },
          {
            helpText: "Sets a number of steps",
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
            hidden: (props: ProgressBarWidgetProps) => {
              return props.barType !== BarType.DETERMINATE;
            },
            dependencies: ["barType"],
          },
          {
            helpText: "Controls the visibility of progress value",
            propertyName: "showResult",
            label: "Show result",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            helpText: "Controls the progress color of progress bar",
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
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      fillColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    };
  }

  getWidgetView() {
    return (
      <ProgressBarComponent
        barType={this.props.barType}
        borderRadius={this.props.borderRadius}
        fillColor={this.props.fillColor}
        progress={this.props.progress}
        showResult={this.props.showResult}
        steps={this.props.steps}
      />
    );
  }
}

export interface ProgressBarWidgetProps extends WidgetProps {
  progress?: number;
  showResult: boolean;
  fillColor: string;
  barType: BarType;
  steps: number;
  borderRadius?: string;
}

export default ProgressBarWidget;
