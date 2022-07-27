import { ColumnTypes, TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { get } from "lodash";
import { getBasePropertyPath, hideByColumnType } from "../../propertyUtils";
import { ValidationTypes } from "constants/WidgetValidation";

export default {
  sectionName: "Inline editing validation",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    const isEditable = get(props, `${propertyPath}.isEditable`, "");

    return (
      !hideByColumnType(
        props,
        propertyPath,
        [ColumnTypes.TEXT, ColumnTypes.NUMBER],
        true,
      ) && !isEditable
    );
  },
  children: [
    {
      helpText: "Shows the validity of the cell validity",
      propertyName: "isCellValid",
      label: "isCellValid",
      controlType: "TABLE_INLINE_EDIT_VALIDATION",
      isJSConvertible: false,
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      isTriggerProperty: false,
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
        ]);
      },
      validation: {
        type: ValidationTypes.TABLE_PROPERTY,
        params: {
          type: ValidationTypes.BOOLEAN,
        },
      },
    },
  ],
};
