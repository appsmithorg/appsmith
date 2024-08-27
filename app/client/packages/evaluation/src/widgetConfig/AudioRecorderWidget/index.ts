import type { Constructor } from "../types";

export const withAudioRecorderWidgetConfig = <T extends Constructor>(
  Base: T = class {} as T,
) => {
  return class extends Base {
    static type = "AUDIO_RECORDER_WIDGET";

    static getMetaPropertiesMap(): Record<string, undefined | boolean> {
      return {
        blobURL: undefined,
        dataURL: undefined,
        rawBinary: undefined,
        isDirty: false,
      };
    }

    static getDerivedPropertiesMap(): Record<string, string> {
      return {};
    }

    static getDefaultPropertiesMap() {
      return {};
    }

    static getDependencyMap(): Record<string, string[]> {
      return {};
    }

    static getPropertyPaneContentConfig() {
      return [
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
              validation: {
                // TODO: @Diljit to replace this to ValidationTypes
                type: "BOOLEAN",
              },
            },
            {
              propertyName: "isDisabled",
              label: "Disabled",
              controlType: "SWITCH",
              helpText: "Disables input to this widget",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: "BOOLEAN",
              },
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
              validation: { type: "BOOLEAN" },
            },
          ],
        },
        {
          sectionName: "Events",
          children: [
            {
              helpText: "when the recording starts",
              propertyName: "onRecordingStart",
              label: "onRecordingStart",
              controlType: "ACTION_SELECTOR",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: true,
            },
            {
              helpText: "when the recording ends",
              propertyName: "onRecordingComplete",
              label: "onRecordingComplete",
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
          sectionName: "Styles",
          children: [
            {
              propertyName: "iconColor",
              helpText: "Sets the icon color of the widget",
              label: "Icon color",
              controlType: "COLOR_PICKER",
              isBindProperty: false,
              isTriggerProperty: false,
            },
            {
              propertyName: "accentColor",
              helpText: "Changes the color of the recorder button",
              label: "Button color",
              controlType: "COLOR_PICKER",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: "TEXT" },
            },
          ],
        },
        {
          sectionName: "Border and shadow",
          children: [
            {
              propertyName: "borderRadius",
              label: "Border radius",
              helpText:
                "Rounds the corners of the icon button's outer border edge",
              controlType: "BORDER_RADIUS_OPTIONS",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: "TEXT" },
            },
            {
              propertyName: "boxShadow",
              label: "Box shadow",
              helpText:
                "Enables you to cast a drop shadow from the frame of the widget",
              controlType: "BOX_SHADOW_OPTIONS",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: "TEXT" },
            },
          ],
        },
      ];
    }

    static getSetterConfig(): {
      __setters: {
        [key: string]: {
          path: string;
          type: string;
          disabled?: string;
          accessor?: string;
        };
      };
    } {
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
        },
      };
    }
  };
};
