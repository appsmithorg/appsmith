import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateChartWidgetReskinningData = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CHART_WIDGET") {
      child.accentColor = "{{appsmith.theme.colors.primaryColor}}";
      child.fontFamily = "{{appsmith.theme.fontFamily.appFont}}";

      child.dynamicBindingPathList = [
        ...(child.dynamicBindingPathList || []),
        {
          key: "accentColor",
        },
        {
          key: "fontFamily",
        },
      ];
    } else if (child.children && child.children.length > 0) {
      child = migrateChartWidgetReskinningData(child);
    }
    return child;
  });
  return currentDSL;
};
