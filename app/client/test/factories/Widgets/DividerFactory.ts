import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const DividerFactory = Factory.Sync.makeFactory<WidgetProps>({
  isVisible: true,
  leftColumn: 8,
  rightColumn: 12,
  topRow: 12,
  bottomRow: 13,
  type: "DIVIDER_WIDGET",
  orientation: "horizontal",
  capType: "nc",
  capSide: 0,
  strokeStyle: "solid",
  dividerColor: "black",
  thickness: 2,
  isLoading: false,
  parentId: "qrqizehc5b",
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Divider${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
