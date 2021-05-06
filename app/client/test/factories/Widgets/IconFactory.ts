import * as Factory from "factory.ts";
import { generateReactKey } from "utils/generators";
import { WidgetProps } from "widgets/BaseWidget";

export const IconFactory = Factory.Sync.makeFactory<WidgetProps>({
  rightColumn: 16,
  onClick: "",
  color: "#040627",
  iconName: "cross",
  topRow: 0,
  bottomRow: 1,
  isVisible: true,
  type: "ICON_WIDGET",
  parentId: "dma7flgdrm",
  isLoading: false,
  leftColumn: 15,
  iconSize: 24,
  dynamicBindingPathList: [],
  widgetName: Factory.each((i) => `Icon${i + 1}`),
  widgetId: generateReactKey(),
  renderMode: "CANVAS",
  version: 1,
});
