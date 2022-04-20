import { ValidationTypes } from "constants/WidgetValidation";
import {
  ColumnTypes,
  ICON_NAMES,
  TableWidgetProps,
} from "widgets/TableWidgetV2/constants";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { hideByColumnType } from "../../propertyUtils";
import { IconNames } from "@blueprintjs/icons";

export default {
  sectionName: "Discard Button Properties",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return hideByColumnType(
      props,
      propertyPath,
      [ColumnTypes.EDIT_ACTIONS],
      true,
    );
  },
  children: [
    {
      propertyName: "discardButtonVariant",
      label: "Button Variant",
      controlType: "DROP_DOWN",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      helpText: "Sets the variant of the discard button",
      dependencies: ["primaryColumns"],
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
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            default: ButtonVariantTypes.PRIMARY,
            allowedValues: [
              ButtonVariantTypes.PRIMARY,
              ButtonVariantTypes.SECONDARY,
              ButtonVariantTypes.TERTIARY,
            ],
          },
        },
      },
    },
    {
      propertyName: "discardButtonColor",
      label: "Button Color",
      controlType: "COLOR_PICKER",
      helpText: "Changes the color of the button",
      isJSConvertible: true,
      customJSControl: "COMPUTE_VALUE_V2",
      dependencies: ["primaryColumns"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            regex: /^(?![<|{{]).+/,
          },
        },
      },
      isTriggerProperty: false,
    },
    {
      propertyName: "discardIconAlign",
      label: "Icon Alignment",
      helpText: "Sets the icon alignment of the discard button",
      controlType: "ICON_ALIGN",
      isBindProperty: false,
      isTriggerProperty: false,
      dependencies: ["primaryColumns"],
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["center", "left", "right"],
        },
      },
    },
    {
      propertyName: "discardBorderRadius",
      label: "Border Radius",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      helpText: "Rounds the corners of the discard button's outer border edge",
      controlType: "BORDER_RADIUS_OPTIONS",
      options: [
        ButtonBorderRadiusTypes.SHARP,
        ButtonBorderRadiusTypes.ROUNDED,
        ButtonBorderRadiusTypes.CIRCLE,
      ],
      dependencies: ["primaryColumns"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ["CIRCLE", "SHARP", "ROUNDED"],
          },
        },
      },
    },
    {
      propertyName: "discardActionLabel",
      label: "Action label",
      controlType: "COMPUTE_VALUE_V2",
      defaultValue: "Discard",
      dependencies: ["primaryColumns"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "discardActionIconName",
      label: "Action Icon",
      helpText: "Sets the icon to be used for the discard action button",
      dependencies: ["primaryColumns", "columnOrder"],
      controlType: "ICON_SELECT",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: ICON_NAMES,
          },
        },
      },
    },
    {
      propertyName: "isDiscardVisible",
      dependencies: ["primaryColumns"],
      label: "Visible",
      helpText: "Controls the visibility of the discard button",
      defaultValue: true,
      controlType: "SWITCH",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    },
    {
      propertyName: "isDiscardDisabled",
      label: "Disabled",
      defaultValue: false,
      controlType: "SWITCH",
      customJSControl: "COMPUTE_VALUE_V2",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      dependencies: ["primaryColumns"],
    },
  ],
};
