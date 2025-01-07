import type { DSLWidget, WidgetProps } from "../types";
import { traverseDSLAndMigrate } from "../utils";

export const migrateJsonFormWidgetLabelPositonAndAlignment = (
  currentDSL: DSLWidget,
) => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (widget.type == "JSON_FORM_WIDGET") {
      const jsonFormWidgetProps = widget;
      Object.keys(jsonFormWidgetProps.schema).forEach((key) => {
        const field = jsonFormWidgetProps.schema[key];
        if (field.children) {
          Object.keys(field.children).forEach((childKey) => {
            const childField = field.children[childKey];

            if (
              childField.fieldType === "Switch" &&
              childField.alignWidget === "RIGHT"
            ) {
              childField.alignWidget = "LEFT";
            }

            if (
              childField.fieldType === "Checkbox" &&
              childField.alignWidget === "LEFT"
            ) {
              field.children[childKey] = {
                ...childField,
                labelPosition: "Right",
              };
            }
            if (
              childField.fieldType === "Checkbox" &&
              childField.alignWidget === "RIGHT"
            ) {
              childField.alignWidget = "LEFT";
              field.children[childKey] = {
                ...childField,
                labelPosition: "Left",
              };
            }
          });
        }
      });
    }
  });
};
