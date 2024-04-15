import { ValidationTypes } from "constants/WidgetValidation";
import { COLORS } from "@design-system/widgets";
import capitalize from "lodash/capitalize";

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
    },
  ],
};
