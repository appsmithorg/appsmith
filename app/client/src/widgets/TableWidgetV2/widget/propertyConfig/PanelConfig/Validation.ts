import { get } from "lodash";
import type { TableWidgetProps } from "widgets/TableWidgetV2/constants";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

import { hideByColumnType } from "../../propertyUtils";
import commonValidations from "./Validations/Common";
import dateTypeValidations from "./Validations/Date";
import numberTypeValidations from "./Validations/Number";

export default {
  sectionName: "Validation",
  hidden: (props: TableWidgetProps, propertyPath: string) => {
    const isEditable = get(props, `${propertyPath}.isEditable`, "");

    return (
      !isEditable ||
      hideByColumnType(
        props,
        propertyPath,
        [
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
          ColumnTypes.DATE,
          ColumnTypes.CURRENCY,
        ],
        true,
      )
    );
  },
  children: [
    ...numberTypeValidations,
    ...dateTypeValidations,
    ...commonValidations,
  ],
};
