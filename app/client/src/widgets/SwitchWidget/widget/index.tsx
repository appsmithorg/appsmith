import React from "react";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import SwitchComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { LabelPosition } from "components/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { AlignWidgetTypes } from "WidgetProvider/constants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import {
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
} from "widgets/WidgetUtils";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type {
  SnipingModeProperty,
  PropertyUpdates,
} from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  static type = "SWITCH_WIDGET";

  static getConfig() {
    return {
      name: "Switch",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.TOGGLES],
      needsMeta: true,
      searchTags: ["boolean"],
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

  static getDefaults() {
    return {
      label: "Label",
      rows: 4,
      columns: 12,
      defaultSwitchState: true,
      widgetName: "Switch",
      alignWidget: AlignWidgetTypes.LEFT,
      labelPosition: LabelPosition.Left,
      version: 1,
      isDisabled: false,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "defaultSwitchState",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelTextSize: "0.875rem",
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
              minHeight: "40px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "40px" },
        minWidth: { base: "120px" },
      },
    };
  }

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
            fullWidth: false,
            options: [
              {
                startIcon: "align-left",
                value: AlignWidgetTypes.LEFT,
              },
              {
                startIcon: "align-right",
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
            label: "Default state",
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
            helpText: "when the switch state is changed",
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
        sectionName: "Label styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font color",
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
            label: "Font size",
            helpText: "Control the font size of the label associated",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            hidden: isAutoLayout,
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
            controlType: "BUTTON_GROUP",
            options: [
              {
                icon: "text-bold",
                value: "BOLD",
              },
              {
                icon: "text-italic",
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
            label: "Accent color",
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Switch is a simple UI widget you can use when you want users to make a binary choice",
      "!url": "https://docs.appsmith.com/widget-reference/switch",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isSwitchedOn: "bool",
      isDisabled: "bool",
    };
  }

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
        setRequired: {
          path: "isRequired",
          type: "boolean",
        },
        setValue: {
          path: "defaultSwitchState",
          type: "boolean",
          accessor: "isSwitchedOn",
        },
        setColor: {
          path: "accentColor",
          type: "string",
        },
      },
    };
  }

  getWidgetView() {
    return (
      <SwitchComponent
        accentColor={this.props.accentColor}
        alignWidget={this.props.alignWidget}
        isDisabled={this.props.isDisabled}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isLabelInline={this.isAutoLayoutMode}
        isLoading={this.props.isLoading}
        isSwitchedOn={!!this.props.isSwitchedOn}
        key={this.props.widgetId}
        label={this.props.label}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        minHeight={this.props.minHeight}
        onChange={this.onChange}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isSwitchedOn: "defaultSwitchState",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
