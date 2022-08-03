import { ValidationTypes } from "constants/WidgetValidation";
import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ButtonVariantTypes } from "components/constants";
import {
  hideByColumnType,
  removeBoxShadowColorProp,
  showByColumnType,
  updateIconAlignment,
} from "../../propertyUtils";
import { IconNames } from "@blueprintjs/icons";

export default {
  sectionName: "Basic",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return showByColumnType(props, propertyPath, [
      ColumnTypes.BUTTON,
      ColumnTypes.ICON_BUTTON,
    ]);
  },
  dependencies: ["columnType"],
  children: [
    {
      propertyName: "buttonLabel",
      label: "Text",
      controlType: "TABLE_COMPUTE_VALUE",
      defaultValue: "Action",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      propertyName: "menuButtonLabel",
      label: "Text",
      controlType: "TABLE_COMPUTE_VALUE",
      defaultValue: "Open Menu",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [ColumnTypes.MENU_BUTTON]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
    },
    {
      helpText: "Triggers an action when the button is clicked",
      propertyName: "onClick",
      label: "onClick",
      controlType: "ACTION_SELECTOR",
      additionalAutoComplete: (props: TableWidgetProps) => ({
        currentRow: Object.assign(
          {},
          ...Object.keys(props.primaryColumns).map((key) => ({
            [key]: "",
          })),
        ),
      }),
      isJSConvertible: true,
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: true,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.BUTTON,
          ColumnTypes.ICON_BUTTON,
        ]);
      },
    },
  ],
};
