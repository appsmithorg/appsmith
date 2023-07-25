import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "widgets/constants";

export const migrateCodeScannerLayout = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CODE_SCANNER_WIDGET") {
      if (!child.scannerLayout) {
        child.scannerLayout = "CLICK_TO_SCAN";
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCodeScannerLayout(child);
    }

    return child;
  });

  return currentDSL;
};
