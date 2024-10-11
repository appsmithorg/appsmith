import type { ColumnProperties, DSLWidget } from "../types";

export const migrateTableWidgetIconButtonVariant = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "TABLE_WIDGET") {
      const primaryColumns = child.primaryColumns as Record<
        string,
        ColumnProperties
      >;

      Object.keys(primaryColumns).forEach((accessor: string) => {
        const primaryColumn = primaryColumns[accessor];

        if (primaryColumn.columnType === "iconButton") {
          if (!("buttonVariant" in primaryColumn)) {
            primaryColumn.buttonVariant = "TERTIARY";
          }
        }
      });
    } else if (child.children && child.children.length > 0) {
      child = migrateTableWidgetIconButtonVariant(child);
    }

    return child;
  });

  return currentDSL;
};
