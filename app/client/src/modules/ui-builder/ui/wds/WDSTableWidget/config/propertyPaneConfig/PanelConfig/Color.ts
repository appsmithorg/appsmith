import { ValidationTypes } from "constants/WidgetValidation";
import { COLORS } from "@appsmith/wds";
import capitalize from "lodash/capitalize";
import {
  ColumnTypes,
  type TableWidgetProps,
} from "modules/ui-builder/ui/wds/WDSTableWidget/constants";
import { showByColumnType } from "modules/ui-builder/ui/wds/WDSTableWidget/widget/propertyUtils";

export default {
  sectionName: "Color",
  children: [
    {
      propertyName: "cellColor",
      label: "Cell color",
      controlType: "DROP_DOWN",
      fullWidth: true,
      helpText: "Sets the semantic color of the cell",
      options: [
        {
          label: "Default",
          value: "default",
        },
        ...Object.values(COLORS).map((semantic) => ({
          label: capitalize(semantic),
          value: semantic,
        })),
      ],
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
      hidden: () => {
        return true;
      },
    },
    {
      propertyName: "buttonColor",
      label: "Button color",
      controlType: "DROP_DOWN",
      fullWidth: true,
      helpText: "Sets the semantic color of the button",
      options: Object.values(COLORS).map((semantic) => ({
        label: capitalize(semantic),
        value: semantic,
      })),
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      defaultValue: "accent",
      validation: {
        type: ValidationTypes.TEXT,
        params: {
          allowedValues: Object.values(COLORS),
          default: "accent",
        },
      },
      hidden: (props: TableWidgetProps, propertyPath: string) => {
        return showByColumnType(props, propertyPath, [
          ColumnTypes.URL,
          ColumnTypes.TEXT,
          ColumnTypes.NUMBER,
          ColumnTypes.DATE,
        ]);
      },
    },
  ],
};
