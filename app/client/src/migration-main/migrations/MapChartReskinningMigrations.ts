import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";

export const migrateMapChartWidgetReskinningData = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "MAP_CHART_WIDGET") {
      if (!child.hasOwnProperty("fontFamily")) {
        child.fontFamily = "{{appsmith.theme.fontFamily.appFont}}";

        child.dynamicBindingPathList = [
          ...(child.dynamicBindingPathList || []),
          {
            key: "fontFamily",
          },
        ];
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateMapChartWidgetReskinningData(child);
    }

    return child;
  });

  return currentDSL;
};
