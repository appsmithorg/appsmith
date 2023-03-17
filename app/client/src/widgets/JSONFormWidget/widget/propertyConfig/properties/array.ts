import { get } from "lodash";

import { ValidationTypes } from "constants/WidgetValidation";
import type { SchemaItem } from "widgets/JSONFormWidget/constants";
import { FieldType } from "widgets/JSONFormWidget/constants";
import type { JSONFormWidgetProps } from "../..";
import type { HiddenFnParams } from "../helper";
import { getSchemaItem, getStylesheetValue } from "../helper";

const PROPERTIES = {
  style: {
    root: [
      {
        sectionName: "Array Styles",
        children: [
          {
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            helpText: "Changes the background color",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
            dependencies: ["schema"],
          },
          {
            propertyName: "borderWidth",
            helpText: "Enter value for border width",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "borderColor",
            label: "Border Color",
            helpText: "Changes the border color of Object",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
            dependencies: ["schema"],
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            getStylesheetValue,
            validation: { type: ValidationTypes.TEXT },
            dependencies: ["schema"],
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            getStylesheetValue,
            validation: { type: ValidationTypes.TEXT },
            dependencies: ["schema"],
          },
        ],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});

          // Hidden if not ARRAY
          return schemaItem.fieldType !== FieldType.ARRAY;
        },
      },
      {
        sectionName: "Item Styles",
        children: [
          {
            propertyName: "cellBackgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            helpText: "Changes the background color of the item",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
            dependencies: ["schema"],
          },
          {
            propertyName: "cellBorderWidth",
            helpText: "Enter value for border width of the item",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
          },
          {
            propertyName: "cellBorderColor",
            label: "Border Color",
            helpText: "Changes the border color of the item",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
            dependencies: ["schema"],
          },
          {
            propertyName: "cellBorderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            getStylesheetValue,
            validation: { type: ValidationTypes.TEXT },
            dependencies: ["schema"],
          },
          {
            propertyName: "cellBoxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            customJSControl: "JSON_FORM_COMPUTE_VALUE",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            getStylesheetValue,
            validation: { type: ValidationTypes.TEXT },
            dependencies: ["schema"],
          },
        ],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});

          // Hidden if not ARRAY
          return schemaItem.fieldType !== FieldType.ARRAY;
        },
      },
    ],
  },
  content: {
    data: [
      {
        helpText:
          "Sets the default value of the field. The array is updated when the default value changes",
        propertyName: "defaultValue",
        label: "Default Value",
        controlType: "JSON_FORM_COMPUTE_VALUE",
        placeholderText: "[]",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.ARRAY,
        },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.ARRAY),
        dependencies: ["schema"],
      },
    ],
    general: [
      {
        propertyName: "isCollapsible",
        label: "Collapsible",
        helpText: "Makes the array items collapsible",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        customJSControl: "JSON_FORM_COMPUTE_VALUE",
        validation: { type: ValidationTypes.BOOLEAN },
        hidden: (...args: HiddenFnParams) =>
          getSchemaItem(...args).fieldTypeNotMatches(FieldType.ARRAY),
        dependencies: ["schema"],
      },
    ],
  },
};

export default PROPERTIES;
