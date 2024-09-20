import type { DSLWidget } from "../types";

enum ButtonVariantTypes {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  TERTIARY = "TERTIARY",
}

export const migrateButtonVariant = (currentDSL: DSLWidget) => {
  if (
    currentDSL.type === "BUTTON_WIDGET" ||
    currentDSL.type === "FORM_BUTTON_WIDGET" ||
    currentDSL.type === "ICON_BUTTON_WIDGET"
  ) {
    switch (currentDSL.buttonVariant) {
      case "OUTLINE":
        currentDSL.buttonVariant = ButtonVariantTypes.SECONDARY;
        break;
      case "GHOST":
        currentDSL.buttonVariant = ButtonVariantTypes.TERTIARY;
        break;
      default:
        currentDSL.buttonVariant = ButtonVariantTypes.PRIMARY;
    }
  }

  if (currentDSL.type === "MENU_BUTTON_WIDGET") {
    switch (currentDSL.menuVariant) {
      case "OUTLINE":
        currentDSL.menuVariant = ButtonVariantTypes.SECONDARY;
        break;
      case "GHOST":
        currentDSL.menuVariant = ButtonVariantTypes.TERTIARY;
        break;
      default:
        currentDSL.menuVariant = ButtonVariantTypes.PRIMARY;
    }
  }

  if (currentDSL.type === "TABLE_WIDGET") {
    if (currentDSL.hasOwnProperty("primaryColumns")) {
      Object.keys(currentDSL.primaryColumns).forEach((column) => {
        if (currentDSL.primaryColumns[column].columnType === "iconButton") {
          let newVariant = ButtonVariantTypes.PRIMARY;

          switch (currentDSL.primaryColumns[column].buttonVariant) {
            case "OUTLINE":
              newVariant = ButtonVariantTypes.SECONDARY;
              break;
            case "GHOST":
              newVariant = ButtonVariantTypes.TERTIARY;
              break;
          }
          currentDSL.primaryColumns[column].buttonVariant = newVariant;
        }
      });
    }
  }

  if (currentDSL.children && currentDSL.children.length) {
    currentDSL.children = currentDSL.children.map((child: DSLWidget) =>
      migrateButtonVariant(child),
    );
  }

  return currentDSL;
};
