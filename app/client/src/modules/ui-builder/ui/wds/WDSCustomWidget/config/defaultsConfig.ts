import { Colors } from "constants/Colors";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import defaultApp from "../widget/defaultApp";
import { DEFAULT_MODEL } from "../constants";

export const defaultsConfig = {
  widgetName: "Custom",
  rows: 30,
  columns: 23,
  version: 1,
  onResetClick: "{{showAlert('Successfully reset!!', '');}}",
  events: ["onResetClick"],
  isVisible: true,
  defaultModel: DEFAULT_MODEL,
  srcDoc: defaultApp.srcDoc,
  uncompiledSrcDoc: defaultApp.uncompiledSrcDoc,
  theme: "{{appsmith.theme}}",
  dynamicBindingPathList: [{ key: "theme" }],
  dynamicTriggerPathList: [{ key: "onResetClick" }],
  borderColor: Colors.GREY_5,
  borderWidth: "1",
  responsiveBehavior: ResponsiveBehavior.Fill,
  elevatedBackground: false,
};
