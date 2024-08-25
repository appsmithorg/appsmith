import { BUTTON_VARIANTS, COLORS } from "@appsmith/wds";
import {
  BUTTON_WIDGET_DEFAULT_LABEL,
  createMessage,
} from "ee/constants/messages";
import { ValidationTypes } from "constants/WidgetValidation";
import { capitalize } from "lodash";
import { objectKeys } from "@appsmith/utils";

export const propertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        helpText: "Group Buttons",
        propertyName: "buttonsList",
        controlType: "GROUP_BUTTONS",
        allowSpatialGrouping: true,
        label: "Buttons",
        dependencies: ["childStylesheet", "orientation"],
        isBindProperty: false,
        isTriggerProperty: false,
        panelConfig: {
          editableTitle: true,
          titlePropertyName: "label",
          panelIdPropertyName: "id",
          updateHook: (
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            props: any,
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
              sectionName: "Label",
              children: [
                {
                  propertyName: "label",
                  helpText: "Sets the label of the button",
                  label: "Text",
                  controlType: "INPUT_TEXT",
                  placeholderText: createMessage(BUTTON_WIDGET_DEFAULT_LABEL),
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: { type: ValidationTypes.TEXT },
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
              sectionName: "Events",
              children: [
                {
                  helpText: "when the button is clicked",
                  propertyName: "onClick",
                  label: "onClick",
                  controlType: "ACTION_SELECTOR",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: true,
                },
              ],
            },
          ],
          styleChildren: [
            {
              sectionName: "General",
              children: [
                {
                  propertyName: "variant",
                  label: "Button variant",
                  controlType: "ICON_TABS",
                  fullWidth: true,
                  helpText: "Sets the variant of the button",
                  options: objectKeys(BUTTON_VARIANTS).map((variant) => ({
                    label: BUTTON_VARIANTS[variant],
                    value: variant,
                  })),
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  isReusable: true,
                  validation: {
                    type: ValidationTypes.TEXT,
                    params: {
                      allowedValues: objectKeys(BUTTON_VARIANTS),
                      default: objectKeys(BUTTON_VARIANTS)[0],
                    },
                  },
                },
                {
                  propertyName: "color",
                  label: "Button color",
                  controlType: "DROP_DOWN",
                  defaultValue: COLORS.accent,
                  fullWidth: true,
                  helpText: "Sets the semantic color of the button",
                  options: Object.values(COLORS).map((semantic) => ({
                    label: capitalize(semantic),
                    value: semantic,
                  })),
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  isReusable: true,
                  validation: {
                    type: ValidationTypes.TEXT,
                    params: {
                      allowedValues: Object.values(COLORS),
                      default: COLORS.accent,
                    },
                  },
                },
              ],
            },
            {
              sectionName: "Icon",
              children: [
                {
                  propertyName: "icon",
                  label: "Icon",
                  helpText: "Sets the icon to be used for a button",
                  controlType: "ICON_SELECT_V2",
                  isJSConvertible: true,
                  isBindProperty: true,
                  isTriggerProperty: false,
                  validation: { type: ValidationTypes.TEXT },
                },
                {
                  propertyName: "iconPosition",
                  label: "Position",
                  helpText: "Sets the icon alignment of the button",
                  controlType: "ICON_TABS",
                  fullWidth: false,
                  defaultValue: "start",
                  options: [
                    {
                      startIcon: "skip-left-line",
                      value: "start",
                    },
                    {
                      startIcon: "skip-right-line",
                      value: "end",
                    },
                  ],
                  isBindProperty: false,
                  isTriggerProperty: false,
                  validation: {
                    type: ValidationTypes.TEXT,
                    params: {
                      allowedValues: ["start", "end"],
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    sectionName: "General",
    children: [
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
];
