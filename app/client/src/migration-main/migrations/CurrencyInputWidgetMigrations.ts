import { traverseDSLAndMigrate } from "utils/WidgetMigrationUtils";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";

export const migrateCurrencyInputWidgetDefaultCurrencyCode = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CURRENCY_INPUT_WIDGET") {
      child.defaultCurrencyCode = child.currencyCode;
      delete child.currencyCode;

      if (child.dynamicPropertyPathList) {
        child.dynamicPropertyPathList.forEach((property) => {
          if (property.key === "currencyCode") {
            property.key = "defaultCurrencyCode";
          }
        });
      }

      if (child.dynamicBindingPathList) {
        child.dynamicBindingPathList.forEach((property) => {
          if (property.key === "currencyCode") {
            property.key = "defaultCurrencyCode";
          }
        });
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCurrencyInputWidgetDefaultCurrencyCode(child);
    }
    return child;
  });
  return currentDSL;
};

export const migrateInputWidgetShowStepArrows = (
  currentDSL: DSLWidget,
): DSLWidget => {
  return traverseDSLAndMigrate(currentDSL, (widget: WidgetProps) => {
    if (
      (widget.type === "CURRENCY_INPUT_WIDGET" ||
        (widget.type === "INPUT_WIDGET_V2" &&
          widget.inputType === InputTypes.NUMBER)) &&
      widget.showStepArrows === undefined
    ) {
      widget.showStepArrows = true;
    }
  });
};
