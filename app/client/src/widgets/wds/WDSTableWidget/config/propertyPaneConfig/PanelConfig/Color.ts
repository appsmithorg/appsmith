import { ValidationTypes } from "constants/WidgetValidation";
import type { TableWidgetProps } from "widgets/wds/WDSTableWidget/constants";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";
import { hideByColumnType } from "../../../widget/propertyUtils";
import { COLORS } from "@design-system/widgets";
import capitalize from "lodash/capitalize";

export default {
  sectionName: "Color",
  children: [
    {
      propertyName: "buttonColor",
      label: "Button color",
      controlType: "PRIMARY_COLUMNS_COLOR_PICKER_V2",
      helpText: "Changes the color of the button",
      isJSConvertible: true,
      customJSControl: "TABLE_COMPUTE_VALUE",
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return hideByColumnType(props, propertyPath, [
          ColumnTypes.BUTTON,
          ColumnTypes.ICON_BUTTON,
        ]);
      },
      dependencies: ["primaryColumns", "columnOrder"],
      isBindProperty: true,
      validation: {
        type: ValidationTypes.ARRAY_OF_TYPE_OR_TYPE,
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
      propertyName: "cellColor",
      label: "Cell color",
      controlType: "DROP_DOWN",
      fullWidth: true,
      helpText: "Sets the semantic color of the cell",
      options: [{
        label: "Default",
        value: "default",
      }, ...Object.values(COLORS).map((semantic) => ({
        label: capitalize(semantic),
        value: semantic,
      }))],
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: ["default", ...Object.values(COLORS)],
          default: "default",
        },
      },
    },
  ],
};
