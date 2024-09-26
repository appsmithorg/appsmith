import { InputTypes } from "components/constants";
import { ValidationTypes } from "constants/WidgetValidation";

import type { InputWidgetProps } from "../../widget/types";
import { ICONS } from "@appsmith/wds";

export const propertyPaneStyleConfig = [
  {
    sectionName: "Icon",
    children: [
      {
        propertyName: "iconName",
        label: "Icon",
        helpText: "Sets the icon to be used in input field",
        controlType: "ICON_SELECT_V2",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.keys(ICONS),
          },
        },
        hidden: (props: InputWidgetProps) => {
          return props.inputType === InputTypes.MULTI_LINE_TEXT;
        },
        dependencies: ["inputType"],
      },
      {
        propertyName: "iconAlign",
        label: "Position",
        helpText: "Sets the icon alignment of input field",
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
        hidden: (props: InputWidgetProps) =>
          props.inputType === InputTypes.MULTI_LINE_TEXT || !props.iconName,
        dependencies: ["iconName", "inputType"],
      },
    ],
  },
];
