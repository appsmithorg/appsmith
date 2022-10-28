import { WidgetProps } from "widgets/BaseWidget";
import { ScannerVariant } from "widgets/CodeScannerWidget/constants";
import { DSLWidget } from "widgets/constants";

export const migrateCodeScannerVariant = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((child: WidgetProps) => {
    if (child.type === "CODE_SCANNER_WIDGET") {
      if (!("isClickedMarkerCentered" in child)) {
        child.scannerVariant = ScannerVariant.CLICK_TO_SCAN;
      }
    } else if (child.children && child.children.length > 0) {
      child = migrateCodeScannerVariant(child);
    }

    return child;
  });

  return currentDSL;
};
