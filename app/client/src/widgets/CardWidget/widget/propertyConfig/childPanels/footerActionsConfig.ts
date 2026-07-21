import { ButtonVariantTypes } from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";

import { getFooterActionStylesheetValue } from "../propertyUtils";

export default {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",

  contentChildren: [
    {
      sectionName: "Basic",
      children: [
        {
          propertyName: "label",
          helpText: "Sets the label of the action button",
          label: "Label",
          controlType: "INPUT_TEXT",
          placeholderText: "Enter label",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          helpText: "when the action button is clicked",
          propertyName: "onClick",
          label: "onClick",
          controlType: "ACTION_SELECTOR",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: true,
        },
      ],
    },
    {
      sectionName: "General",
      children: [
        {
          propertyName: "isVisible",
          helpText: "Controls the visibility of the action button",
          label: "Visible",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
        {
          propertyName: "isDisabled",
          helpText: "Disables the action button",
          label: "Disabled",
          controlType: "SWITCH",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.BOOLEAN },
        },
      ],
    },
  ],

  styleChildren: [
    {
      sectionName: "General",
      children: [
        {
          propertyName: "buttonVariant",
          label: "Button variant",
          controlType: "ICON_TABS",
          fullWidth: true,
          helpText: "Sets the variant of the action button",
          options: [
            {
              label: "Primary",
              value: ButtonVariantTypes.PRIMARY,
            },
            {
              label: "Secondary",
              value: ButtonVariantTypes.SECONDARY,
            },
            {
              label: "Tertiary",
              value: ButtonVariantTypes.TERTIARY,
            },
          ],
          defaultValue: ButtonVariantTypes.PRIMARY,
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: [
                ButtonVariantTypes.PRIMARY,
                ButtonVariantTypes.SECONDARY,
                ButtonVariantTypes.TERTIARY,
              ],
              default: ButtonVariantTypes.PRIMARY,
            },
          },
        },
      ],
    },
    {
      sectionName: "Icon",
      children: [
        {
          propertyName: "iconName",
          label: "Icon",
          helpText: "Sets the icon to be used for the action button",
          controlType: "ICON_SELECT",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
        {
          propertyName: "iconAlign",
          label: "Position",
          helpText: "Sets the icon alignment of the action button",
          controlType: "ICON_TABS",
          defaultValue: "left",
          fullWidth: false,
          options: [
            {
              startIcon: "skip-left-line",
              value: "left",
            },
            {
              startIcon: "skip-right-line",
              value: "right",
            },
          ],
          isBindProperty: false,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
      ],
    },
    {
      sectionName: "Color",
      children: [
        {
          getStylesheetValue: getFooterActionStylesheetValue,
          propertyName: "buttonColor",
          helpText: "Changes the color of the action button",
          label: "Button color",
          controlType: "COLOR_PICKER",
          isJSConvertible: true,
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
      ],
    },
  ],
};
