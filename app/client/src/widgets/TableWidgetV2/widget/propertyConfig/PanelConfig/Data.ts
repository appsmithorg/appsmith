import { ValidationTypes } from "constants/WidgetValidation";
import { ButtonVariantTypes } from "components/constants";

const Data = {
  sectionName: "Data",
  children: [
    {
      propertyName: "groupButtons",
      helpText: "Group Buttons",
      label: "Buttons",
      controlType: "GROUP_BUTTONS",
      isBindProperty: false,
      isTriggerProperty: false,
      panelConfig: {
        editableTitle: true,
        titlePropertyName: "label",
        panelIdPropertyName: "id",
        updateHook: (
          props: Record<string, unknown>,
          propertyPath: string,
          propertyValue: string,
        ) => {
          return [
            {
              propertyPath,
              propertyValue,
            },
          ];
        },
        contentChildren: [
          {
            sectionName: "Data",
            children: [
              {
                propertyName: "label",
                helpText: "Sets the label of a button",
                label: "Label",
                controlType: "INPUT_TEXT",
                placeholderText: "Enter label",
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
              {
                propertyName: "onClick",
                helpText: "when the button is clicked",
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
            ],
          },
          {
            sectionName: "Icon",
            children: [
              {
                propertyName: "iconName",
                label: "Icon",
                helpText: "Sets the icon to be used for a button",
                controlType: "ICON_SELECT",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
              {
                propertyName: "iconAlign",
                label: "Position",
                helpText: "Sets the icon alignment of a button",
                controlType: "ICON_TABS",
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
                defaultValue: "left",
                isBindProperty: false,
                isTriggerProperty: false,
                validation: { type: ValidationTypes.TEXT },
              },
            ],
          },
          {
            sectionName: "Style",
            children: [
              {
                propertyName: "buttonVariant",
                label: "Button variant",
                controlType: "ICON_TABS",
                fullWidth: true,
                helpText: "Sets the variant of the button",
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
              {
                propertyName: "orientation",
                label: "Orientation",
                controlType: "ICON_TABS",
                fullWidth: true,
                helpText: "Sets the orientation of buttons",
                options: [
                  {
                    label: "Horizontal",
                    value: "horizontal",
                  },
                  {
                    label: "Vertical",
                    value: "vertical",
                  },
                ],
                defaultValue: "horizontal",
                isJSConvertible: true,
                isBindProperty: true,
                isTriggerProperty: false,
                validation: {
                  type: ValidationTypes.TEXT,
                  params: {
                    allowedValues: ["horizontal", "vertical"],
                    default: "horizontal",
                  },
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

export default Data;
