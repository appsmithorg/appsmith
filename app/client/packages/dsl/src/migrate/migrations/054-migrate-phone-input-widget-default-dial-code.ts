import type { DSLWidget } from "../types";

export const migratePhoneInputWidgetDefaultDialCode = (
  currentDSL: DSLWidget,
): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "PHONE_INPUT_WIDGET") {
      child.defaultDialCode = child.dialCode;
      delete child.dialCode;

      if (child.dynamicPropertyPathList) {
        child.dynamicPropertyPathList.forEach((property: { key: string }) => {
          if (property.key === "dialCode") {
            property.key = "defaultDialCode";
          }
        });
      }

      if (child.dynamicBindingPathList) {
        child.dynamicBindingPathList.forEach((property: { key: string }) => {
          if (property.key === "dialCode") {
            property.key = "defaultDialCode";
          }
        });
      }
    } else if (child.children && child.children.length > 0) {
      child = migratePhoneInputWidgetDefaultDialCode(child);
    }

    return child;
  });

  return currentDSL;
};
