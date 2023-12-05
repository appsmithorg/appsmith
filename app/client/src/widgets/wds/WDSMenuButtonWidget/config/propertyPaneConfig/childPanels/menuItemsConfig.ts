import { ICON_NAMES } from "WidgetProvider/constants";
import { ValidationTypes } from "constants/WidgetValidation";

/**
 * This is for the configuration of menu items when
 * the menuItemsSource is static.
 */
export const menuItemsConfig = {
  editableTitle: true,
  titlePropertyName: "label",
  panelIdPropertyName: "id",
  updateHook: (props: any, propertyPath: string, propertyValue: string) => {
    return [
      {
        propertyPath,
        propertyValue,
      },
    ];
  },
  contentChildren: [
    {
      sectionName: "General",
      children: [
        {
          propertyName: "label",
          helpText: "Sets the label of a menu item",
          label: "Label",
          controlType: "INPUT_TEXT",
          placeholderText: "Download",
          isBindProperty: true,
          isTriggerProperty: false,
          validation: { type: ValidationTypes.TEXT },
        },
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
          helpText: "when the menu item is clicked",
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
      sectionName: "Icon",
      children: [
        {
          propertyName: "iconName",
          label: "Icon",
          helpText: "Sets the icon to be used for a menu item",
          controlType: "ICON_SELECT",
          isBindProperty: false,
          isTriggerProperty: false,
          validation: {
            type: ValidationTypes.TEXT,
            params: {
              allowedValues: ICON_NAMES,
            },
          },
        },
        {
          propertyName: "iconAlign",
          label: "Position",
          helpText: "Sets the icon alignment of a menu item",
          controlType: "ICON_TABS",
          fullWidth: false,
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
            allowedValues: ["start", "end"],
          },
        },
      ],
    },
    // TODO - Uncomment once we have polished the fundamentals of WDS.
    // Ref convo in slack - https://theappsmith.slack.com/archives/C04P60V0VQE/p1701435055352789?thread_ts=1701429043.543219&cid=C04P60V0VQE
    // {
    //   sectionName: "Color",
    //   children: [
    //     {
    //       propertyName: "textColor",
    //       label: "Text Color",
    //       helpText: "Controls the color of the text displayed",
    //       controlType: "DROP_DOWN",
    //       defaultValue: "neutral",
    //       options: [
    //         {
    //           label: "Accent",
    //           value: "accent",
    //         },
    //         {
    //           label: "Neutral",
    //           value: "neutral",
    //         },
    //         {
    //           label: "Positive",
    //           value: "positive",
    //         },
    //         {
    //           label: "Negative",
    //           value: "negative",
    //         },
    //         {
    //           label: "Warning",
    //           value: "warning",
    //         },
    //       ],
    //       isJSConvertible: true,
    //       isBindProperty: true,
    //       isTriggerProperty: false,
    //       validation: {
    //         type: ValidationTypes.TEXT,
    //         params: {
    //           allowedValues: Object.values(COLORS),
    //           default: COLORS.neutral,
    //         },
    //       },
    //     },
    //   ],
    // },
  ],
};
