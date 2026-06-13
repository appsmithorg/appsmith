import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { anvilWidgets } from "widgets/wds/constants";
import type { WidgetType } from "./types";

export const TAB_ORDER_PROPERTY_NAME = "tabOrder";
export const TAB_ORDER_SECTION_NAME = "Accessibility";

/**
 * Widget types that must not expose the shared `tabOrder` property:
 * internal wrappers and Anvil-only layout widgets. All WDS_* (Anvil) widgets
 * are excluded by prefix in shouldExposeTabOrderProperty.
 */
const TAB_ORDER_EXCLUDED_WIDGET_TYPES: string[] = [
  "CANVAS_WIDGET",
  "SKELETON_WIDGET",
  "TABS_MIGRATOR_WIDGET",
  anvilWidgets.SECTION_WIDGET,
  anvilWidgets.ZONE_WIDGET,
];

export function shouldExposeTabOrderProperty(type: WidgetType): boolean {
  if (!type) return false;

  if (type.startsWith("WDS_")) return false;

  return !TAB_ORDER_EXCLUDED_WIDGET_TYPES.includes(type);
}

/**
 * Returns a fresh copy of the shared Accessibility section so that the
 * id-generation and enhancement steps in WidgetFactory never mutate an
 * object shared across widget types.
 */
export function createTabOrderPropertyPaneSection() {
  return {
    sectionName: TAB_ORDER_SECTION_NAME,
    children: [
      {
        propertyName: TAB_ORDER_PROPERTY_NAME,
        label: "Tab order",
        helpText:
          "Optional. Lower numbers receive keyboard focus first, among widgets in the same container. Leave blank for automatic order. Fields inside a form follow the form's own order.",
        controlType: "TAB_ORDER_INPUT",
        placeholderText: "Auto",
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.NUMBER,
          params: {
            min: 0,
            natural: true,
          },
        },
      },
    ],
  };
}

/**
 * Appends the shared Accessibility > Tab order section to a widget's property
 * pane configuration. Widgets without a property pane and excluded widget
 * types are left untouched.
 */
export function addTabOrderToPropertyPaneConfig(
  type: WidgetType,
  config: PropertyPaneConfig[],
): PropertyPaneConfig[] {
  if (!shouldExposeTabOrderProperty(type)) return config;

  if (!Array.isArray(config) || config.length === 0) return config;

  return [...config, createTabOrderPropertyPaneSection()];
}
