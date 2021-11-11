import { isEmpty } from "lodash";

import { PanelConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { FieldType } from "widgets/FormBuilderWidget/constants";
import {
  fieldTypeUpdateHook,
  getSchemaItem,
  HiddenFnParams,
  hiddenIfArrayItemIsObject,
} from "./helper";
import {
  CHECKBOX_PROPERTIES,
  DATE_PROPERTIES,
  INPUT_PROPERTIES,
} from "./properties";

const COMMON_PROPERTIES = {
  fieldType: [
    {
      propertyName: "fieldType",
      label: "Field Type",
      controlType: "DROP_DOWN",
      isBindProperty: false,
      isTriggerProperty: false,
      options: Object.values(FieldType).map((option) => ({
        label: option,
        value: option,
      })),
      dependencies: ["schema"],
      updateHook: fieldTypeUpdateHook,
    },
  ],
  accessibility: [
    {
      helpText: "Disables the field",
      propertyName: "isDisabled",
      label: "Disabled",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      helpText: "Controls the visibility of the field",
      propertyName: "isVisible",
      label: "Visible",
      controlType: "SWITCH",
      defaultValue: true,
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
    {
      helpText: "Show help text or details about current input",
      propertyName: "tooltip",
      label: "Tooltip",
      controlType: "INPUT_TEXT",
      placeholderText: "Passwords must be at-least 6 chars",
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
      hidden: hiddenIfArrayItemIsObject,
      dependencies: ["schema"],
    },
  ],
  labelStyles: [
    {
      propertyName: "labelTextColor",
      label: "Text Color",
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
      label: "Text Size",
      controlType: "DROP_DOWN",
      options: [
        {
          label: "Heading 1",
          value: "HEADING1",
          subText: "24px",
          icon: "HEADING_ONE",
        },
        {
          label: "Heading 2",
          value: "HEADING2",
          subText: "18px",
          icon: "HEADING_TWO",
        },
        {
          label: "Heading 3",
          value: "HEADING3",
          subText: "16px",
          icon: "HEADING_THREE",
        },
        {
          label: "Paragraph",
          value: "PARAGRAPH",
          subText: "14px",
          icon: "PARAGRAPH",
        },
        {
          label: "Paragraph 2",
          value: "PARAGRAPH2",
          subText: "12px",
          icon: "PARAGRAPH_TWO",
        },
      ],
      isBindProperty: false,
      isTriggerProperty: false,
    },
    {
      propertyName: "labelStyle",
      label: "Label Font Style",
      controlType: "BUTTON_TABS",
      options: [
        {
          icon: "BOLD_FONT",
          value: "BOLD",
        },
        {
          icon: "ITALICS_FONT",
          value: "ITALIC",
        },
      ],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.TEXT },
    },
  ],
  actions: [
    {
      propertyName: "onFocus",
      helpText: "Triggers an action when focused.",
      label: "onFocus",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
    {
      propertyName: "onBlur",
      helpText: "Triggers an action when the field loses focus.",
      label: "onBlur",
      controlType: "ACTION_SELECTOR",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: true,
    },
  ],
};

function generatePanelPropertyConfig(
  nestingLevel: number,
): PanelConfig | undefined {
  if (nestingLevel === 0) return;

  return {
    editableTitle: true,
    titlePropertyName: "label",
    panelIdPropertyName: "name",
    children: [
      {
        sectionName: "General",
        children: [
          ...COMMON_PROPERTIES.fieldType,
          ...INPUT_PROPERTIES.general,
          ...CHECKBOX_PROPERTIES.general,
          ...DATE_PROPERTIES.general,
          ...COMMON_PROPERTIES.accessibility,
          {
            propertyName: "children",
            label: "Field Configuration",
            controlType: "FIELD_CONFIGURATION",
            isBindProperty: false,
            isTriggerProperty: false,
            panelConfig: generatePanelPropertyConfig(nestingLevel - 1),
            hidden: (...args: HiddenFnParams) => {
              return getSchemaItem(...args).then((schemaItem) => {
                return (
                  schemaItem.fieldType !== FieldType.OBJECT &&
                  isEmpty(schemaItem.children)
                );
              });
            },
            dependencies: ["schema"],
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [...COMMON_PROPERTIES.labelStyles],
      },
      {
        sectionName: "Actions",
        children: [
          ...INPUT_PROPERTIES.actions,
          ...CHECKBOX_PROPERTIES.actions,
          ...DATE_PROPERTIES.actions,
          ...COMMON_PROPERTIES.actions,
        ],
      },
    ],
  } as PanelConfig;
}

export default generatePanelPropertyConfig;
