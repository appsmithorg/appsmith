import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";

export const migrateCurrencyInputWidgetDefaultCountryCode = (
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
      child = migrateCurrencyInputWidgetDefaultCountryCode(child);
    }
    return child;
  });
  return currentDSL;
};
