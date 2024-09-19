import type { DSLWidget } from "../types";

export const migrateRecaptchaType = (currentDSL: DSLWidget): DSLWidget => {
  currentDSL.children = currentDSL.children?.map((child: DSLWidget) => {
    if (child.type === "BUTTON_WIDGET" || child.type === "FORM_BUTTON_WIDGET") {
      const recaptchaV2 = child.recaptchaV2;

      if (recaptchaV2) {
        child.recaptchaType = "V2";
      } else {
        child.recaptchaType = "V3";
      }

      delete child.recaptchaV2;
    } else if (child.children && child.children.length > 0) {
      child = migrateRecaptchaType(child);
    }

    return child;
  });

  return currentDSL;
};
