import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { WDSBaseInputWidget } from "../../WDSBaseInputWidget";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  labelPosition: "top",
  inputType: "TEXT",
  widgetName: "Input",
  version: 2,
  label: "Label",
  showStepArrows: false,
  responsiveBehavior: ResponsiveBehavior.Fill,
};
