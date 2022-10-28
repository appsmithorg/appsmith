import { WidgetProps } from "widgets/BaseWidget";
import { ScannerLayout } from "widgets/CodeScannerWidget/constants";
import { DSLWidget } from "widgets/constants";

export const migrateCodeScannerLayout = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CODE_SCANNER_WIDGET") {
      if (!("isClickedMarkerCentered" in child)) {
        child.scannerLayout = ScannerLayout.CLICK_TO_SCAN;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCodeScannerLayout(child);
    }

    return child;
  });

  return currentDSL;
};
