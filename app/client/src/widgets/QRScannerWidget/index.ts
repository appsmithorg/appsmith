import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ButtonPlacementTypes } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "QRScanner",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["barcode scanner, code detector"],
  defaults: {
    rows: 4,
    label: "Scan QR Code",
    columns: 16,
    widgetName: "QRScanner",
    isDefaultClickDisabled: true,
    version: 1,
    isRequired: false,
    isDisabled: false,
    animateLoading: true,
    placement: ButtonPlacementTypes.CENTER,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
  },
};

export default Widget;
