import React from "react";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import CustomComponent from "../component";

import IconSVG from "../icon.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

class CustomWidget extends BaseWidget<CustomWidgetProps, WidgetState> {
  static type = "CUSTOM_WIDGET";

  static getConfig() {
    return {
      name: "Custom",
      hideCard: !super.getFeatureFlag(
        FEATURE_FLAG.release_custom_widgets_enabled,
      ),
      iconSVG: IconSVG,
      needsMeta: false,
      isCanvas: false,
      tags: [WIDGET_TAGS.DISPLAY],
      searchTags: ["external"],
      isSearchWildcard: true,
    };
  }

  static getDefaults() {
    return {
      widgetName: "Custom",
      rows: 30,
      columns: 30,
      version: 1,
      events: [],
      isVisible: true,
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Widget",
        children: [
          {
            propertyName: "editSource",
            label: "",
            controlType: "CUSTOM_WIDGET_EDIT_BUTTON_CONTROL",
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Model variables",
        children: [
          {
            propertyName: "model",
            helperText: (
              <div style={{ marginTop: "10px" }}>
                This model exposes Appsmith data to the widget editor.{" "}
                <a
                  className="decoration-solid underline"
                  href="https://docs.appsmith.com/core-concepts/dynamic-data"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read more
                </a>
              </div>
            ),
            label: "",
            controlType: "INPUT_TEXT",
            defaultValue: "{}",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
        ],
      },
      {
        sectionName: "Events",
        hasDynamicProperties: true,
        generateDynamicProperties: (widgetProps: WidgetProps) => {
          return widgetProps.events?.map((event: string) => ({
            propertyName: event,
            label: event,
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            controlConfig: {
              allowEdit: true,
              onEdit: (widget: CustomWidgetProps, newLabel: string) => {
                return {
                  events: widget.events.map((e) => {
                    if (e === event) {
                      return newLabel;
                    }

                    return e;
                  }),
                };
              },
              allowDelete: true,
              onDelete: (widget: CustomWidgetProps) => {
                return {
                  events: widget.events.filter((e) => e !== event),
                };
              },
            },
            dependencies: ["events"],
          }));
        },
        children: [
          {
            propertyName: "generateEvents",
            label: "",
            controlType: "CUSTOM_WIDGET_ADD_EVENT_BUTTON_CONTROL",
            isJSConvertible: false,
            isBindProperty: false,
            buttonLabel: "Add Event",
            onAdd: (widget: CustomWidgetProps, event: string) => {
              const events = widget.events;

              return {
                events: [...events, event],
              };
            },
            isTriggerProperty: false,
            dependencies: ["events"],
            size: "md",
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
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

  getWidgetView() {
    return <CustomComponent />;
  }
}

export interface CustomWidgetProps extends WidgetProps {
  events: string[];
}

export default CustomWidget;
