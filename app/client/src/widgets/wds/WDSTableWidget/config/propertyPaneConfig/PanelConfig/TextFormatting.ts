import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/wds/WDSTableWidget/constants";
import {
  hideByColumnType,
  showByColumnType,
} from "../../../widget/propertyUtils";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";

export default {
  sectionName: "Text formatting",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    return showByColumnType(
      props,
      propertyPath,
      [ColumnTypes.CHECKBOX, ColumnTypes.SWITCH],
      true,
    );
  },
  children: [
    {
      propertyName: "fontStyle",
      label: "Emphasis",
      helpText: "Controls the style of the text in the column",
      controlType: "BUTTON_GROUP",
      options: [
        {
          icon: "text-bold",
          value: "BOLD",
        },
        {
          icon: "text-italic",
          value: "ITALIC",
        },
      ],
      isJSConvertible: true,

      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
        params: {
          type: ValidationTypes.TEXT,
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.DATE,
          ColumnTypes.NUMBER,
          ColumnTypes.CURRENCY,
          ColumnTypes.URL,
        ]);
      },
    },
  ],
};
