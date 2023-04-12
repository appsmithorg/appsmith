import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ButtonPlacementTypes } from "components/constants";
import { ScannerLayout } from "./constants";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Code Scanner",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: [
    "barcode scanner",
    "qr scanner",
    "code detector",
    "barcode reader",
  ],
  defaults: {
    rows: 33,
    label: "Scan a QR/Barcode",
    columns: 25,
    widgetName: "CodeScanner",
    isDefaultClickDisabled: true,
    scannerLayout: ScannerLayout.ALWAYS_ON,
    version: 1,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    placement: ButtonPlacementTypes.CENTER,
    responsiveBehavior: ResponsiveBehavior.Fill,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
  autoLayout: {
    disabledPropsDefaults: {
      scannerLayout: ScannerLayout.ALWAYS_ON,
    },
    widgetSize: [
      {
        viewportMinWidth: 0,
        configuration: () => {
          return {
            minWidth: "280px",
            minHeight: "300px",
          };
        },
      },
    ],
  },
};

export default Widget;
