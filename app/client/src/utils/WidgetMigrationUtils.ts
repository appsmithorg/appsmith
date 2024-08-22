import type { DSLWidget } from "WidgetProvider/constants";
import type { WidgetProps } from "widgets/BaseWidget";

/*
 * Function to traverse the DSL tree and execute the given migration function for each widget present in
 * the tree.
 */
export const traverseDSLAndMigrate = (
  DSL: DSLWidget,
  migrateFn: (widget: WidgetProps) => void,
) => {
  DSL.children = DSL.children?.map((widget: WidgetProps) => {
    migrateFn(widget);

    if (widget.children && widget.children.length > 0) {
      widget = traverseDSLAndMigrate(widget, migrateFn);
    }

    return widget;
  });

  return DSL;
};
