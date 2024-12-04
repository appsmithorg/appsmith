import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import defaultApp from "../widget/defaultApp";
import { COMPONENT_SIZE, DEFAULT_MODEL } from "../constants";

export const defaultsConfig = {
  widgetName: "Custom",
  rows: 30,
  columns: 23,
  version: 1,
  onResetClick: "{{showAlert('Successfully reset!!', '');}}",
  events: ["onResetClick"],
  elevatedBackground: false,
  size: COMPONENT_SIZE.MEDIUM,
  isVisible: true,
  defaultModel: DEFAULT_MODEL,
  srcDoc: defaultApp.srcDoc,
  uncompiledSrcDoc: defaultApp.uncompiledSrcDoc,
  dynamicTriggerPathList: [{ key: "onResetClick" }],
  responsiveBehavior: ResponsiveBehavior.Fill,
};
